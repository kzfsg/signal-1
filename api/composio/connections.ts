// GET /api/composio/connections: the status of each connector the founder has started connecting.
import { connections } from '../../server/composio';
import { json, route } from '../../server/http';

export const GET = route(async () => json({ connections: await connections() }));
