// GET /api/status → which services are live and which model the agent runs on, and who makes the meet/skip call.
import { json, route } from '../server/http';
import { decider, MODEL_ID } from '../server/model';
import { services } from '../server/services';

export const GET = route(async () => json({ services: services(), model: MODEL_ID, decider: decider().name }));
