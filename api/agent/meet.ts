// POST /api/agent/meet { runId, chat } → one full agent-to-agent meeting, as a Meet.
import { z } from 'zod';
import { body, json, parseInput, route } from '../../server/http';
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

export const POST = route(async req => {
  const { runId, chat } = parseInput(MeetInput, await body(req));
  return json(await runMeeting(chat, runId));
});
