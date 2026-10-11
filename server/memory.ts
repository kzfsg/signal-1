// The founder's memory and every meeting's turns. Every write lands in the local store and, when the
// key is set, in KeewanoDB (first 256 characters per event). Reads prefer Keewano and fall back to
// the local copy: Keewano takes minutes to index, so the caller learns which copy answered.
import { randomUUID } from 'node:crypto';
import { HttpError } from './dial';
import { entityId, factEvent, ingest, meetEvents, memoryEvents, sql, turnEvent, counterpartType } from './keewano';
import { keewanoReads, services, userId } from './services';
import type { ContextItem, FounderMemory, Meet } from './signal';
import { readMeeting, readMemory, readStore, writeStore, type Turn } from './store';

export type { Turn };
export type Source = 'keewano' | 'local';

const founder = () => `founder:${userId()}`;
const unix = (iso: string) => Math.floor(Date.parse(iso) / 1000);
const warn = (err: unknown) => console.error('keewano', err);

export async function remember(m: FounderMemory) {
  await writeStore({ memory: m, items: m.items });
  if (services().keewano) await ingest(founder(), `memory:${m.savedAt}`, memoryEvents(m, unix(m.savedAt))).catch(warn);
}

const itemKey = (i: ContextItem) => `${i.source}|${i.title}|${i.at}`;

/** Context imported from a connected app (B calls this). Joins the memory when one is saved. */
export async function addItems(items: ContextItem[]): Promise<ContextItem[]> {
  const store = await readStore();
  const seen = new Set(store.items.map(itemKey));
  const fresh = items.filter(i => !seen.has(itemKey(i)));
  const merged = [...store.items, ...fresh];
  await writeStore({ items: merged, ...(store.memory ? { memory: { ...store.memory, items: merged } } : {}) });
  if (fresh.length && services().keewano) {
    const at = Math.floor(Date.now() / 1000);
    await ingest(founder(), `items:${randomUUID()}`, fresh.map((i, n) => factEvent(i, at + n))).catch(warn);
  }
  return merged;
}

export async function recall(): Promise<{ memory: FounderMemory; source: Source }> {
  if (keewanoReads()) {
    const memory = await recallKeewano().catch(err => (warn(err), null));
    if (memory) return { memory, source: 'keewano' };
  }
  const memory = await readMemory();
  if (!memory) throw new HttpError(409, 'No memory saved yet: finish onboarding (POST /api/memory) first.');
  return { memory, source: 'local' };
}

export type MemoryRow = {
  event_datetime: string | Date;
  memory_saved: number | string | null;
  profile_name: string | null;
  profile_company: string | null;
  profile_pitch: string | null;
  signal_goal: string | null;
  signal_meet: string | null;
  signal_skip: string | null;
  signal_context: string | null;
  memory_fact: string | null;
};

async function recallKeewano() {
  const id = entityId(founder());
  const rows = await sql<MemoryRow>(
    `SELECT event_datetime, memory_saved, profile_name, profile_company, profile_pitch, signal_goal, signal_meet, signal_skip, signal_context, memory_fact
     FROM events
     WHERE user_id = '${id}' AND memory_saved = (SELECT max(memory_saved) FROM events WHERE user_id = '${id}')
     ORDER BY event_datetime`
  );
  return memoryFromRows(rows);
}

/**
 * Keewano columns are step functions: each row carries the latest value of every event type. So a
 * list (goals, facts) is read back as the values that change from one row to the next, starting
 * after the memory_saved row, which still carries the previous save's values.
 */
export function memoryFromRows(rows: MemoryRow[]): FounderMemory | null {
  const first = rows[0];
  if (!first || first.memory_saved == null) return null;
  const changes = (col: keyof MemoryRow) => {
    const out: string[] = [];
    for (let i = 1; i < rows.length; i++) {
      const v = rows[i][col];
      if (typeof v === 'string' && v !== rows[i - 1][col]) out.push(v);
    }
    return out;
  };
  const last = <K extends keyof MemoryRow>(col: K) => rows.map(r => r[col]).filter(v => v != null).at(-1) ?? null;
  const name = last('profile_name');
  if (typeof name !== 'string') return null;
  const facts = changes('memory_fact').map(f => {
    const [source = '', title = '', ...rest] = f.split(': ');
    return { source, title, text: rest.join(': ') };
  });
  const brief: FounderMemory['brief'] = { company: '', funding: '', goals: '', preferences: '', boundaries: '' };
  for (const f of facts) if (f.source === 'brief' && f.title in brief) brief[f.title as keyof typeof brief] = f.text;
  const savedAt = new Date(Number(first.memory_saved) * 1000).toISOString();
  return {
    profile: { name, company: String(last('profile_company') ?? ''), pitch: String(last('profile_pitch') ?? ''), headline: '', location: '', experience: [] },
    signals: { goals: changes('signal_goal'), meet: changes('signal_meet'), skip: changes('signal_skip'), context: String(last('signal_context') ?? '') },
    brief,
    items: facts.filter(f => f.source !== 'brief').map(f => ({ ...f, at: savedAt })),
    savedAt
  };
}

// ── The meeting room's record ───────────────────────────────────────────────────────────────────

const meeting = (id: string) => `meet:${id}`;

/** Full text locally; the first 256 characters to Keewano as batch n of the meeting's session. */
export async function logTurn(meetingId: string, turn: Turn) {
  const turns = [...(await readMeeting(meetingId)), turn];
  await writeStore({ meetings: { [meetingId]: { turns } } });
  if (services().keewano) await ingest(meeting(meetingId), meeting(meetingId), [turnEvent(turn.speaker, turn.text, unix(turn.at))], turns.length).catch(warn);
}

/** The local copy: Keewano holds truncated turns and is minutes behind the room. */
export function readConversation(meetingId: string): Promise<Turn[]> {
  return readMeeting(meetingId);
}

export async function logOutcome(meetingId: string, meet: Meet, a: { kind: string; confidence: number }, bookedSlot?: string) {
  if (!services().keewano) return;
  const failed = meet.checks.filter(c => !c.pass).map(c => c.label);
  const at = Math.floor(Date.now() / 1000);
  const events = meetEvents({ kind: counterpartType(a.kind, failed), channel: 'agent', verdict: meet.verdict, withheld: meet.withheld, failed, agentSeconds: meet.agentSeconds, at });
  const t = events.at(-1)!.at;
  events.push({ name: 'confidence', at: t + 1, data: Math.round(a.confidence) });
  if (bookedSlot) events.push({ name: 'booked_slot', at: t + 2, data: bookedSlot });
  const turns = await readMeeting(meetingId);
  await ingest(meeting(meetingId), meeting(meetingId), events, turns.length + 1).catch(warn);
}
