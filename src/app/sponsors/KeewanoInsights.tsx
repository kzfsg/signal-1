// What every meet adds up to. This month's run is logged to Keewano as events per person, then a live
// query across the whole history surfaces the patterns, and you can ask it anything.
import { useEffect, useState } from 'react';
import { useProfile } from '../profile';
import { api, useApi } from './api';
import { Unavailable } from './DialLine';
import { SponsorTag } from './SponsorTag';

interface Insights {
  total: number;
  met: number;
  converted: number;
  ms: number;
  query: string;
  insights: { headline: string; detail: string; people: { name: string; org: string }[] }[];
}

const RUN_KEY = 'signal.keewano.run';

const SUGGESTED = [
  'Which kinds of people turned into term sheets?',
  'How many people did my agent skip last month?',
  'Who keeps asking for revenue numbers?'
];

export function KeewanoInsights() {
  const { meets } = useProfile();
  const [logged, setLogged] = useState<string | null>(null);
  const insights = useApi<Insights>('keewano/insights');
  const [showQuery, setShowQuery] = useState(false);

  // Log this run's meets once per browser session (the run id makes re-sends idempotent).
  useEffect(() => {
    let run = sessionStorage.getItem(RUN_KEY);
    if (!run) {
      run = crypto.randomUUID();
      sessionStorage.setItem(RUN_KEY, run);
    }
    api<{ people: number; events: number }>('keewano/ingest', {
      run,
      meets: meets.map(m => ({ id: m.id, kind: m.person.kind, verdict: m.verdict, checks: m.checks, withheld: m.withheld, agentSeconds: m.agentSeconds }))
    })
      .then(r => setLogged(`${r.people} meets from this run logged to Keewano`))
      .catch(() => setLogged(null));
  }, [meets]);

  return (
    <section className="sponsor card">
      <header className="sponsor__head">
        <div>
          <SponsorTag name="Keewano" />
          <h2 className="t-headline">What six months of coffees add up to.</h2>
          <p className="t-body t-muted">
            Every meet your agent takes is kept as a timeline per person: what they were, what they asked, what it held back,
            whether you met, what came of it. Keewano reads across all of it.
          </p>
        </div>
        {insights.data && (
          <div className="keewano__totals">
            <div><p className="t-headline">{insights.data.total}</p><p className="t-small t-muted">people screened</p></div>
            <div><p className="t-headline">{insights.data.converted}</p><p className="t-small t-muted">went somewhere</p></div>
          </div>
        )}
      </header>

      {insights.loading && <p className="t-small t-muted">Querying Keewano…</p>}
      {insights.error && <Unavailable error={insights.error} />}

      {insights.data && (
        <>
          <ul className="keewano__list">
            {insights.data.insights.map(i => (
              <li key={i.headline}>
                <p className="t-title">{i.headline}</p>
                <p className="t-small t-muted">{i.detail}</p>
                {i.people.length > 0 && <p className="t-small keewano__people">e.g. {i.people.map(p => `${p.name} (${p.org})`).join(', ')}</p>}
              </li>
            ))}
          </ul>
          <p className="t-small t-muted keewano__meta">
            Live query, {insights.data.ms} ms{logged ? ` · ${logged}` : ''} ·{' '}
            <button className="linklike" onClick={() => setShowQuery(s => !s)}>{showQuery ? 'hide' : 'show'} SQL</button>
          </p>
          {showQuery && <pre className="keewano__sql">{insights.data.query}</pre>}
        </>
      )}

      {!insights.error && <Ask />}
    </section>
  );
}

function Ask() {
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState<{ answer: string; calls: { tool: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ask = async (question: string) => {
    setQ(question);
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      setAnswer(await api('keewano/ask', { question }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="keewano__ask">
      <span className="t-label t-muted">Ask your networking history</span>
      <form className="followup__row" onSubmit={e => { e.preventDefault(); if (q.trim()) ask(q.trim()); }}>
        <input className="followup__phone" value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. Which angels led to a second meeting?" />
        <button className="btn btn--ink btn--sm" disabled={busy || !q.trim()}>{busy ? 'Asking…' : 'Ask'}</button>
      </form>
      <div className="chips">
        {SUGGESTED.map(s => <button key={s} type="button" className="chip" onClick={() => ask(s)} disabled={busy}>{s}</button>)}
      </div>
      {answer && (
        <div className="keewano__answer">
          <p className="t-body">{answer.answer}</p>
          {answer.calls.length > 0 && <p className="t-small t-muted">Answered from {answer.calls.length} live Keewano {answer.calls.length === 1 ? 'query' : 'queries'}: {[...new Set(answer.calls.map(c => c.tool))].join(', ')}</p>}
        </div>
      )}
      {error && <Unavailable error={error} />}
    </div>
  );
}
