// /api/composio/<action>: the founder's Composio connections. One function for every action, to stay
// under Vercel's per-deployment function limit.
//   POST connect { source }   start OAuth for one connector; send the user to `redirectUrl`
//   GET  connections          the status of each connector the founder has started connecting
//   POST import { sources? }  pull context from connected apps and keep it in memory
//   GET  profile              name, headline and location from the founder's LinkedIn
import { z } from 'zod';
import { connect, connections, connectorSchema, linkedinProfile, pullContext } from '../../server/composio';
import { actions, body, HttpError, json, parseInput } from '../../server/http';
import { addItems } from '../../server/memory';

const Connect = z.object({ source: connectorSchema });
const Import = z.object({ sources: z.array(connectorSchema).optional() });

export const { GET, POST } = actions({
  GET: {
    connections: async () => json({ connections: await connections() }),
    profile: async () => {
      const profile = await linkedinProfile();
      if (!profile) throw new HttpError(409, 'LinkedIn is not connected.');
      return json(profile);
    }
  },
  POST: {
    connect: async req => json(await connect(parseInput(Connect, await body(req)).source)),
    import: async req => {
      const items = await pullContext(parseInput(Import, await body(req)).sources);
      await addItems(items);
      return json({ items });
    }
  }
});
