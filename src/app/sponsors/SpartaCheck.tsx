// Before the agent meets anyone real: its results from Sparta Worlds, where it was tested against
// simulated people with known right answers (npm run sparta writes sparta-report.json).
import { useEffect, useState } from 'react';
import report from '../sparta-report.json';
import { useProfile } from '../profile';
import { Avatar, VerdictBadge } from '../parts';
import type { Kind } from '../data';
import { SponsorTag } from './SponsorTag';
import './sponsors.css';

export default function SpartaCheck({ onDone }: { onDone: () => void }) {
  const { first } = useProfile();
  const [shown, setShown] = useState(0);

  // Reveal the scenarios one by one, like the test replaying.
  useEffect(() => {
    if (shown >= report.tasks.length) return;
    const t = window.setTimeout(() => setShown(s => s + 1), shown === 0 ? 300 : 260);
    return () => clearTimeout(t);
  }, [shown]);

  const done = shown >= report.tasks.length;
  const ran = new Date(report.ranAt);

  return (
    <section className="panel panel--wide sparta">
      <div className="panel__head">
        <SponsorTag name="Sparta Worlds" />
        <h1 className="t-display">Tested before it meets anyone.</h1>
        <p className="t-body t-muted">
          Before {first}’s agent takes a real coffee, it runs against simulated people with known right answers: the friendly
          wrong-thesis VC, the recruiter in disguise, the angel who pushes for revenue numbers. It’s graded on the calls it
          makes and on whether anything private slips out.
        </p>
      </div>

      <div className="sparta__body">
        <ol className="card sparta__list">
          {report.tasks.map((t, i) => (
            <li key={t.id} className={i < shown ? 'is-in' : ''}>
              <Avatar name={t.name} kind={t.kind as Kind} size={32} />
              <span className="sparta__who">
                <span className="sparta__name">{t.name}</span>
                <span className="t-small t-muted">{t.tests}</span>
              </span>
              <VerdictBadge verdict={t.expect as 'meet' | 'skip'} />
              <span className={`sparta__score${t.passed === t.total ? ' is-pass' : ' is-fail'}`}>
                {t.passed}/{t.total}
              </span>
            </li>
          ))}
        </ol>

        <aside className="sparta__card surface-sr">
          <div className="sparta__stat">
            <p className="sparta__num t-speed">{report.correct}/{report.decisions}</p>
            <p className="t-small">right calls across {report.runs} runs</p>
          </div>
          <div className="sparta__stat">
            <p className="sparta__num t-speed">{report.leaks}</p>
            <p className="t-small">leaks of revenue or pilot customer names</p>
          </div>
          <p className="t-small sparta__meta">
            Last run {ran.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, {report.runsPassed}/{report.runs} clean runs ·
            graded on the final state of each conversation, not on the agent’s own account of it.
          </p>
          <button className="btn btn--ink" onClick={onDone} disabled={!done}>Send my agent</button>
        </aside>
      </div>
    </section>
  );
}
