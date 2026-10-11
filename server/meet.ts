// One full meeting: recall → room → filter → (meet) book → log. Produces the Meet the UI renders,
// with a trace of what happened and which service answered at each step.
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { firstName, type Meet, type TraceStep } from '../src/app/data';
import { briefOf } from './agent';
import { book, freeSlots, timezone } from './composio';
import { counterpart, counterpartPrompt, type Counterpart } from './counterparts';
import { HttpError } from './dial';
import { assess, type Assessment } from './filter';
import { logOutcome, readConversation, recall } from './memory';
import { model } from './model';
import { converse, openRoom, speak, type Mark, type Room } from './room';
import { services } from './services';
import type { Chat, Slot } from './signal';

const mmss = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export async function runMeeting(chat: Chat, runId: string): Promise<Meet> {
  const t0 = Date.now();
  const trace: TraceStep[] = [];
  const mark: Mark = (step, detail) => trace.push({ t: mmss(Date.now() - t0), step, detail });
  const meetingId = `${runId}:${chat.id}`;

  const { memory, source } = await recall();
  const first = firstName(memory.profile.name);
  mark('Recalled', source === 'keewano' ? `${first}'s context from KeewanoDB` : `${first}'s context from the local copy; KeewanoDB is still indexing`);

  const c = counterpart(chat.id, memory.profile);
  if (!c) throw new HttpError(404, `No counterpart agent for chat "${chat.id}".`);
  const room = await openRoom(meetingId, briefOf(memory), c);
  const turns = await converse(room, mark);
  mark('Logged', `${turns.length} turns → ${services().keewano ? 'KeewanoDB and the local store' : 'local store'}`);

  const a = await assess(room.brief, c, await readConversation(meetingId));
  mark('Evaluated', `${a.checks.filter(x => x.pass).length} of ${a.checks.length} checks passed`);
  const verdict = a.verdict;
  const booked = verdict === 'meet' ? await schedule(room, chat, a, mark) : undefined;
  const by = a.decidedBy === 'Jev' ? 'Jev' : 'Muse; Jev not configured';
  mark('Verdict', `${verdict === 'meet' ? 'Meet' : 'Skip'}, ${Math.round(a.confidence)}% confidence (decided by ${by})`);

  const meet: Meet = {
    id: chat.id,
    person: c.person,
    week: chat.week,
    day: chat.day,
    start: chat.start,
    minutes: chat.minutes,
    verdict,
    reason: a.reason,
    checks: a.checks,
    agentSeconds: Math.round((Date.now() - t0) / 100) / 10,
    transcript: room.turns.map(t => [t.speaker, t.text]),
    notes: a.notes,
    shared: a.shared,
    withheld: a.withheld,
    trace
  };
  await logOutcome(meetingId, meet, a, booked);
  return meet;
}

// ── Booking ─────────────────────────────────────────────────────────────────────────────────────

const Pick = z.object({
  pick: z.number().int().min(0).describe('Index of the slot that works, 0-based'),
  reply: z.string().describe('One sentence confirming it')
});

const DAY = 86_400_000;

/** Next week at the chat's time, then the following weekdays, when the calendar is not connected. */
export function fallbackSlots(chat: Chat, tz = timezone()): Slot[] {
  const start = Date.parse(chat.startsAt);
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' });
  return [7, 8, 9, 10, 11]
    .map(d => start + d * DAY)
    .filter(ms => !/^S/.test(weekday.format(ms)))
    .slice(0, 3)
    .map(ms => ({ start: new Date(ms).toISOString(), minutes: chat.minutes }));
}

const fmt = (slot: Slot, tz = timezone()) =>
  new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(Date.parse(slot.start)).replace(' AM', 'am').replace(' PM', 'pm');

/** Propose up to three slots, let their agent pick one, book it when the calendar is live. Returns the booked start. */
async function schedule(room: Room, chat: Chat, a: Assessment, mark: Mark): Promise<string> {
  const them = firstName(room.counterpart.person.name);
  const first = firstName(room.brief.name);
  const live = (await freeSlots(new Date(), chat.minutes).catch(() => []));
  const slots = live.length ? live : fallbackSlots(chat);
  await speak(room, 'you', `${first} would like to meet. Would one of these work for ${them}? ${slots.map(s => fmt(s)).join(', ')} (${chat.minutes} minutes).`);
  const choice = await theirPick(room.counterpart, room.brief, slots);
  const slot = slots[Math.min(choice.pick, slots.length - 1)];
  await speak(room, 'them', choice.reply);
  const event = await book(chat, slot, `${first} × ${them}: coffee`, `Set up by Signal after the agents' coffee chat. ${a.reason}`).catch(() => null);
  await speak(room, 'you', `Booked ${fmt(slot)}. ${first} will see ${them} then.`);
  mark('Scheduled', `Proposed ${fmt(slot)}, accepted${event ? ', on Google Calendar' : services().composio ? '' : ' (calendar not connected)'}`);
  return slot.start;
}

async function theirPick(c: Counterpart, brief: { name: string; company: string }, slots: Slot[]) {
  const { output } = await generateText({
    model: model(),
    system: counterpartPrompt(c, brief),
    output: Output.object({ schema: Pick }),
    prompt: `${firstName(brief.name)}'s agent proposed these slots:\n${slots.map((s, i) => `${i}: ${fmt(s)}`).join('\n')}\n\nReturn JSON with exactly these fields: "pick" (number: the 0-based index of the slot that works for ${c.person.name}), "reply" (string: one sentence confirming it).`
  });
  return output;
}
