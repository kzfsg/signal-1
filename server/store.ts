// The operational copy of everything KeewanoDB holds: the founder's memory, imported context, and
// every meeting's full-text turns. One JSON file per meeting, so four meetings in flight never
// overwrite each other's turns. SIGNAL_STORE names the directory (default .signal, /tmp/signal on Vercel).
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ContextItem, FounderMemory } from './signal';

export interface Turn {
  speaker: 'you' | 'them';
  text: string;
  at: string; // ISO
}

export interface Store {
  memory: FounderMemory | null;
  /** Context pulled from connected apps, before and after it is folded into `memory.items`. */
  items: ContextItem[];
  meetings: Record<string, { turns: Turn[] }>;
}

const dir = () => process.env.SIGNAL_STORE ?? (process.env.VERCEL ? '/tmp/signal' : '.signal');
const safe = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '_');
const meetingFile = (id: string) => join(dir(), `meet-${safe(id)}.json`);

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return fallback;
    throw err;
  }
}

// Write then rename: a meeting's recall reads these files while other meetings are writing them.
async function writeJson(file: string, value: unknown) {
  await mkdir(dir(), { recursive: true });
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(value, null, 2));
  await rename(tmp, file);
}

export async function readStore(): Promise<Store> {
  const names = await readdir(dir()).catch(() => [] as string[]);
  const meetings: Store['meetings'] = {};
  for (const n of names.filter(n => n.startsWith('meet-') && n.endsWith('.json'))) {
    const { id, turns } = await readJson<{ id: string; turns: Turn[] }>(join(dir(), n), { id: '', turns: [] });
    if (id) meetings[id] = { turns };
  }
  return {
    memory: await readJson<FounderMemory | null>(join(dir(), 'memory.json'), null),
    items: await readJson<ContextItem[]>(join(dir(), 'items.json'), []),
    meetings
  };
}

export const readMemory = () => readJson<FounderMemory | null>(join(dir(), 'memory.json'), null);

export async function readMeeting(id: string): Promise<Turn[]> {
  return (await readJson<{ turns: Turn[] }>(meetingFile(id), { turns: [] })).turns;
}

/** Write only the keys given; each meeting in the patch replaces its own file. */
export async function writeStore(patch: Partial<Store>) {
  if (patch.memory !== undefined) await writeJson(join(dir(), 'memory.json'), patch.memory);
  if (patch.items) await writeJson(join(dir(), 'items.json'), patch.items);
  for (const [id, m] of Object.entries(patch.meetings ?? {})) await writeJson(meetingFile(id), { id, turns: m.turns });
}
