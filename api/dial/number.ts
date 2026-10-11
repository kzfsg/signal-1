// GET /api/dial/number: the agent's own phone number.
import { agentNumber, dial } from '../../server/dial';
import { json, route } from '../../server/http';

export const GET = route(async () => {
  const n = await agentNumber(dial());
  return json({
    id: n.id,
    number: n.number,
    capabilities: n.capabilities,
    ready: (n as { setupStatus?: string }).setupStatus !== 'provisioning'
  });
});
