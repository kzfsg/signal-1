// Composio gives the agent real access to the founder's LinkedIn, Gmail and Google Calendar.
// Tool responses are loosely typed, so everything is parsed into ContextItem / Chat / Slot here.
import { Composio, type ConnectedAccountStatus } from '@composio/core';
import { z } from 'zod';
import { meets } from '../src/app/data';
import { HttpError } from './dial';
import { services, userId } from './services';
import type { Chat, ContextItem, FounderProfile, Slot } from './signal';

// ---------------------------------------------------------------- client

let client: Composio | undefined;
export function composio() {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) throw new HttpError(503, 'Composio is not configured: set COMPOSIO_API_KEY.');
  return (client ??= new Composio({ apiKey }));
}

/** IANA zone the founder's calendar days are read in. */
export function timezone() {
  return process.env.SIGNAL_TIMEZONE ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// ---------------------------------------------------------------- loose JSON

type Json = Record<string, unknown>;

const obj = (v: unknown): Json | undefined => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : undefined);
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined);
const clip = (s: string, max: number) => (s.length > max ? s.slice(0, max) : s);

/** Every array stored under a key matching `key`, at any depth of nested objects. */
function arraysUnder(v: unknown, key: RegExp, depth = 0): unknown[][] {
  const o = obj(v);
  if (!o || depth > 4) return [];
  return Object.entries(o).flatMap(([k, x]) => (Array.isArray(x) && key.test(k) ? [x] : arraysUnder(x, key, depth + 1)));
}

/** The first string stored under `key`, breadth first. */
function stringUnder(v: unknown, key: string): string | undefined {
  for (let level: unknown[] = [v], depth = 0; level.length && depth <= 4; depth++) {
    const objs = level.map(obj).filter((o): o is Json => Boolean(o));
    const hit = objs.map(o => str(o[key])).find(Boolean);
    if (hit) return hit;
    level = objs.flatMap(o => Object.values(o));
  }
}

/** Scalar string leaves of a nested object, keyed by lowercase letters only (first one wins). */
function leaves(v: unknown, out: Record<string, string> = {}, depth = 0): Record<string, string> {
  const o = obj(v);
  if (!o || depth > 4) return out;
  for (const [k, x] of Object.entries(o)) {
    const text = str(x);
    const name = k.toLowerCase().replace(/[^a-z]/g, '');
    if (text) out[name] ??= text;
    else leaves(x, out, depth + 1);
  }
  return out;
}

// ---------------------------------------------------------------- connectors

export type ConnectorId = 'linkedin' | 'gmail' | 'google-calendar'; // values of SourceId in src/app/memoryData.ts
export type ConnectionStatus = 'active' | 'pending' | 'failed';
export interface Connection {
  source: ConnectorId;
  status: ConnectionStatus;
}

interface Connector {
  toolkit: string; // Composio toolkit slug, lowercase
  pull(): Promise<ContextItem[]>;
}

export const CONNECTORS: Record<ConnectorId, Connector> = {
  linkedin: {
    toolkit: 'linkedin',
    async pull() {
      const p = await linkedinProfile();
      const text = [p?.name, p?.headline, p?.location].filter(Boolean).join('. ');
      return text ? [{ source: 'linkedin', title: 'LinkedIn profile', text: clip(text, 1000), at: new Date().toISOString() }] : [];
    }
  },
  gmail: {
    toolkit: 'gmail',
    async pull() {
      const data = await call(await need('gmail'), 'GMAIL_FETCH_EMAILS', { query: 'newer_than:30d', max_results: 25 });
      return emailItems(data);
    }
  },
  'google-calendar': {
    toolkit: 'googlecalendar',
    async pull() {
      const now = Date.now();
      const events = await listEvents(await need('google-calendar'), new Date(now - 30 * DAY), new Date(now));
      return eventItems(events);
    }
  }
};

const CONNECTOR_IDS = Object.keys(CONNECTORS) as ConnectorId[];
export const connectorSchema = z.enum(CONNECTOR_IDS as [ConnectorId, ...ConnectorId[]]);

const STATUS: Record<ConnectedAccountStatus, ConnectionStatus> = {
  INITIALIZING: 'pending',
  INITIATED: 'pending',
  ACTIVE: 'active',
  FAILED: 'failed',
  EXPIRED: 'failed',
  INACTIVE: 'failed',
  REVOKED: 'failed'
};

interface Account extends Connection {
  id: string;
}

interface AccountRow {
  id: string;
  status: ConnectedAccountStatus;
  toolkit: { slug: string };
  createdAt: string;
}

/** The newest account per connector. An older active account does not count once a newer attempt exists. */
export function latestAccounts(rows: AccountRow[]): Account[] {
  const newestFirst = [...rows].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return CONNECTOR_IDS.flatMap(source => {
    const row = newestFirst.find(r => r.toolkit.slug.toLowerCase() === CONNECTORS[source].toolkit);
    return row ? [{ source, id: row.id, status: STATUS[row.status] ?? 'failed' }] : [];
  });
}

async function accounts(): Promise<Account[]> {
  const res = await composio().connectedAccounts.list({
    userIds: [userId()],
    toolkitSlugs: CONNECTOR_IDS.map(s => CONNECTORS[s].toolkit),
    limit: 50
  });
  return latestAccounts(res.items);
}

/** The connected account to run a connector's tools as, or null when it is not connected (or Composio is off). */
async function accountOf(source: ConnectorId) {
  if (!services().composio) return null;
  return (await accounts()).find(a => a.source === source && a.status === 'active')?.id ?? null;
}

async function need(source: ConnectorId) {
  const id = await accountOf(source);
  if (!id) throw new HttpError(409, `${source} is not connected.`);
  return id;
}

async function call(account: string, slug: string, args: Json): Promise<Json> {
  const r = await composio().tools.execute(
    slug,
    { userId: userId(), connectedAccountId: account, arguments: args, dangerouslySkipVersionCheck: true },
    { signal: AbortSignal.timeout(30_000) }
  );
  if (!r.successful) throw new HttpError(502, `Composio ${slug} failed: ${r.error ?? 'unknown error'}`);
  return r.data;
}

/** Start OAuth for a connector. Send the user to `redirectUrl`, then poll `connections()` until active. */
export async function connect(source: ConnectorId): Promise<{ redirectUrl: string; id: string }> {
  const req = await composio().toolkits.authorize(userId(), CONNECTORS[source].toolkit);
  if (!req.redirectUrl) throw new HttpError(502, `Composio gave no sign-in link for ${source}.`);
  return { redirectUrl: req.redirectUrl, id: req.id };
}

export async function connections(): Promise<Connection[]> {
  return (await accounts()).map(({ source, status }) => ({ source, status }));
}

/** Items from the given sources (default all), skipping ones that are not connected. */
export async function pullContext(sources: ConnectorId[] = CONNECTOR_IDS): Promise<ContextItem[]> {
  const active = new Set((await connections()).filter(c => c.status === 'active').map(c => c.source));
  const chosen = sources.filter(s => active.has(s));
  const results = await Promise.allSettled(chosen.map(s => CONNECTORS[s].pull()));
  const failed = results.flatMap(r => (r.status === 'rejected' ? [r.reason] : []));
  failed.forEach(e => console.error('pullContext', e));
  if (failed.length && failed.length === results.length) throw failed[0];
  return results.flatMap(r => (r.status === 'fulfilled' ? r.value : []));
}

// ---------------------------------------------------------------- LinkedIn

/** Name, headline and location from a LINKEDIN_GET_MY_INFO response (field names are unconfirmed, so match loosely). */
export function profileOf(data: Json): Partial<FounderProfile> {
  const f = leaves(data);
  const name = f.name ?? f.fullname ?? ([f.firstname ?? f.givenname ?? f.localizedfirstname, f.lastname ?? f.familyname ?? f.localizedlastname].filter(Boolean).join(' ') || undefined);
  const headline = f.headline ?? f.localizedheadline;
  const location = f.location ?? f.locationname;
  return {
    ...(name && { name }),
    ...(headline && { headline }),
    ...(location && { location })
  };
}

export async function linkedinProfile(): Promise<Partial<FounderProfile> | null> {
  const account = await accountOf('linkedin');
  return account ? profileOf(await call(account, 'LINKEDIN_GET_MY_INFO', {})) : null;
}

// ---------------------------------------------------------------- Gmail

/** One item per message: subject and a snippet. Newest first. */
export function emailItems(data: Json, now = new Date()): ContextItem[] {
  return arraysUnder(data, /^messages$/)
    .flat()
    .flatMap(m => {
      const o = obj(m);
      if (!o) return [];
      const title = str(o.subject);
      const preview = str(o.preview) ?? str(obj(o.preview)?.body);
      const text = preview ?? str(o.messageText);
      if (!title && !text) return [];
      const at = new Date(str(o.messageTimestamp) ?? now);
      return [{ source: 'gmail', title: title ?? '(no subject)', text: clip(text ?? '', 1000), at: (Number.isNaN(at.getTime()) ? now : at).toISOString() }];
    })
    .sort((a, b) => b.at.localeCompare(a.at));
}

// ---------------------------------------------------------------- Google Calendar events

const DAY = 86_400_000;

/** A calendar event reduced to what Signal reads. `start` / `end` are RFC3339 with offset; all-day events have none. */
export interface CalEvent {
  summary: string;
  description: string;
  start?: string;
  end?: string;
  emails: string[];
}

export function parseEvents(data: Json): CalEvent[] {
  return arraysUnder(data, /^(items|events)$/)
    .flat()
    .flatMap(v => {
      const o = obj(v);
      if (!o) return [];
      const time = (t: unknown) => str(t) ?? str(obj(t)?.dateTime);
      const emails = (Array.isArray(o.attendees) ? o.attendees : []).flatMap(a => str(obj(a)?.email) ?? str(a) ?? []);
      return [{ summary: str(o.summary) ?? '', description: str(o.description) ?? '', start: time(o.start), end: time(o.end), emails }];
    });
}

async function listEvents(account: string, from: Date, to: Date): Promise<CalEvent[]> {
  const events: CalEvent[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 3; page++) {
    const data = await call(account, 'GOOGLECALENDAR_EVENTS_LIST', {
      calendarId: 'primary',
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      singleEvents: true,
      maxResults: 250,
      ...(pageToken && { pageToken })
    });
    events.push(...parseEvents(data));
    pageToken = stringUnder(data, 'nextPageToken');
    if (!pageToken) break;
  }
  return events;
}

/** Past events as context: title and description. Newest first, at most 50. */
export function eventItems(events: CalEvent[], now = new Date()): ContextItem[] {
  return events
    .filter(e => e.summary)
    .map(e => ({
      source: 'google-calendar',
      title: e.summary,
      text: clip(e.description || `Calendar event: ${e.summary}`, 1000),
      at: new Date(e.start && !Number.isNaN(Date.parse(e.start)) ? e.start : now).toISOString()
    }))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 50);
}

// ---------------------------------------------------------------- wall-clock time

/** A calendar day and minute of day with no zone attached. `day` is days since 1970-01-01. */
interface Wall {
  day: number;
  minutes: number;
}

const formats = new Map<string, Intl.DateTimeFormat>();

/** The wall clock in `tz` at instant `ms`. */
function wallIn(ms: number, tz: string): Wall {
  let f = formats.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
    formats.set(tz, f);
  }
  const p = Object.fromEntries(f.formatToParts(ms).map(x => [x.type, Number(x.value)]));
  return { day: Date.UTC(p.year, p.month - 1, p.day) / DAY, minutes: p.hour * 60 + p.minute };
}

/** The wall clock written in an RFC3339 string, ignoring its offset. */
function wallOf(iso: string): Wall | undefined {
  const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(iso);
  return m ? { day: Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY, minutes: +m[4] * 60 + +m[5] } : undefined;
}

/** The instant at which `tz` shows wall clock `w`. */
function instantAt(w: Wall, tz: string): number {
  const target = w.day * 1440 + w.minutes;
  let ms = target * 60_000;
  for (let i = 0; i < 2; i++) {
    const got = wallIn(ms, tz);
    ms += (target - (got.day * 1440 + got.minutes)) * 60_000;
  }
  return ms;
}

/** `YYYY-MM-DDTHH:MM:SS` for a wall clock (Composio's start_datetime format). */
const localString = (w: Wall) => new Date(w.day * DAY + w.minutes * 60_000).toISOString().slice(0, 19);

/** Weekday of a day number, 0 = Monday. */
const weekday = (day: number) => (day + 3) % 7;

/** The Monday of the coming week as a day number: today when it is a Monday. */
function comingMonday(now: Date, tz: string) {
  const today = wallIn(now.getTime(), tz).day;
  return today + ((7 - weekday(today)) % 7);
}

/** When a calendar slot (week 0-3, day 0-4, hour like 10.5) falls, counted from the coming Monday. ISO. */
export function startOf(week: number, day: number, start: number, now = new Date(), tz = timezone()) {
  const w = { day: comingMonday(now, tz) + week * 7 + day, minutes: Math.round(start * 60) };
  return new Date(instantAt(w, tz)).toISOString();
}

// ---------------------------------------------------------------- coffee chats

const DEMO = new Map(meets.map(m => [m.id, m]));
const MARKER = /signal-agent:([\w-]+)/;

/**
 * Events seeded by `signal-agent:<demo id>` as chats. Week, day and start are the event's own wall
 * clock counted from the coming Monday; weekends and anything outside the four weeks are dropped.
 */
export function chatsFrom(events: CalEvent[], now = new Date(), tz = timezone()): Chat[] {
  const monday = comingMonday(now, tz);
  const seen = new Set<string>();
  const chats = events.flatMap((e): Chat[] => {
    const id = MARKER.exec(e.description)?.[1];
    const meet = id ? DEMO.get(id) : undefined;
    const wall = e.start ? wallOf(e.start) : undefined;
    if (!id || !meet || !wall || !e.start || seen.has(id)) return [];
    const offset = wall.day - monday;
    const week = Math.floor(offset / 7);
    const day = offset - week * 7;
    if (offset < 0 || week > 3 || day > 4) return [];
    const length = e.end ? (Date.parse(e.end) - Date.parse(e.start)) / 60_000 : NaN;
    seen.add(id);
    return [{
      id,
      person: meet.person,
      week,
      day,
      start: Math.round(wall.minutes / 30) / 2,
      minutes: length > 0 ? length : 30,
      startsAt: new Date(e.start).toISOString(),
      ...(e.emails[0] && { email: e.emails[0] })
    }];
  });
  return chats.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** The founder's coffee chats for the next four weeks, or null when Google Calendar is not connected. */
export async function coffeeChats(now = new Date()): Promise<Chat[] | null> {
  const account = await accountOf('google-calendar');
  if (!account) return null;
  const monday = new Date(instantAt({ day: comingMonday(now, timezone()), minutes: 0 }, timezone()));
  const events = await listEvents(account, new Date(+monday - DAY), new Date(+monday + 29 * DAY));
  return chatsFrom(events, now);
}

/** Demo ids already on the calendar, anywhere within a wide window, so seeding can skip them. Null when not connected. */
export async function seededIds(now = new Date()): Promise<Set<string> | null> {
  const account = await accountOf('google-calendar');
  if (!account) return null;
  const events = await listEvents(account, new Date(+now - 14 * DAY), new Date(+now + 60 * DAY));
  return new Set(events.flatMap(e => MARKER.exec(e.description)?.[1] ?? []));
}

// ---------------------------------------------------------------- free slots and booking

export interface Gap {
  start: number; // ms
  end: number;
}

const HALF_HOUR = 30 * 60_000;

/** Intervals found in `{ start, end }` objects (RFC3339 strings). */
function gapsIn(arrays: unknown[][]): Gap[] {
  return arrays.flat().flatMap(v => {
    const o = obj(v);
    const start = Date.parse(str(o?.start) ?? str(o?.start_time) ?? '');
    const end = Date.parse(str(o?.end) ?? str(o?.end_time) ?? '');
    return start < end ? [{ start, end }] : [];
  });
}

/** Free gaps inside [from, to] from a FIND_FREE_SLOTS response: its free list, or the complement of its busy list. */
export function freeGaps(data: Json, from: number, to: number): Gap[] {
  const free = gapsIn(arraysUnder(data, /^free/i));
  if (free.length) return free;
  const busyLists = arraysUnder(data, /busy/i);
  if (!busyLists.length) return [];
  const gaps: Gap[] = [];
  let cursor = from;
  for (const b of gapsIn(busyLists).sort((a, b) => a.start - b.start)) {
    if (b.start > cursor) gaps.push({ start: cursor, end: Math.min(b.start, to) });
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < to) gaps.push({ start: cursor, end: to });
  return gaps.filter(g => g.start < g.end);
}

/**
 * Up to three starts on the half hour, on different weekdays, each fitting `minutes` inside 9:00-17:00
 * (wall clock in `tz`) within one gap. The earliest fit on each day.
 */
export function pickSlots(gaps: Gap[], minutes: number, tz = timezone()): Slot[] {
  const days = new Set<number>();
  const slots: Slot[] = [];
  const candidates = gaps
    .flatMap(g => {
      const starts: number[] = [];
      for (let t = Math.ceil(g.start / HALF_HOUR) * HALF_HOUR; t + minutes * 60_000 <= g.end; t += HALF_HOUR) starts.push(t);
      return starts;
    })
    .sort((a, b) => a - b);
  for (const t of candidates) {
    const w = wallIn(t, tz);
    if (weekday(w.day) > 4 || w.minutes % 30 || w.minutes < 9 * 60 || w.minutes + minutes > 17 * 60 || days.has(w.day)) continue;
    days.add(w.day);
    slots.push({ start: new Date(t).toISOString(), minutes });
    if (slots.length === 3) break;
  }
  return slots;
}

/** Up to three open starts in the week after `after`. Empty when Google Calendar is not connected. */
export async function freeSlots(after: Date, minutes: number): Promise<Slot[]> {
  const account = await accountOf('google-calendar');
  if (!account) return [];
  const from = after.getTime();
  const to = from + 7 * DAY;
  const tz = timezone();
  const data = await call(account, 'GOOGLECALENDAR_FIND_FREE_SLOTS', {
    items: ['primary'],
    time_min: new Date(from).toISOString(),
    time_max: new Date(to).toISOString(),
    timezone: tz
  });
  const clipped = freeGaps(data, from, to).map(g => ({ start: Math.max(g.start, from), end: Math.min(g.end, to) }));
  return pickSlots(clipped, minutes, tz);
}

/** Put the meeting on the founder's calendar. Null when Google Calendar is not connected. */
export async function book(chat: Chat, slot: Slot, summary: string, description: string): Promise<{ id: string } | null> {
  const account = await accountOf('google-calendar');
  if (!account) return null;
  const tz = timezone();
  const start = wallIn(Date.parse(slot.start), tz);
  const data = await call(account, 'GOOGLECALENDAR_CREATE_EVENT', {
    summary,
    description,
    timezone: tz,
    start_datetime: localString(start),
    end_datetime: localString({ day: start.day, minutes: start.minutes + slot.minutes }),
    send_updates: 'none',
    ...(chat.email && { attendees: [chat.email] })
  });
  return { id: stringUnder(data, 'id') ?? '' };
}
