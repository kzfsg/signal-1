import { test } from 'node:test';
import assert from 'node:assert/strict';
import { counterpart, demoChats } from './counterparts';

const ari = { name: 'Ari Kapoor', company: 'Tracewell' };

test('a featured counterpart speaks from their reason and their own lines, personalised', () => {
  const c = counterpart('marcus', ari);
  assert.deepEqual(c?.person, { name: 'Marcus Oyelaran', role: 'General Partner', org: 'Lattice Capital', kind: 'vc' });
  assert.deepEqual(c?.facts, [
    'Former staff engineer who has led four devtools seeds. Writes $1–2M checks and is actively looking at agent infrastructure.',
    'Agent infrastructure is our top theme this year. Marcus led seeds in two observability companies and wrote code for a decade before investing.',
    'Very much. Marcus leads at $1–2M and likes bottoms-up adoption. He would want to see the trace viewer and talk to two pilot users.',
    'Partner meeting within two weeks of a first call if it clicks.',
    'Confirmed on our side.'
  ]);
  assert.equal(counterpart('sofia', ari)?.facts[1], "Sofia's looking for a technical cofounder for Bloomly, a wellness app, and wanted Ari's take on hiring engineers.");
});

test('a quick-filter counterpart has only its reason; unknown ids have no counterpart', () => {
  assert.deepEqual(counterpart('m0', ari), { person: { name: 'Ben Aldridge', role: 'Partner', org: 'Cove Ventures', kind: 'vc' }, facts: ['Consumer-only fund.'] });
  assert.equal(counterpart('nobody', ari), null);
});

test('the demo month is 48 chats on the coming four weeks, in calendar order', () => {
  const chats = demoChats(new Date('2026-10-14T12:00:00Z'));
  assert.equal(chats.length, 48);
  assert.equal(chats[0].id, 'dana');
  assert.equal(chats[0].startsAt.slice(0, 10), '2026-10-19');
  assert.equal(chats.at(-1)?.startsAt.slice(0, 10), '2026-11-13');
});
