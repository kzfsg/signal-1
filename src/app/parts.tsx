import type { CSSProperties } from 'react';
import { dayNames, formatTime, initials, kindLabel, type Meet, type Notes, type TraceStep } from './data';
import './parts.css';

/** Initials disc, tinted by the kind of person. */
export function Avatar({ name, kind, size = 40 }: { name: string; kind: Meet['person']['kind'] | 'you'; size?: number }) {
  return (
    <span className={`avatar avatar--${kind}`} style={{ '--size': `${size}px` } as CSSProperties} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function VerdictBadge({ verdict }: { verdict: Meet['verdict'] }) {
  return <span className={`verdict verdict--${verdict}`}>{verdict === 'meet' ? 'Meet' : 'Skip'}</span>;
}

type CalendarMode = 'packed' | 'compressing' | 'filtered';

/** A month of coffee chats, Mon–Fri across four weeks. `filtered` dims everything the agent skipped. */
export function Calendar({ meets, mode = 'packed', compact = false }: { meets: Meet[]; mode?: CalendarMode; compact?: boolean }) {
  return (
    <div className={`cal cal--${mode}${compact ? ' cal--compact' : ''}`} role="table" aria-label="One month of coffee chats">
      <div className="cal__row cal__row--head" role="row">
        <span role="columnheader" />
        {dayNames.map(d => <span key={d} className="cal__day-name" role="columnheader">{d}</span>)}
      </div>
      {[0, 1, 2, 3].map(week => (
        <div className="cal__row" role="row" key={week}>
          <span className="cal__week" role="rowheader">Wk {week + 1}</span>
          {[0, 1, 2, 3, 4].map(day => (
            <div className="cal__cell" role="cell" key={day}>
              {meets
                .filter(m => m.week === week && m.day === day)
                .map(m => (
                  <div
                    key={m.id}
                    className={`cal__event cal__event--${m.person.kind} cal__event--${m.verdict}`}
                    style={{ '--i': meets.indexOf(m) } as CSSProperties}
                    title={`${formatTime(m.start)}, ${m.person.name}, ${m.person.org}`}
                  >
                    <span className="cal__time">{formatTime(m.start)}</span>
                    <span className="cal__who">{m.person.name}</span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Granola-style meeting notes the agent writes after each meet. */
export function NotesCard({ meet }: { meet: Meet }) {
  const notes: Notes = meet.notes ?? {
    summary: meet.reason,
    after: [],
    overlap: meet.checks.filter(c => c.pass).map(c => c.label),
    worth: meet.checks.filter(c => !c.pass).map(c => `Missed: ${c.label.toLowerCase()}`),
    next: meet.verdict === 'meet' ? 'Meet. Your agent will propose a time that works for both of you.' : 'Skip. No meeting needed.'
  };
  const sections: [string, string[]][] = [
    ['What they’re after', notes.after],
    ['Where you overlap', notes.overlap],
    ['Worth knowing', notes.worth]
  ];
  return (
    <article className="notes">
      <header className="notes__head">
        <Avatar name={meet.person.name} kind={meet.person.kind} size={48} />
        <div>
          <h3 className="t-title">{meet.person.name}</h3>
          <p className="t-small t-muted">{meet.person.role}, {meet.person.org}</p>
        </div>
        <VerdictBadge verdict={meet.verdict} />
      </header>
      <p className="notes__summary">{notes.summary}</p>
      {sections.filter(([, items]) => items.length).map(([title, items]) => (
        <section key={title} className="notes__section">
          <h4 className="notes__label">{title}</h4>
          <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>
        </section>
      ))}
      <section className={`notes__next notes__next--${meet.verdict}`}>
        <h4 className="notes__label">Recommendation</h4>
        <p>{notes.next}</p>
      </section>
    </article>
  );
}

/** What the agent did in the meet: steps, checks, and what it shared or held back. */
export function TracePanel({ meet }: { meet: Meet }) {
  const trace: TraceStep[] = meet.trace ?? [
    { t: '00:00', step: 'Handshake', detail: 'Exchanged public profiles and intents' },
    { t: '00:08', step: 'Asked', detail: 'What they hope to get from the chat' },
    { t: `00:${String(Math.max(12, meet.agentSeconds - 6)).padStart(2, '0')}`, step: 'Evaluated', detail: `${meet.checks.filter(c => c.pass).length} of ${meet.checks.length} checks passed` },
    { t: `00:${String(meet.agentSeconds).padStart(2, '0')}`, step: 'Verdict', detail: meet.verdict === 'meet' ? 'Meet' : 'Skip' }
  ];
  return (
    <div className="trace">
      <div className="trace__meta">
        <div><span className="t-label t-muted">Agent time</span><p className="t-title">{meet.agentSeconds}s</p></div>
        {meet.verdict === 'skip' ? (
          <div><span className="t-label t-muted">Time saved</span><p className="t-title">{meet.minutes} min</p></div>
        ) : (
          <div><span className="t-label t-muted">Meeting</span><p className="t-title">Booked</p></div>
        )}
      </div>

      <ol className="trace__steps">
        {trace.map(s => (
          <li key={s.t + s.step}>
            <code>{s.t}</code>
            <span className="trace__step">{s.step}</span>
            <span className="t-muted">{s.detail}</span>
          </li>
        ))}
      </ol>

      <div className="trace__checks">
        <span className="t-label t-muted">Your criteria</span>
        <ul>
          {meet.checks.map(c => (
            <li key={c.label} className={c.pass ? 'pass' : 'fail'}>
              <span aria-hidden="true">{c.pass ? '✓' : '✕'}</span> {c.label}
              <span className="visually-hidden">{c.pass ? ' passed' : ' not met'}</span>
            </li>
          ))}
        </ul>
      </div>

      {(meet.shared || meet.withheld) && (
        <div className="trace__privacy">
          <div>
            <span className="t-label t-muted">Shared</span>
            <ul>{(meet.shared ?? []).map(s => <li key={s}>{s}</li>)}</ul>
          </div>
          <div>
            <span className="t-label t-muted">Held back</span>
            <ul>{(meet.withheld ?? []).map(s => <li key={s}>{s}</li>)}</ul>
          </div>
        </div>
      )}
    </div>
  );
}

export { kindLabel };
