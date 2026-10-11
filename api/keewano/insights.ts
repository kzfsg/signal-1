// GET /api/keewano/insights → patterns across every meet Keewano has on record, each traceable to
// the people behind it. One live SQL query over Keewano's per-person event timelines.
import { json, route } from '../../server/http';
import { directory } from '../../server/history';
import { sql } from '../../server/keewano';

const CONVERTED = "outcome = 'second_meeting' OR outcome = 'term_sheet' OR outcome = 'pilot'";

export const QUERY = `SELECT counterpart_type AS kind,
       count(DISTINCT user_id) AS people,
       count(DISTINCT user_id) FILTER (WHERE human_met = TRUE) AS met,
       count(DISTINCT user_id) FILTER (WHERE ${CONVERTED}) AS converted,
       count(DISTINCT user_id) FILTER (WHERE verdict = 'skip') AS skipped,
       count(DISTINCT user_id) FILTER (WHERE outcome = 'came_back') AS came_back,
       count(DISTINCT user_id) FILTER (WHERE withheld = 'revenue_figures') AS asked_revenue
FROM events
WHERE counterpart_type IS NOT NULL
GROUP BY kind
ORDER BY people DESC`;

interface Row {
  kind: string;
  people: number;
  met: number;
  converted: number;
  skipped: number;
  came_back: number;
  asked_revenue: number;
}

export interface Insight {
  headline: string;
  detail: string;
  people: { name: string; org: string }[];
}

const LABEL: Record<string, string> = {
  vc_technical: 'technical seed investors',
  vc_generalist: 'generalist VCs',
  vc_late_stage: 'late-stage funds',
  angel_infra: 'infra angels',
  operator_agents_in_prod: 'teams running agents in production',
  operator_other: 'other operators',
  founder_cofounder_search: 'founders looking for a cofounder',
  recruiter: 'recruiters',
  vendor: 'people selling tools'
};
const label = (k: string) => LABEL[k] ?? k.replace(/_/g, ' ');

export const GET = route(async () => {
  const started = Date.now();
  const rows = (await sql<Record<string, unknown>>(QUERY)).map(r => ({
    kind: String(r.kind),
    people: Number(r.people),
    met: Number(r.met),
    converted: Number(r.converted),
    skipped: Number(r.skipped),
    came_back: Number(r.came_back),
    asked_revenue: Number(r.asked_revenue)
  })) as Row[];
  const ms = Date.now() - started;

  const total = rows.reduce((n, r) => n + r.people, 0);
  const met = rows.reduce((n, r) => n + r.met, 0);
  const converted = rows.reduce((n, r) => n + r.converted, 0);
  const base = met ? converted / met : 0;
  const rate = (r: Row) => (r.met ? r.converted / r.met : 0);

  const insights: Insight[] = [];
  const ranked = rows.filter(r => r.met >= 5).sort((a, b) => rate(b) - rate(a));
  const best = ranked[0];
  const worst = ranked.at(-1);
  if (best && base) {
    insights.push({
      headline: `${cap(label(best.kind))} turn into a second meeting ${(rate(best) / base).toFixed(1)}× more often than average.`,
      detail: `${best.converted} of ${best.met} you met went further, against ${Math.round(base * 100)}% overall.`,
      people: await whoConverted(best.kind)
    });
  }
  if (worst && worst !== best) {
    insights.push({
      headline: `${cap(label(worst.kind))} almost never lead anywhere.`,
      detail: `${worst.converted} of ${worst.met} you met went further. Your agent now skips them by default.`,
      people: []
    });
  }
  const back = rows.filter(r => r.skipped >= 5).sort((a, b) => b.came_back / b.skipped - a.came_back / a.skipped)[0];
  if (back?.came_back) {
    insights.push({
      headline: `Skipped ${label(back.kind)} come back later.`,
      detail: `${back.came_back} of ${back.skipped} reached out again after a "not right now". Worth a quarterly update.`,
      people: []
    });
  }
  const askers = rows.reduce((n, r) => n + r.asked_revenue, 0);
  if (askers) {
    insights.push({
      headline: `${askers} people asked for revenue figures. Your agent held back every time.`,
      detail: `Most of them were ${label([...rows].sort((a, b) => b.asked_revenue - a.asked_revenue)[0].kind)}.`,
      people: []
    });
  }

  return json({ total, met, converted, insights, query: QUERY, ms });
});

async function whoConverted(kind: string) {
  const rows = await sql<{ user_id: string }>(
    `SELECT user_id FROM events WHERE counterpart_type = '${kind.replace(/'/g, '')}' AND (${CONVERTED}) GROUP BY user_id LIMIT 6`
  );
  const dir = directory();
  return rows.map(r => dir.get(r.user_id)).filter((p): p is NonNullable<typeof p> => !!p).map(({ name, org }) => ({ name, org }));
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
