// POST /api/dial/webhook: Dial events for the agent's number.
// A text from someone new starts a screening by text: the agent reads the whole thread, decides
// meet or skip once it has heard enough, and replies. Calls are decided when their transcript lands.
import { decide, defaultBrief } from '../../server/agent';
import { callTurns, dial, thread, verifySignature } from '../../server/dial';
import { json, route } from '../../server/http';
import { logDecision } from '../../server/keewano';

interface Event {
  type: string;
  data: { messageId?: string; from?: string; body?: string; source?: string; callId?: string; direction?: string };
}

// Ask at most this many questions by text before deciding.
const MAX_QUESTIONS = 2;

export const POST = route(async req => {
  const raw = await req.text();
  const secret = process.env.DIAL_WEBHOOK_SECRET;
  if (!secret || !verifySignature(raw, req.headers.get('x-dial-signature'), secret)) return json({ error: 'bad signature' }, 401);

  const event = JSON.parse(raw) as Event;
  const client = dial();

  if (event.type === 'message.received' && event.data.source !== 'internal' && event.data.messageId && event.data.from) {
    const from = event.data.from;
    const numberId = process.env.DIAL_NUMBER_ID ?? (await client.listNumbers())[0].id;
    const { turns } = await thread(client, numberId, from);
    const asked = turns.filter(t => t.from === 'agent').length;

    // Ask the qualifying questions first, then decide on the whole thread.
    if (asked < MAX_QUESTIONS) {
      await client.replyToMessage(event.data.messageId, { body: nextQuestion(asked) });
    } else {
      const decision = await decide(defaultBrief, from, turns);
      await client.replyToMessage(event.data.messageId, { body: decision.reply });
      await logDecision({ contact: from, name: from, channel: 'text', decision }).catch(e => console.error('keewano', e));
    }
  }

  if (event.type === 'call.transcribed' && event.data.callId) {
    const call = await client.getCall(event.data.callId);
    const contact = call.direction === 'inbound' ? call.from : call.to;
    const turns = callTurns(call);
    if (turns.some(t => t.from === 'them')) {
      const decision = await decide(defaultBrief, contact, turns);
      await client.sendMessage({ to: contact, fromNumberId: call.phoneNumberId, body: decision.reply });
      await logDecision({ contact, name: contact, channel: 'call', decision }).catch(e => console.error('keewano', e));
    }
  }

  return json({ ok: true });
});

function nextQuestion(asked: number) {
  return [
    `Hi! I'm ${defaultBrief.name}'s assistant at Signal. ${defaultBrief.name.split(' ')[0]} takes coffees through me first so nobody's hour gets wasted. What are you hoping to get out of meeting?`,
    'Thanks! And what do you work on or invest in, and is there something you could help with this quarter?'
  ][asked];
}
