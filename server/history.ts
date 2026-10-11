// Six months of the founder's networking before Signal's current run, so Keewano has a history to
// find patterns in. Deterministic (seeded), so re-running the backfill produces the same people and
// Keewano's idempotent batches never double-count them.
import { entityId, meetEvents, type KEvent } from './keewano';

export interface PastMeet {
  key: string;
  name: string;
  org: string;
  kind: string;
  verdict: 'meet' | 'skip';
  met: boolean;
  outcome: 'second_meeting' | 'intro' | 'term_sheet' | 'pilot' | 'came_back' | 'none';
  failed: string[];
  withheld: string[];
  at: number;
}

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

const FIRST = ['Avery', 'Jordan', 'Riley', 'Casey', 'Morgan', 'Quinn', 'Rowan', 'Sage', 'Emery', 'Hayden', 'Parker', 'Reese', 'Blake', 'Drew', 'Jules', 'Kai', 'Noa', 'Remy', 'Sasha', 'Tatum'];
const LAST = ['Abara', 'Brooks', 'Castell', 'Dane', 'Ellery', 'Fujita', 'Garza', 'Holm', 'Ivers', 'Jensen', 'Kowal', 'Lund', 'Mendes', 'Nakamura', 'Osei', 'Pryor', 'Quist', 'Rahman', 'Stroud', 'Tanaka'];

// Who the founder met, and how each kind of person tends to go. These rates are the story the
// insights should surface: technical seed investors and production teams convert; the rest don't.
const MIX: { kind: string; org: string[]; share: number; meetRate: number; second: number; failed: string[] }[] = [
  { kind: 'vc_technical', org: ['Lattice', 'Basin', 'Foundry Point', 'Gradient', 'Stackline'], share: 0.14, meetRate: 0.8, second: 0.62, failed: [] },
  { kind: 'vc_generalist', org: ['Harbor', 'Pine Street', 'Fieldstone', 'Cove', 'Riverbend'], share: 0.18, meetRate: 0.25, second: 0.14, failed: ['Devtools or infra thesis', 'Technical background'] },
  { kind: 'vc_late_stage', org: ['Meridian Growth', 'Summit Growth', 'Granite Peak'], share: 0.08, meetRate: 0.05, second: 0.1, failed: ['Invests at seed'] },
  { kind: 'angel_infra', org: ['ex-Datadog', 'ex-Stripe', 'ex-HashiCorp', 'ex-Vercel'], share: 0.08, meetRate: 0.85, second: 0.55, failed: [] },
  { kind: 'operator_agents_in_prod', org: ['Calder AI', 'Rampart', 'Skyport', 'Northgate'], share: 0.12, meetRate: 0.75, second: 0.58, failed: [] },
  { kind: 'operator_other', org: ['Brightline', 'Fable', 'Quilt'], share: 0.08, meetRate: 0.2, second: 0.12, failed: ['Runs agents in production'] },
  { kind: 'founder_cofounder_search', org: ['Petal', 'Kindred', 'Tidepool'], share: 0.12, meetRate: 0.1, second: 0.05, failed: ['Can help this quarter'] },
  { kind: 'recruiter', org: ['Northstar Talent', 'Hirewise', 'Crewline'], share: 0.1, meetRate: 0.02, second: 0.0, failed: ['Can help this quarter'] },
  { kind: 'vendor', org: ['Outreachly', 'Pipewise', 'Leadflow'], share: 0.1, meetRate: 0.02, second: 0.0, failed: ['Can help this quarter'] }
];

export function pastMeets(count = 320, now = Date.UTC(2026, 9, 1) / 1000): PastMeet[] {
  const r = rng(42);
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const out: PastMeet[] = [];
  for (let i = 0; i < count; i++) {
    let x = r();
    const m = MIX.find(k => (x -= k.share) < 0) ?? MIX[0];
    const verdict = r() < m.meetRate ? 'meet' : 'skip';
    const met = verdict === 'meet' ? r() < 0.9 : r() < 0.08;
    const second = met && r() < m.second;
    const outcome: PastMeet['outcome'] = second
      ? m.kind.startsWith('vc') && r() < 0.25 ? 'term_sheet' : m.kind.startsWith('operator') && r() < 0.4 ? 'pilot' : 'second_meeting'
      : verdict === 'skip' && r() < (m.kind === 'vc_late_stage' ? 0.3 : 0.03) ? 'came_back'
        : met && r() < 0.3 ? 'intro' : 'none';
    out.push({
      key: `past:${i}`,
      name: `${pick(FIRST)} ${pick(LAST)}`,
      org: pick(m.org),
      kind: m.kind,
      verdict,
      met,
      outcome,
      failed: verdict === 'skip' ? m.failed : [],
      withheld: r() < (m.kind.startsWith('vc') ? 0.45 : 0.1) ? ['Revenue figures'] : [],
      at: Math.floor(now - (180 - (i / count) * 180) * 86400 + r() * 3600)
    });
  }
  return out;
}

/** One past meet as Keewano events: the meet itself, then whether they met and what came of it. */
export function pastEvents(p: PastMeet): KEvent[] {
  const events = meetEvents({ kind: p.kind, channel: 'agent', verdict: p.verdict, withheld: p.withheld, failed: p.failed, agentSeconds: 20 + (p.at % 40), at: p.at });
  const later = p.at + 3 * 86400;
  events.push({ name: 'human_met', at: later, data: p.met });
  if (p.outcome !== 'none') events.push({ name: 'outcome', at: later + 7 * 86400, data: p.outcome });
  return events;
}

/** Keewano user_id (UUID) → who it was, for tracing an insight back to people. */
export function directory() {
  return new Map(pastMeets().map(p => [entityId(p.key), { name: p.name, org: p.org, kind: p.kind }]));
}
