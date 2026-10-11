// npm run keewano:setup: register Signal's event types with Keewano, then backfill six months of
// the founder's past meets so the insights have a history to work with. Safe to re-run.
// Needs KEEWANO_API_KEY (project → Settings → API Keys, type SDK) in .env.local.
import { pastEvents, pastMeets } from '../server/history';
import { EVENTS_HASH, ingest, registerEvents } from '../server/keewano';

const registered = await registerEvents();
console.log(`event types registered (hash ${EVENTS_HASH}):`, registered);

const people = pastMeets();
let accepted = 0;
for (let i = 0; i < people.length; i += 20) {
  const chunk = people.slice(i, i + 20);
  const results = await Promise.all(chunk.map(p => ingest(p.key, `backfill:${p.key}`, pastEvents(p))));
  accepted += results.reduce((n, r) => n + (r.accepted ?? 0), 0);
  process.stdout.write(`\r${Math.min(i + 20, people.length)}/${people.length} people, ${accepted} events accepted`);
}
console.log('\nDone. Keewano makes events queryable about 5 minutes after ingest.');
if (accepted === 0) console.log('0 accepted usually means this history was already sent (batches are idempotent).');
