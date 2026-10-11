// Which integrations are switched on. A service is live when its env is set; every module picks
// its fallback from this one answer and says so in the Meet trace.
import type { Services } from './signal';

export function services(): Services {
  const e = process.env;
  return {
    fireworks: !!e.FIREWORKS_API_KEY,
    composio: !!e.COMPOSIO_API_KEY,
    keewano: !!e.KEEWANO_API_KEY,
    dial: !!(e.DIAL_API_KEY && e.DIAL_NUMBER_ID && e.DIAL_COUNTERPART_NUMBER_ID)
  };
}

/** Keewano reads need the personal token, not the ingest key. */
export function keewanoReads() {
  const e = process.env;
  return !!(e.KEEWANO_PAT && e.KEEWANO_EMAIL && e.KEEWANO_PROJECT_ID);
}

/** The founder the connections and memory belong to. One founder per deployment. */
export const userId = () => process.env.SIGNAL_USER_ID ?? 'ari';
