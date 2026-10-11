import { useEffect, useRef, useState } from 'react';
import { LightLines } from '@/signal';
import type { Meet } from './data';
import { agentName, useProfile } from './profile';
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

export default function LiveRun({ onDone }: { onDone: () => void }) {
  const { user, first: you, agent, meets } = useProfile();
  const [index, setIndex] = useState(0);
  const [lines, setLines] = useState(0);
  const [showVerdict, setShowVerdict] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null); // a finished chat opened while the run continues
  const queueRef = useRef<HTMLOListElement>(null);
  const roomRef = useRef<HTMLDivElement>(null);

  const finished = index >= meets.length;
  const current = meets[Math.min(index, meets.length - 1)];
  const script = scriptFor(current);
  const fast = !current.transcript;

  // The room shows either the live chat or a finished one replayed in full
  const replay = viewing === null ? null : meets[viewing];
  const shown = replay ?? current;
  const shownScript = replay ? scriptFor(replay) : script;
  const shownLines = replay ? shownScript.length : lines;
  const shownVerdict = replay ? true : showVerdict;

  useEffect(() => {
    if (finished) return;
    let t: number;
    if (lines < script.length) {
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
  }, [lines, showVerdict, finished, script.length, fast]);

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

  const done = meets.slice(0, finished ? meets.length : index);
  const kept = done.filter(m => m.verdict === 'meet');
  const agentSeconds = done.reduce((s, m) => s + m.agentSeconds, 0);
  const hoursFreed = Math.round(done.filter(m => m.verdict === 'skip').reduce((s, m) => s + m.minutes, 0) / 60);
  const first = shown.person.name.split(' ')[0];

  return (
    <section className="live surface-ink">
      <div className="live__bg" aria-hidden="true"><LightLines intensity={0.45} /></div>

      <div className="live__grid">
        <aside className="live__queue">
          <p className="t-label live__label">{meets.length} chats this month</p>
          {done.length > 0 && <p className="t-small live__hint">Click a finished chat to read it</p>}
          <ol ref={queueRef}>
            {meets.map((m, i) => {
              const isDone = i < index || finished;
              const isNow = !isDone && i === index;
              const row = (
                <>
                  <Avatar name={m.person.name} kind={m.person.kind} size={28} />
                  <span className="live__qname">{m.person.name}</span>
                  {isDone ? <VerdictBadge verdict={m.verdict} /> : isNow ? <span className="live__pulse">Meeting</span> : null}
                </>
              );
              const state = [isDone && 'is-done', isNow && 'is-now', viewing === i && 'is-viewing'].filter(Boolean).join(' ');
              return (
                <li key={m.id} className={state}>
                  {isDone ? (
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

              <div className="live__transcript" ref={roomRef}>
                {shownScript.slice(0, shownLines).map(([who, text], i) => (
                  <p key={i} className={`bubble bubble--${who}`}>{text}</p>
                ))}
                {shownLines < shownScript.length && <p className="bubble bubble--typing" aria-label="Agent is typing"><span /><span /><span /></p>}
                {shownVerdict && (
                  <div className={`live__verdict live__verdict--${shown.verdict}`}>
                    <VerdictBadge verdict={shown.verdict} />
                    <p>{shown.reason}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="live__finished">
              <p className="t-speed chrome live__finished-mark">done</p>
              <p className="t-headline">{meets.length} meets in {Math.round(agentSeconds / 60)} minutes. {kept.length} worth your time.</p>
              <button className="btn" onClick={onDone}>Read the notes</button>
            </div>
          )}
        </div>

        <aside className="live__tally">
          <div className="live__stat"><span className="t-label live__label">Worth meeting</span><p className="live__num t-speed prism-text--vivid">{kept.length}</p></div>
          <div className="live__stat"><span className="t-label live__label">Skipped</span><p className="live__num t-speed chrome">{done.length - kept.length}</p></div>
          <div className="live__stat"><span className="t-label live__label">Agent time</span><p className="t-headline">{Math.floor(agentSeconds / 60)}m {agentSeconds % 60}s</p></div>
          <div className="live__stat"><span className="t-label live__label">Hours back</span><p className="t-headline">{hoursFreed}h</p></div>
          {!finished && <button className="btn btn--line live__skip" onClick={onDone}>Skip to results</button>}
        </aside>
      </div>
    </section>
  );
}
