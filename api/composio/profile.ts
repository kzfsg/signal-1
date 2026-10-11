// GET /api/composio/profile: name, headline and location from the founder's LinkedIn.
import { linkedinProfile } from '../../server/composio';
import { HttpError, json, route } from '../../server/http';

export const GET = route(async () => {
  const profile = await linkedinProfile();
  if (!profile) throw new HttpError(409, 'LinkedIn is not connected.');
  return json(profile);
});
