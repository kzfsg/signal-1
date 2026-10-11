import { test } from 'node:test';
import assert from 'node:assert/strict';
import { factEvent, memoryEvents, turnEvent } from './keewano';
import type { FounderMemory } from './signal';

test('turn events carry the first 256 characters', () => {
  const long = 'a'.repeat(300);
  assert.deepEqual(turnEvent('you', long, 1700000000), { name: 'turn_you', at: 1700000000, data: 'a'.repeat(256) });
  assert.deepEqual(turnEvent('them', 'Confirmed.', 1700000001), { name: 'turn_them', at: 1700000001, data: 'Confirmed.' });
});

test('a fact is "source: title: text", clipped to 256', () => {
  const e = factEvent({ source: 'gmail', title: 'Re: pilot', text: 'x'.repeat(300) }, 5);
  assert.equal(e.name, 'memory_fact');
  assert.equal((e.data as string).length, 256);
  assert.equal((e.data as string).slice(0, 18), 'gmail: Re: pilot: ');
});

test('memory events start with the save marker and list one goal per event', () => {
  const m: FounderMemory = {
    profile: { name: 'Ari Kapoor', company: 'Tracewell', pitch: 'Tracing for agents', headline: '', location: '', experience: [] },
    signals: { goals: ['Raise a round', 'Find design partners'], meet: ['Seed investors'], skip: ['Recruiters'], context: 'Raising a seed.' },
    brief: { company: 'Tracewell', funding: '', goals: '', preferences: '', boundaries: '' },
    items: [{ source: 'gmail', title: 'Hello', text: 'World', at: '2026-10-01T00:00:00Z' }],
    savedAt: '2026-10-11T00:00:00Z'
  };
  const events = memoryEvents(m, 1000);
  assert.deepEqual(events[0], { name: 'memory_saved', at: 1000, data: 1000 });
  assert.deepEqual(
    events.map(e => e.name),
    ['memory_saved', 'profile_name', 'profile_company', 'profile_pitch', 'signal_goal', 'signal_goal', 'signal_meet', 'signal_skip', 'signal_context', 'memory_fact', 'memory_fact']
  );
  assert.deepEqual(events.at(-2), { name: 'memory_fact', at: 1009, data: 'brief: company: Tracewell' });
  assert.deepEqual(events.at(-1), { name: 'memory_fact', at: 1010, data: 'gmail: Hello: World' });
});
