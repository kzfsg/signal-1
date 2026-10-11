import { useEffect, useRef, useState } from 'react';
import { LightLines } from '@/signal';
import type { Meet, Person } from './data';
import { agentName, useProfile } from './profile';
import { useServices } from './live';
import { isMeet, useRun, type MeetResult } from './run';
import { Avatar, VerdictBadge } from './parts';

const LINE_MS = 750; // featured meets, readable
const FAST_MS = 220; // quick filters
const VERDICT_MS = 650;

function scriptFor(m: Meet): [speaker: 'you' | 'them', text: string][] {
  if (m.transcript) return m.transcript;
  const first = m.person.name.split(' ')[0];
  return [
    ['you', `What is ${first} hoping to get from the chat?`],
    ['them', m.reason]
  ];
}

const SERVICES = [['fireworks', 'Fireworks'], ['composio', 'Composio'], ['keewano', 'KeewanoDB'], ['dial', 'Dial']] as const;

// A meet row: the demo month is all finished meets, a live run fills in as results arrive.
interface Row { id: string; person: Person; res?: MeetResult }

export default function LiveRun({ onDone }: { onDone: () => void }) {
  const { services, ready } = useServices();
  const { run, begin } = useRun();
  const [failed, setFailed] = useState(false);
  const live = ready && services.fireworks;
  useEffect(() => {
    if (live && !run) begin().catch(() => setFailed(true));
  }, [live, run, begin]);

  if (!ready || (live && !run && !failed)) return <section className="live surface-ink" aria-busy="true" />;
  return <Room onDone={onDone} />;
}

function Room({ onDone }: { onDone: () => void }) {
  const { user, first: you, agent, meets: demo } = useProfile();
  const { services } = useServices();
  const { run, start } = useRun();
  const rows: Row[] = run ? run.chats.map(c => ({ id: c.id, person: c.person, res: run.results[c.id] })) : demo.map(m => ({ id: m.id, person: m.person, res: m }));
  const [index, setIndex] = useState(0);
  const [lines, setLines] = useState(0);
  const [showVerdict, setShowVerdict] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null); // a finished chat opened while the run continues
  const queueRef = useRef<HTMLOListElement>(null);
  const roomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (run) start(run);
  }, [run, start]);

  const finished = index >= rows.length;
  const current = rows[Math.min(index, rows.length - 1)];
  const meet = isMeet(current.res) ? current.res : null;
  const waiting = !current.res; // the live run hasn't got to this chat yet
  const failure = current.res && 'error' in current.res ? current.res.error : null;
  const errored = failure !== null;
  const script = meet ? scriptFor(meet) : [];
  // Every live meet has a transcript; read the first one and the meets, skim the rest of the skips.
  const fast = !!meet && (!meet.transcript || (!!run && index > 0 && meet.verdict === 'skip'));

  // The room shows either the live chat or a finished one replayed in full
  const replay = viewing === null ? null : (isMeet(rows[viewing].res) ? rows[viewing].res : null);
  const shown = viewing === null ? current : rows[viewing];
  const shownMeet = replay ?? meet;
  const shownScript = shownMeet ? scriptFor(shownMeet) : [];
  const shownLines = replay ? shownScript.length : lines;
  const shownVerdict = replay ? true : showVerdict;

  useEffect(() => {
    if (finished || waiting) return;
    let t: number;
    if (errored) {
      t = window.setTimeout(() => setIndex(i => i + 1), VERDICT_MS);
    } else if (lines < script.length) {
      t = window.setTimeout(() => setLines(l => l + 1), fast ? FAST_MS : LINE_MS);
    } else if (!showVerdict) {
      t = window.setTimeout(() => setShowVerdict(true), fast ? FAST_MS : 300);
    } else {
      t = window.setTimeout(() => {
        setIndex(i => i + 1);
        setLines(0);
        setShowVerdict(false);
      }, fast ? FAST_MS * 1.5 : VERDICT_MS);
    }
    return () => clearTimeout(t);
  }, [lines, showVerdict, finished, script.length, fast, waiting, errored]);

  // Keep the current row and newest line in view without moving the page
  // Leave both alone while a replay is open, so the list doesn't jump under the cursor
  useEffect(() => {
    if (viewing !== null) return;
    const row = queueRef.current?.children[index] as HTMLElement | undefined;
    if (row && queueRef.current) queueRef.current.scrollTop = row.offsetTop - queueRef.current.clientHeight / 2;
  }, [index, viewing]);
  useEffect(() => {
    if (!roomRef.current) return;
    roomRef.current.scrollTop = viewing === null ? roomRef.current.scrollHeight : 0;
  }, [lines, showVerdict, viewing]);

  const done = rows.slice(0, finished ? rows.length : index);
  const doneMeets = done.map(r => r.res).filter(isMeet);
  const kept = doneMeets.filter(m => m.verdict === 'meet');
  const agentSeconds = doneMeets.reduce((s, m) => s + m.agentSeconds, 0);
  const hoursFreed = Math.round(doneMeets.filter(m => m.verdict === 'skip').reduce((s, m) => s + m.minutes, 0) / 60);
  const first = shown.person.name.split(' ')[0];
  const anyLive = SERVICES.some(([id]) => services[id]);

  return (
    <section className={`live surface-ink${anyLive ? ' live--services' : ''}`}>
      <div className="live__bg" aria-hidden="true"><LightLines intensity={0.45} /></div>
      {anyLive && (
        <ul className="live__services" aria-label="Live services">
          {SERVICES.map(([id, name]) => <li key={id} className={services[id] ? 'is-on' : ''}>{name}<span className="visually-hidden">{services[id] ? ' live' : ' off'}</span></li>)}
        </ul>
      )}

      <div className="live__grid">
        <aside className="live__queue">
          <p className="t-label live__label">{rows.length} chats this month</p>
          {done.length > 0 && <p className="t-small live__hint">Click a finished chat to read it</p>}
          <ol ref={queueRef}>
            {rows.map(({ id, person, res }, i) => {
              const isDone = i < index || finished;
              const isNow = !isDone && i === index;
              const row = (
                <>
                  <Avatar name={person.name} kind={person.kind} size={28} />
                  <span className="live__qname">{person.name}</span>
                  {isDone ? (isMeet(res) ? <VerdictBadge verdict={res.verdict} /> : <span className="verdict verdict--skip">Error</span>) : isNow ? <span className="live__pulse">Meeting</span> : null}
                </>
              );
              const state = [isDone && 'is-done', isNow && 'is-now', viewing === i && 'is-viewing'].filter(Boolean).join(' ');
              return (
                <li key={id} className={state}>
                  {isDone && isMeet(res) ? (
                    <button className="live__row" onClick={() => setViewing(viewing === i ? null : i)} aria-pressed={viewing === i}>{row}</button>
                  ) : isNow && viewing !== null ? (
                    <button className="live__row" onClick={() => setViewing(null)}>{row}</button>
                  ) : (
                    <div className="live__row">{row}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </aside>

        <div className={replay ? 'live__room live__room--replay' : 'live__room'} aria-live={replay ? 'off' : 'polite'}>
          {replay || !finished ? (
            <>
              {replay && (
                <div className="live__replay">
                  <p className="t-small">
                    Replaying {first}’s chat
                    {!finished && <span className="live__replay-live"> · live: {current.person.name.split(' ')[0]}</span>}
                  </p>
                  <button className="btn btn--line live__back" onClick={() => setViewing(null)}>{finished ? 'Back to summary' : 'Back to live'}</button>
                </div>
              )}
              <header className="live__room-head">
                <div className="live__agent">
                  <Avatar name={user.name} kind="you" size={40} />
                  <div><p className="t-title">{you}’s agent</p><p className="t-small">{agent ? `${user.company} · via your ${agentName(agent)}` : user.company}</p></div>
                </div>
                <span className="live__link" aria-hidden="true" />
                <div className="live__agent live__agent--them">
                  <div><p className="t-title">{first}’s agent</p><p className="t-small">{shown.person.role}, {shown.person.org}</p></div>
                  <Avatar name={shown.person.name} kind={shown.person.kind} size={40} />
                </div>
              </header>
              <p className="live__via">
                <span className="live__via-tag">Agent to agent</span>
                <span>No agent on their side? Yours calls or texts them with <strong>Dial</strong>.</span>
              </p>

              <div className="live__transcript" ref={roomRef}>
                {shownScript.slice(0, shownLines).map(([who, text], i) => (
                  <p key={i} className={`bubble bubble--${who}`}>{text}</p>
                ))}
                {!replay && waiting && <p className="live__waiting">{services.dial ? 'Meeting via Dial' : 'Meeting'}</p>}
                {(shownLines < shownScript.length || (!replay && waiting)) && <p className="bubble bubble--typing" aria-label="Agent is typing"><span /><span /><span /></p>}
                {!replay && failure !== null && (
                  <div className="live__verdict live__verdict--skip">
                    <span className="verdict verdict--skip">Error</span>
                    <p>{failure}</p>
                  </div>
                )}
                {shownVerdict && shownMeet && (
                  <div className={`live__verdict live__verdict--${shownMeet.verdict}`}>
                    <VerdictBadge verdict={shownMeet.verdict} />
                    <p>{shownMeet.reason}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="live__finished">
              <p className="t-speed chrome live__finished-mark">done</p>
              <p className="t-headline">{doneMeets.length} meets in {Math.round(agentSeconds / 60)} minutes. {kept.length} worth your time.</p>
              {done.length > doneMeets.length && <p className="t-small">{done.length - doneMeets.length} couldn’t be met.</p>}
              <button className="btn" onClick={onDone}>Read the notes</button>
            </div>
          )}
        </div>

        <aside className="live__tally">
          <div className="live__stat"><span className="t-label live__label">Worth meeting</span><p className="live__num t-speed prism-text--vivid">{kept.length}</p></div>
          <div className="live__stat"><span className="t-label live__label">Skipped</span><p className="live__num t-speed chrome">{doneMeets.length - kept.length}</p></div>
          <div className="live__stat"><span className="t-label live__label">Agent time</span><p className="t-headline">{Math.floor(agentSeconds / 60)}m {agentSeconds % 60}s</p></div>
          <div className="live__stat"><span className="t-label live__label">Hours back</span><p className="t-headline">{hoursFreed}h</p></div>
          {!finished && <button className="btn btn--line live__skip" onClick={onDone}>Skip to results</button>}
        </aside>
      </div>
    </section>
  );
}
