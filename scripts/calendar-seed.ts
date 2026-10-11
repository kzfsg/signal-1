// npm run calendar:seed
// Puts the demo month's coffee chats on the connected Google Calendar, four weeks from the coming
// Monday. Each event's description carries `signal-agent:<id>` so the app can find it again.
// Safe to re-run: ids already on the calendar are skipped. No invites go out.
import { firstName, meets } from '../src/app/data';
import { book, seededIds, startOf } from '../server/composio';
import { services } from '../server/services';
import type { Chat } from '../server/signal';

if (!services().composio) throw new Error('Set COMPOSIO_API_KEY in .env.local.');
const done = await seededIds();
if (!done) throw new Error('Google Calendar is not connected. Connect it in the app first.');

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const now = new Date();
let added = 0;

for (const m of meets) {
  if (done.has(m.id)) continue;
  const { id, person, week, day, start, minutes } = m;
  const startsAt = startOf(week, day, start, now);
  const chat: Chat = { id, person, week, day, start, minutes, startsAt, email: `${slug(firstName(person.name))}@${slug(person.org)}.example` };
  await book(chat, { start: startsAt, minutes }, `Coffee chat: ${person.name}, ${person.org}`, `${person.role}, ${person.org}.\n\nsignal-agent:${id}`);
  added++;
  console.log(`${added}. ${person.name} ${startsAt}`);
}

console.log(`Added ${added} chats, ${meets.length - added} were already on the calendar.`);
