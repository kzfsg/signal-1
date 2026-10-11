// POST /api/composio/connect { source }: start OAuth for one connector. Send the user to `redirectUrl`.
import { z } from 'zod';
import { connect, connectorSchema } from '../../server/composio';
import { body, json, parseInput, route } from '../../server/http';

const Body = z.object({ source: connectorSchema });

export const POST = route(async req => {
  const { source } = parseInput(Body, await body(req));
  return json(await connect(source));
});
