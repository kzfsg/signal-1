import { useState } from 'react';
import { totals, dayNames, formatTime } from './data';
import { useProfile } from './profile';
import { Avatar, Calendar, NotesCard, TracePanel, VerdictBadge } from './parts';
import { DialLine, TextFollowUp } from './sponsors/DialLine';
import { KeewanoInsights } from './sponsors/KeewanoInsights';
import './sponsors/sponsors.css';

export default function Results() {
  const { meets } = useProfile();
  const keep = meets.filter(m => m.verdict === 'meet');
  const skipped = meets.filter(m => m.verdict === 'skip');
  const [tab, setTab] = useState<'meet' | 'skip'>('meet');
  const list = tab === 'meet' ? keep : skipped;
  const [selected, setSelected] = useState(keep[0].id);
  const meet = meets.find(m => m.id === selected) ?? list[0];
  const [view, setView] = useState<'notes' | 'trace'>('notes');

  const pick = (t: 'meet' | 'skip') => {
    setTab(t);
    setSelected((t === 'meet' ? keep : skipped)[0].id);
  };

  return (
    <section className="results">
      <div className="results__top">
        <div className="results__intro">
          <h1 className="t-display">{totals.keep} people worth your time.</h1>
          <p className="t-body t-muted">
            Your agent met all {totals.count} and kept the ones where you can genuinely help each other. The rest got a kind
            “not right now,” and {totals.savedHours} hours went back on your calendar.
          </p>
        </div>
        <div className="results__stats">
          <div><p className="results__num t-speed chrome chrome--dark">{totals.keep}</p><p className="t-small t-muted">to meet</p></div>
          <div><p className="results__num t-speed chrome chrome--dark">{totals.savedHours}h</p><p className="t-small t-muted">back</p></div>
          <div><p className="results__num t-speed chrome chrome--dark">{totals.agentMinutes}m</p><p className="t-small t-muted">agent time</p></div>
        </div>
      </div>

      <div className="results__body">
        <div className="results__list card">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'meet'} className={`tab${tab === 'meet' ? ' tab--on' : ''}`} onClick={() => pick('meet')}>Meet ({keep.length})</button>
            <button role="tab" aria-selected={tab === 'skip'} className={`tab${tab === 'skip' ? ' tab--on' : ''}`} onClick={() => pick('skip')}>Skipped ({skipped.length})</button>
          </div>
          <ul className="results__items">
            {list.map(m => (
              <li key={m.id}>
                <button className={`result-row${m.id === meet.id ? ' result-row--on' : ''}`} onClick={() => setSelected(m.id)}>
                  <Avatar name={m.person.name} kind={m.person.kind} size={36} />
                  <span className="result-row__text">
                    <span className="result-row__name">{m.person.name}</span>
                    <span className="t-small t-muted">{m.person.role}, {m.person.org}</span>
                  </span>
                  <VerdictBadge verdict={m.verdict} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="results__detail">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={view === 'notes'} className={`tab${view === 'notes' ? ' tab--on' : ''}`} onClick={() => setView('notes')}>Notes</button>
            <button role="tab" aria-selected={view === 'trace'} className={`tab${view === 'trace' ? ' tab--on' : ''}`} onClick={() => setView('trace')}>What your agent did</button>
          </div>
          {view === 'notes' ? <NotesCard meet={meet} /> : <div className="card results__trace"><TracePanel meet={meet} /></div>}
          <TextFollowUp meet={meet} />
        </div>
      </div>

      <div className="results__sponsors">
        <DialLine />
        <KeewanoInsights />
      </div>

      <div className="results__month">
        <div>
          <h2 className="t-headline">Your new month.</h2>
          <p className="t-body t-muted">Six coffees instead of {totals.count}. Your agent proposed times; everyone else got a note.</p>
          <ul className="rule-list results__booked">
            {keep.map(m => (
              <li key={m.id}>
                <strong>{dayNames[m.day]}, week {m.week + 1}, {formatTime(m.start)}</strong> {m.person.name}, {m.person.org}
              </li>
            ))}
          </ul>
        </div>
        <Calendar meets={meets} mode="filtered" />
      </div>
    </section>
  );
}
