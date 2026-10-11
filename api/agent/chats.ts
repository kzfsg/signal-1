// GET /api/agent/chats → the coffee chats the agent will take: from Google Calendar when it is
// connected and seeded, else the demo month on the coming four weeks.
import { coffeeChats } from '../../server/composio';
import { demoChats } from '../../server/counterparts';
import { json, route } from '../../server/http';

export const GET = route(async () => {
  const live = await coffeeChats().catch(e => (console.error('coffeeChats', e), null));
  return json(live?.length ? { source: 'calendar', chats: live } : { source: 'demo', chats: demoChats() });
});
