import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toE164, verifySignature } from './dial';
import { counterpartType, entityId } from './keewano';

const secret = 'whsec_test';
const body = '{"type":"message.received"}';
const sign = (t: number, b = body) => `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${b}`).digest('hex')}`;

test('accepts a fresh, correctly signed webhook', () => {
  const now = Date.now();
  assert.equal(verifySignature(body, sign(Math.floor(now / 1000)), secret, now), true);
});

test('rejects tampered bodies, stale timestamps and missing headers', () => {
  const now = Date.now();
  const t = Math.floor(now / 1000);
  assert.equal(verifySignature(body + ' ', sign(t), secret, now), false);
  assert.equal(verifySignature(body, sign(t - 301), secret, now), false);
  assert.equal(verifySignature(body, null, secret, now), false);
  assert.equal(verifySignature(body, 't=abc,v1=00', secret, now), false);
});

test('normalises US phone numbers to E.164', () => {
  assert.equal(toE164('(415) 555-0100'), '+14155550100');
  assert.equal(toE164('1 415 555 0100'), '+14155550100');
  assert.equal(toE164('+44 20 7946 0000'), '+442079460000');
  assert.throws(() => toE164('hello'));
});

test('entity ids are stable v5 UUIDs', () => {
  const id = entityId('past:1');
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(id, entityId('past:1'));
  assert.notEqual(id, entityId('past:2'));
});

test('counterpart types split investors by why they missed', () => {
  assert.equal(counterpartType('vc', []), 'vc_technical');
  assert.equal(counterpartType('vc', ['Devtools or infra thesis']), 'vc_generalist');
  assert.equal(counterpartType('vc', ['Invests at seed']), 'vc_late_stage');
  assert.equal(counterpartType('recruiter', ['Can help this quarter']), 'recruiter');
});
