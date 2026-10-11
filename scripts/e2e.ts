// npm run e2e: the live pipeline end to end with no real keys. A fake Fireworks and OpenRouter answer the model
// calls, the store lives in a temp dir, every other service is off, and the route handlers are
// called directly. Exits non-zero on the first failed check.
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startFake } from './fake-fireworks';
import type { Meet } from '../src/app/data';
import type { Chat, FounderMemory, Services } from '../server/signal';
import { readStore } from '../server/store';

const fake = await startFake(0);
process.env.FIREWORKS_API_KEY = 'fake';
process.env.FIREWORKS_BASE_URL = `http://127.0.0.1:${fake.port}`;
process.env.OPENROUTER_API_KEY = 'fake';
process.env.OPENROUTER_BASE_URL = `http://127.0.0.1:${fake.port}`;
process.env.SIGNAL_STORE = await mkdtemp(join(tmpdir(), 'signal-e2e-'));
for (const k of ['COMPOSIO_API_KEY', 'KEEWANO_API_KEY', 'KEEWANO_PAT', 'KEEWANO_EMAIL', 'KEEWANO_PROJECT_ID', 'DIAL_API_KEY', 'DIAL_NUMBER_ID', 'DIAL_COUNTERPART_NUMBER_ID', 'VERCEL'])
  delete process.env[k];

const [status, memory, agent] = await Promise.all([import('../api/status'), import('../api/memory'), import('../api/agent/[action]')]);

const call = async <T>(handler: (req: Request) => Promise<Response>, path: string, body?: unknown): Promise<T> => {
  const res = await handler(new Request(`http://signal${path}`, body ? { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } } : {}));
  const data = (await res.json()) as T & { error?: string };
  assert.equal(res.status, 200, `${path}: ${data.error ?? res.status}`);
  return data;
};

const profile = { name: 'Ari Kapoor', company: 'Tracewell', pitch: 'Open-source tracing for AI agents in production', headline: 'Founder, Tracewell', location: 'SF', experience: ['Staff engineer, Datadog'] };
const signals = {
  goals: ['Raise a round', 'Find design partners'],
  meet: ['Seed investors with a devtools thesis', 'Technical partners', 'Angels from infra companies', 'Teams running agents in production'],
  skip: ['Consumer-only funds', 'Series B+ investors', 'Recruiters', 'People selling tools', 'Founders looking for a cofounder'],
  context: 'Raising a $2.5M seed. 40 teams on the open-source version, 6 paying pilots.'
};
const brief = { company: 'Tracewell traces AI agents step by step.', funding: 'Raising a $2.5M seed.', goals: 'A lead investor and two design partners this quarter.', preferences: 'Technical people who can demo.', boundaries: 'Never share revenue or pilot customer names.' };

// Expected with the fake model: checks fail when the counterpart's lines mention a skip reason.
const EXPECTED: Record<string, Meet['verdict']> = { marcus: 'meet', dana: 'skip', kenji: 'meet', tom: 'skip', m0: 'skip', m2: 'skip' };

try {
  const s = await call<{ services: Services; model: string; decider: string }>(status.GET, '/api/status');
  assert.deepEqual(s.services, { fireworks: true, composio: false, keewano: false, dial: false });
  assert.equal(s.decider, 'Jev');
  console.log(`status: model ${s.model}, decider ${s.decider}, services ${JSON.stringify(s.services)}`);

  await call(memory.POST, '/api/memory', { profile, signals, brief });
  const recalled = await call<{ memory: FounderMemory; source: string }>(memory.GET, '/api/memory');
  assert.equal(recalled.source, 'local');
  assert.equal(recalled.memory.profile.name, 'Ari Kapoor');
  assert.deepEqual(recalled.memory.signals.goals, signals.goals);
  console.log(`memory: saved and recalled from ${recalled.source}`);

  const listed = await call<{ source: string; chats: Chat[] }>(agent.GET, '/api/agent/chats');
  assert.equal(listed.source, 'demo');
  assert.equal(listed.chats.length, 48);
  console.log(`chats: ${listed.chats.length} from ${listed.source}`);

  const picked = Object.keys(EXPECTED).map(id => listed.chats.find(c => c.id === id)!);
  const runId = `e2e-${Date.now()}`;
  const meets = await Promise.all(picked.map(chat => call<Meet>(agent.POST, '/api/agent/meet', { runId, chat })));

  for (const m of meets) {
    const steps = m.trace!.map(t => t.step);
    assert.equal(m.verdict, EXPECTED[m.id], `${m.id} verdict`);
    assert.ok(m.transcript!.length >= 3, `${m.id}: ${m.transcript!.length} transcript lines`);
    assert.ok(m.checks.length >= 1 && m.checks.every(c => typeof c.pass === 'boolean'), `${m.id} checks`);
    assert.ok(steps.includes('Recalled') && steps.includes('Verdict'), `${m.id} trace: ${steps.join(' → ')}`);
    assert.equal(steps.includes('Scheduled'), m.verdict === 'meet', `${m.id} scheduled only on meet`);
    assert.match(m.trace!.find(t => t.step === 'Verdict')!.detail, /decided by Jev/, `${m.id} verdict decided by Jev`);
    assert.ok(m.notes?.summary && m.reason, `${m.id} notes`);
    console.log(`meet ${m.id.padEnd(6)} ${m.verdict.padEnd(4)} ${m.trace!.at(-1)!.detail.padEnd(24)} ${String(m.transcript!.length).padStart(2)} lines  ${m.agentSeconds}s  ${steps.join(' → ')}`);
  }
  const stored = (await readStore()).meetings;
  for (const m of meets) assert.equal(stored[`${runId}:${m.id}`]?.turns.length, m.transcript!.length, `${m.id}: every turn logged to the store`);
  console.log(`store: ${Object.keys(stored).length} meetings logged under ${process.env.SIGNAL_STORE}`);
  console.log(`\nok: ${meets.length} meetings, ${meets.filter(m => m.verdict === 'meet').length} meet / ${meets.filter(m => m.verdict === 'skip').length} skip`);
} catch (err) {
  console.error('\ne2e failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  fake.close();
}
