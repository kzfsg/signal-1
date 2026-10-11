// POST /api/dial/call
//   { to, name, profile }        → the agent phones them to screen the coffee: { id }
//   { id, name, profile }        → the call so far, and the agent's decision once it ends
import { voiceInstruction } from '../../server/agent';
import { agentNumber, dial, HttpError, toE164, viewCall } from '../../server/dial';
import { body, briefFrom, json, route, type ProfileInput } from '../../server/http';
import { logDecision } from '../../server/keewano';

interface Input {
  to?: string;
  id?: string;
  name?: string;
  profile?: ProfileInput;
}

export const POST = route(async req => {
  const { to, id, name = 'them', profile } = await body<Input>(req);
  const client = dial();
  const brief = briefFrom(profile);

  if (id) {
    const view = await viewCall(client, brief, id, name);
    if (view.decision) await logDecision({ contact: view.to, name, channel: 'call', decision: view.decision }).catch(e => console.error('keewano', e));
    return json(view);
  }

  if (!to) throw new HttpError(400, 'Send `to` to start a call, or `id` to check one.');
  const from = await agentNumber(client);
  const call = await client.makeCall({
    to: toE164(to),
    fromNumberId: from.id,
    outboundInstruction: voiceInstruction(brief, name),
    language: 'en-US'
  });
  return json({ id: call.id, from: from.number });
});
