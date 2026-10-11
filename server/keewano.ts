// Keewano keeps every agent meet as an ordered event history per person, and answers questions
// across it: which kinds of people turn into second meetings, who came back after a skip, and so on.
// Writes go to the REST ingest API with the project's SDK key; reads go over Keewano's Postgres wire
// protocol (SQL) or its MCP server, both with a personal access token.
import { createHash, randomUUID } from 'node:crypto';
import { crc32 } from 'node:zlib';
import pg from 'pg';
import { HttpError } from './dial';
import type { Decision } from './agent';

const INGEST = 'https://api.keewano.com/event/ingress/v1/json';
export const MCP_URL = 'https://api.keewano.com/mcp';

// Custom event types. Append only: Keewano never lets a registered id change type, so a new event
// gets a new id and the map gets a new hash.
export const EVENT_TYPES = [
  { eventTypeId: 2000, name: 'counterpart_type', dataType: 'string' },
  { eventTypeId: 2001, name: 'channel', dataType: 'string' },
  { eventTypeId: 2002, name: 'verdict', dataType: 'string' },
  { eventTypeId: 2003, name: 'withheld', dataType: 'string' },
  { eventTypeId: 2004, name: 'failed_check', dataType: 'string' },
  { eventTypeId: 2005, name: 'agent_seconds', dataType: 'uint' },
  { eventTypeId: 2006, name: 'human_met', dataType: 'bool' },
  { eventTypeId: 2007, name: 'outcome', dataType: 'string' }
] as const;

type EventName = (typeof EVENT_TYPES)[number]['name'];
const byName = Object.fromEntries(EVENT_TYPES.map(e => [e.name, e])) as Record<EventName, (typeof EVENT_TYPES)[number]>;

export const EVENTS_HASH = crc32(JSON.stringify(EVENT_TYPES)) || 1;

/** Same string, same UUID (v5, URL namespace), so a person keeps one timeline across runs. */
export function entityId(key: string) {
  const ns = Buffer.from('6ba7b8119dad11d180b400c04fd430c8', 'hex');
  const h = createHash('sha1').update(ns).update(`signal:${key}`).digest();
  h[6] = (h[6] & 0x0f) | 0x50;
  h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString('hex');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

export interface KEvent {
  name: EventName;
  at: number; // unix seconds
  data?: string | number | boolean;
}

function sdkKey() {
  const key = process.env.KEEWANO_API_KEY;
  if (!key) throw new HttpError(503, 'Keewano is not configured: set KEEWANO_API_KEY (run `npm run keewano:setup`).');
  return key;
}

async function post(path: 'in' | 'custom', payload: unknown) {
  const res = await fetch(`${INGEST}/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'k-token': sdkKey() },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) throw new HttpError(502, `Keewano ${path} ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

export function registerEvents() {
  return post('custom', { customEventsHash: EVENTS_HASH, eventTypes: EVENT_TYPES });
}

/**
 * Send one person's events. `session` names this batch of history so a retry is never counted twice;
 * events must be in time order.
 */
export async function ingest(person: string, session: string, events: KEvent[]) {
  if (!events.length) return { received: 0, accepted: 0 };
  const sorted = [...events].sort((a, b) => a.at - b.at);
  const result = await post('in', {
    dataSessionId: entityId(`session:${session}`),
    batch: 1,
    customEventsHash: EVENTS_HASH,
    installId: entityId(person),
    events: sorted.map(e => ({
      eventTypeId: byName[e.name].eventTypeId,
      dataType: byName[e.name].dataType,
      timestamp: Math.floor(e.at),
      ...(e.data === undefined ? {} : { data: e.data })
    }))
  });
  return result as { received: number; accepted: number };
}

/** The events one agent meet produces, in order. */
export function meetEvents(m: {
  kind: string;
  channel: 'agent' | 'call' | 'text';
  verdict: 'meet' | 'skip';
  withheld?: string[];
  failed?: string[];
  agentSeconds?: number;
  at: number;
}): KEvent[] {
  let t = m.at;
  const next = () => (t += 1);
  return [
    { name: 'counterpart_type', at: t, data: m.kind },
    { name: 'channel', at: next(), data: m.channel },
    ...(m.withheld ?? []).map(w => ({ name: 'withheld' as const, at: next(), data: category(w) })),
    ...(m.failed ?? []).map(f => ({ name: 'failed_check' as const, at: next(), data: category(f) })),
    ...(m.agentSeconds ? [{ name: 'agent_seconds' as const, at: next(), data: Math.round(m.agentSeconds) }] : []),
    { name: 'verdict', at: next(), data: m.verdict }
  ];
}

/**
 * The finer-grained type insights group by. A "vc" alone hides the story: technical seed funds
 * convert, generalists and late-stage funds don't. Derived from which checks failed.
 */
export function counterpartType(kind: string, failed: string[]) {
  const f = failed.map(category);
  if (kind === 'vc') return f.includes('invests_at_seed') ? 'vc_late_stage' : f.some(x => x.includes('thesis') || x.includes('technical')) ? 'vc_generalist' : 'vc_technical';
  if (kind === 'angel') return f.length ? 'angel_other' : 'angel_infra';
  if (kind === 'operator') return f.length ? 'operator_other' : 'operator_agents_in_prod';
  if (kind === 'founder') return f.length ? 'founder_cofounder_search' : 'founder_peer';
  return kind;
}

/** Keewano wants categories, not prose: "Revenue figures" → "revenue_figures". Max 256 chars. */
export function category(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 64) || 'other';
}

/** Log a decision the agent made over Dial (text or call), keyed by phone number. */
export async function logDecision(d: { contact: string; name: string; channel: 'call' | 'text'; decision: Decision }) {
  if (!process.env.KEEWANO_API_KEY) return;
  const failed = d.decision.checks.filter(c => !c.pass).map(c => c.label);
  const events = meetEvents({
    kind: counterpartType(d.decision.kind, failed),
    channel: d.channel,
    verdict: d.decision.verdict,
    withheld: d.decision.withheld,
    failed,
    at: Date.now() / 1000
  });
  await ingest(`phone:${d.contact}`, `${d.channel}:${d.contact}:${randomUUID()}`, events);
}

// ── Reads ────────────────────────────────────────────────────────────────────────────────────────

function pgConfig() {
  const { KEEWANO_PAT: password, KEEWANO_EMAIL: user, KEEWANO_PROJECT_ID: database } = process.env;
  if (!password || !user || !database)
    throw new HttpError(503, 'Keewano reads are not configured: set KEEWANO_PAT, KEEWANO_EMAIL and KEEWANO_PROJECT_ID.');
  return { host: 'pgsql.keewano.com', port: 27543, user, password, database, ssl: { rejectUnauthorized: true } };
}

export async function sql<T extends Record<string, unknown>>(query: string): Promise<T[]> {
  const client = new pg.Client(pgConfig());
  await client.connect();
  try {
    const res = await client.query(query);
    return res.rows as T[];
  } finally {
    await client.end().catch(() => {});
  }
}

export function mcpHeaders() {
  const pat = process.env.KEEWANO_PAT;
  if (!pat) throw new HttpError(503, 'Keewano MCP is not configured: set KEEWANO_PAT.');
  return { 'k-token': pat };
}
