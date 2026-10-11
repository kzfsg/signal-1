// Dial gives the agent its own phone number: it screens people by text or phone call and sends
// the booking confirmation or the kind "not right now" once it has decided.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { DialClient, type Call, type Message } from '@getdial/sdk';
import { decide, type Brief, type Decision, type Turn } from './agent';

export function dial() {
  const apiKey = process.env.DIAL_API_KEY;
  if (!apiKey) throw new HttpError(503, 'Dial is not configured: set DIAL_API_KEY (run `npm run dial:setup`).');
  return new DialClient({ apiKey, userAgent: 'signal/0.1.0' });
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** The agent's line: DIAL_NUMBER_ID if set, otherwise the first number on the account. */
export async function agentNumber(client = dial()) {
  const numbers = await client.listNumbers();
  const id = process.env.DIAL_NUMBER_ID;
  const n = id ? numbers.find(x => x.id === id) : numbers[0];
  if (!n) throw new HttpError(503, 'No Dial number yet: run `npm run dial:setup`.');
  return n;
}

/** The account's own numbers (E.164). Texts between them are the meeting room talking to itself. */
export async function ownNumbers(client: DialClient) {
  return new Set((await client.listNumbers()).map(n => n.number));
}

/** E.164, assuming a US number when there's no country code. */
export function toE164(raw: string) {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  throw new HttpError(400, `"${raw}" doesn't look like a phone number.`);
}

/** A text thread with one person, oldest first, as agent turns. */
export async function thread(client: DialClient, numberId: string, contact: string): Promise<{ turns: Turn[]; messages: Message[] }> {
  const messages = (await client.listMessages({ numberId, contact })).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return { messages, turns: messages.map(m => ({ from: m.direction === 'inbound' ? 'them' : 'agent', text: m.body })) };
}

/** A finished call's transcript as agent turns. */
export function callTurns(call: Call): Turn[] {
  if (call.transcriptTurns?.length) return call.transcriptTurns.map(t => ({ from: t.speaker === 'agent' ? 'agent' : 'them', text: t.text }));
  return call.transcript ? [{ from: 'them', text: call.transcript }] : [];
}

export interface CallView {
  id: string;
  to: string;
  state: string;
  label: string;
  done: boolean;
  turns: Turn[];
  decision: Decision | null;
}

export async function viewCall(client: DialClient, brief: Brief, id: string, who: string): Promise<CallView> {
  const call = await client.getCall(id);
  const done = call.status.state === 'Terminated';
  const turns = callTurns(call);
  const heard = turns.some(t => t.from === 'them');
  return {
    id: call.id,
    to: call.to,
    state: call.status.state,
    label: call.status.label,
    done,
    turns,
    decision: done && heard ? await decide(brief, who, turns) : null
  };
}

/**
 * Check a webhook's X-Dial-Signature (`t=<unix>,v1=<hex>`): HMAC-SHA256 of `${t}.${rawBody}`
 * with the endpoint secret, within five minutes.
 */
export function verifySignature(rawBody: string, header: string | null, secret: string, now = Date.now()) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=', 2) as [string, string]));
  const t = Number(parts.t);
  if (!parts.v1 || !Number.isFinite(t) || Math.abs(now / 1000 - t) >= 300) return false;
  const expected = createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest();
  const given = Buffer.from(parts.v1, 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}
