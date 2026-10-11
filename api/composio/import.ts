// POST /api/composio/import { sources? }: pull context from connected apps and keep it in memory.
import { z } from 'zod';
import { connectorSchema, pullContext } from '../../server/composio';
import { body, json, parseInput, route } from '../../server/http';
import { addItems } from '../../server/memory';

const Body = z.object({ sources: z.array(connectorSchema).optional() });

export const POST = route(async req => {
  const { sources } = parseInput(Body, await body(req));
  const items = await pullContext(sources);
  await addItems(items);
  return json({ items });
});
