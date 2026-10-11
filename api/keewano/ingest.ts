// POST /api/keewano/ingest { run, meets } → log this month's agent meets to Keewano.
// One person per meet; `run` names this run so sending it again is never counted twice.
import { HttpError, body, json, route } from '../../server/http';
import { counterpartType, ingest, meetEvents } from '../../server/keewano';

interface MeetIn {
  id: string;
  kind: string;
  verdict: 'meet' | 'skip';
  checks: { label: string; pass: boolean }[];
  withheld?: string[];
  agentSeconds: number;
}

export const POST = route(async req => {
  const { run, meets } = await body<{ run?: string; meets?: MeetIn[] }>(req);
  if (!run || !meets?.length) throw new HttpError(400, 'Send `run` and `meets`.');
  const start = Math.floor(Date.now() / 1000) - meets.length * 60;
  const results = await Promise.all(
    meets.map((m, i) => {
      const failed = m.checks.filter(c => !c.pass).map(c => c.label);
      const events = meetEvents({
        kind: counterpartType(m.kind, failed),
        channel: 'agent',
        verdict: m.verdict,
        withheld: m.withheld,
        failed,
        agentSeconds: m.agentSeconds,
        at: start + i * 60
      });
      return ingest(`demo:${m.id}`, `${run}:${m.id}`, events);
    })
  );
  const events = results.reduce((n, r) => n + (r.accepted ?? 0), 0);
  return json({ people: meets.length, events });
});
