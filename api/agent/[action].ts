// /api/agent/<action>: the agent's run. One function for both actions, to stay under Vercel's
// per-deployment function limit.
//   GET  chats                 the coffee chats the agent will take: from Google Calendar when it is
//                              connected and seeded, else the demo month on the coming four weeks
//   POST meet { runId, chat }  one full agent-to-agent meeting, as a Meet
import { z } from 'zod';
import { coffeeChats } from '../../server/composio';
import { demoChats } from '../../server/counterparts';
import { actions, body, json, parseInput } from '../../server/http';
import { runMeeting } from '../../server/meet';

const ChatInput = z.object({
  id: z.string().min(1),
  person: z.object({ name: z.string(), role: z.string(), org: z.string(), kind: z.enum(['vc', 'angel', 'founder', 'operator', 'recruiter']) }),
  week: z.number().int(),
  day: z.number().int(),
  start: z.number(),
  minutes: z.number().int().positive(),
  startsAt: z.string(),
  email: z.string().optional()
});

const MeetInput = z.object({ runId: z.string().min(1), chat: ChatInput });

export const { GET, POST } = actions({
  GET: {
    chats: async () => {
      const live = await coffeeChats().catch(e => (console.error('coffeeChats', e), null));
      return json(live?.length ? { source: 'calendar', chats: live } : { source: 'demo', chats: demoChats() });
    }
  },
  POST: {
    meet: async req => {
      const { runId, chat } = parseInput(MeetInput, await body(req));
      return json(await runMeeting(chat, runId));
    }
  }
});
