import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readMeeting, readStore, writeStore } from './store';
import type { FounderMemory } from './signal';

const memory: FounderMemory = {
  profile: { name: 'Ari Kapoor', company: 'Tracewell', pitch: 'Tracing', headline: '', location: '', experience: [] },
  signals: { goals: ['Raise a round'], meet: [], skip: [], context: '' },
  brief: { company: 'c', funding: 'f', goals: 'g', preferences: 'p', boundaries: 'b' },
  items: [],
  savedAt: '2026-10-11T00:00:00.000Z'
};

test('the store round-trips memory, items and per-meeting turns', async () => {
  process.env.SIGNAL_STORE = await mkdtemp(join(tmpdir(), 'signal-store-'));
  assert.deepEqual(await readStore(), { memory: null, items: [], meetings: {} });

  const turn = { speaker: 'you' as const, text: 'Hi', at: '2026-10-11T00:00:01.000Z' };
  await writeStore({ memory, items: [{ source: 'gmail', title: 't', text: 'x', at: '2026-10-01T00:00:00.000Z' }] });
  await writeStore({ meetings: { 'run1:marcus': { turns: [turn] } } });
  await writeStore({ meetings: { 'run1:dana': { turns: [] } } });

  assert.deepEqual(await readStore(), {
    memory,
    items: [{ source: 'gmail', title: 't', text: 'x', at: '2026-10-01T00:00:00.000Z' }],
    meetings: { 'run1:marcus': { turns: [turn] }, 'run1:dana': { turns: [] } }
  });
  assert.deepEqual(await readMeeting('run1:marcus'), [turn]);
  assert.deepEqual(await readMeeting('never'), []);
});
