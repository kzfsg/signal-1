// GET /api/memory → the founder's memory and which copy answered. POST /api/memory → save it;
// context already imported from connected apps joins it.
import { z } from 'zod';
import { body, json, parseInput, route } from '../server/http';
import { recall, remember } from '../server/memory';
import { readStore } from '../server/store';

const MemoryInput = z.object({
  profile: z.object({
    name: z.string().min(1),
    company: z.string(),
    pitch: z.string(),
    headline: z.string().default(''),
    location: z.string().default(''),
    experience: z.array(z.string()).default([])
  }),
  signals: z.object({
    goals: z.array(z.string()),
    meet: z.array(z.string()),
    skip: z.array(z.string()),
    context: z.string().default('')
  }),
  brief: z.object({ company: z.string(), funding: z.string(), goals: z.string(), preferences: z.string(), boundaries: z.string() })
});

export const GET = route(async () => json(await recall()));

export const POST = route(async req => {
  const input = parseInput(MemoryInput, await body(req));
  const { items } = await readStore();
  const memory = { ...input, items, savedAt: new Date().toISOString() };
  await remember(memory);
  return json({ memory, source: 'local' });
});
