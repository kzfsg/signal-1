// POST /api/dial/message { to, body } → text someone from the agent's number
// (the booking confirmation after a meet, or the kind "not right now" after a skip).
import { agentNumber, dial, HttpError, toE164 } from '../../server/dial';
import { body, json, route } from '../../server/http';

export const POST = route(async req => {
  const input = await body<{ to?: string; body?: string }>(req);
  if (!input.to || !input.body?.trim()) throw new HttpError(400, 'Send `to` and `body`.');
  const client = dial();
  const from = await agentNumber(client);
  const message = await client.sendMessage({ to: toE164(input.to), fromNumberId: from.id, body: input.body.trim() });
  return json({ id: message.id, status: message.status, channel: message.channel, from: from.number });
});
