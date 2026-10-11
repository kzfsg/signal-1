// GET /api/dial/inbox: the agent's recent text threads, newest first, for the live inbox panel.
import { agentNumber, dial } from '../../server/dial';
import { json, route } from '../../server/http';

export const GET = route(async () => {
  const client = dial();
  const n = await agentNumber(client);
  const messages = await client.listMessages({ numberId: n.id });
  const threads = new Map<string, { contact: string; messages: { from: 'them' | 'agent'; text: string; at: string }[] }>();
  for (const m of [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const contact = m.direction === 'inbound' ? m.from : (m.to ?? '');
    if (!contact) continue;
    const t = threads.get(contact) ?? { contact, messages: [] };
    t.messages.push({ from: m.direction === 'inbound' ? 'them' : 'agent', text: m.body, at: m.createdAt });
    threads.set(contact, t);
  }
  const list = [...threads.values()].sort((a, b) => b.messages.at(-1)!.at.localeCompare(a.messages.at(-1)!.at));
  return json({ number: n.number, threads: list.slice(0, 12) });
});
