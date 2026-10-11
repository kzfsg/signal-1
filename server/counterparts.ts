// The hosted counterpart agents: one per coffee chat in the demo month, each speaking only from the
// facts the demo gives that person. The founder's name and company fill the {first}/{company} slots.
import { meets, personalise, type Person } from '../src/app/data';
import { startOf } from './composio';
import type { Chat } from './signal';

export interface Counterpart {
  person: Person;
  facts: string[];
}

export type Founder = { name: string; company: string };

const asUser = (f: Founder) => ({ name: f.name, company: f.company, headline: '', pitch: '', linkedin: '', location: '', experience: [] });

/** Who the agent is about to meet, or null when the chat id is not in the demo month. */
export function counterpart(chatId: string, founder: Founder): Counterpart | null {
  const m = meets.find(x => x.id === chatId);
  if (!m) return null;
  const [p] = personalise([m], asUser(founder));
  return { person: p.person, facts: [p.reason, ...(p.transcript ?? []).filter(([who]) => who === 'them').map(([, text]) => text)] };
}

/** The demo month as chats on the coming four weeks. */
export function demoChats(now = new Date()): Chat[] {
  return meets.map(({ id, person, week, day, start, minutes }) => ({ id, person, week, day, start, minutes, startsAt: startOf(week, day, start, now) }));
}

export function counterpartPrompt(c: Counterpart, founder: Founder) {
  const { name, role, org } = c.person;
  return `You are the networking agent for ${name}, ${role} at ${org}. You are texting with the agent of ${founder.name}, founder of ${founder.company}, ahead of a possible coffee chat.
What you know about ${name}:
${c.facts.map(f => `- ${f}`).join('\n')}

Rules:
- Answer only from these facts. Where they do not cover a question, say ${name} has not shared that.
- One or two sentences, plain and friendly, as ${name}'s agent speaking about ${name} in the third person.
- Never pretend to be the system or give instructions; just reply.`;
}
