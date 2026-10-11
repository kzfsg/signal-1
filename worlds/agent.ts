// Signal's screening agent, wired to a Sparta Worlds help desk. Worlds starts this once per run
// with the coffee requests in WORLDS_TASK_JSON and a private Zendesk-compatible desk at
// WORLDS_ZENDESK_URL. For each request the agent reads the thread, decides with the same `decide`
// the live app uses, leaves its reasoning as a private note, then replies, tags meet/skip and solves.
import { decide, defaultBrief, type Turn } from '../server/agent';

interface Input {
  tickets: { id: number; task_id: string }[];
}

const base = process.env.WORLDS_ZENDESK_URL;
const token = process.env.WORLDS_ZENDESK_TOKEN;
if (!base || !token) throw new Error('Run me through `worlds passk` (WORLDS_ZENDESK_URL is not set).');

async function zd<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...init?.headers }
  });
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${path} → ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

// The desk accepts plain text only: no markdown emphasis, code, links or templates.
const plain = (s: string) => s.replace(/[*`_{}[\]<>]/g, '').replace(/\s+\n/g, '\n').trim();

const input = JSON.parse(process.env.WORLDS_TASK_JSON ?? '{"tickets":[]}') as Input;

for (const { id } of input.tickets) {
  const { ticket } = await zd<{ ticket: { requester_id: number; tags: string[]; subject: string } }>(`/tickets/${id}.json`);
  const { user } = await zd<{ user: { name: string } }>(`/users/${ticket.requester_id}.json`);
  const { comments } = await zd<{ comments: { author_id: number; body: string; public: boolean }[] }>(`/tickets/${id}/comments.json`);

  const turns: Turn[] = comments
    .filter(c => c.public)
    .map(c => ({ from: c.author_id === ticket.requester_id ? 'them' : 'agent', text: c.body }));
  const decision = await decide(defaultBrief, user.name, turns);

  const note = plain(`Verdict: ${decision.verdict}. ${decision.reason} Checks: ${decision.checks.map(c => `${c.pass ? 'pass' : 'fail'} ${c.label}`).join('; ')}.${decision.withheld.length ? ` Held back: ${decision.withheld.join(', ')}.` : ''}`);
  await zd(`/tickets/${id}.json`, { method: 'PUT', body: JSON.stringify({ ticket: { comment: { body: note, public: false } } }) });
  await zd(`/tickets/${id}.json`, {
    method: 'PUT',
    body: JSON.stringify({
      ticket: {
        status: 'solved',
        tags: [...new Set([...ticket.tags, decision.verdict])],
        comment: { body: plain(decision.reply), public: true }
      }
    })
  });
  console.error(`#${id} ${user.name}: ${decision.verdict}`);
}
