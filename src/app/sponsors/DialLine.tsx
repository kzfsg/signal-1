// The agent's own phone line on Dial. Most people on the calendar don't have an agent of their own,
// so Signal's agent screens them by phone or text instead, and follows up by text either way.
import { useEffect, useRef, useState } from 'react';
import type { Meet } from '../data';
import { useProfile } from '../profile';
import { VerdictBadge } from '../parts';
import { api, useApi } from './api';
import { SponsorTag } from './SponsorTag';

interface NumberInfo { number: string; capabilities: string[]; ready: boolean }
interface Turn { from: 'them' | 'agent'; text: string }
interface CallView {
  id: string;
  state: string;
  label: string;
  done: boolean;
  turns: Turn[];
  decision: { verdict: 'meet' | 'skip'; reason: string; reply: string } | null;
}
interface Inbox { threads: { contact: string; messages: (Turn & { at: string })[] }[] }

const pretty = (n: string) => n.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '+1 ($1) $2-$3');

export function DialLine() {
  const line = useApi<NumberInfo>('dial/number');
  const inbox = useApi<Inbox>(line.data ? 'dial/inbox' : null, 4000);

  return (
    <section className="sponsor card">
      <header className="sponsor__head">
        <div>
          <SponsorTag name="Dial" />
          <h2 className="t-headline">Your agent has a phone number.</h2>
          <p className="t-body t-muted">
            Most people on your calendar don’t have an agent yet. Yours calls or texts them instead, asks the same questions,
            and follows up by text either way.
          </p>
        </div>
        {line.data && (
          <div className="dial__number">
            <span className="t-label t-muted">Text or call your agent</span>
            <p className="t-headline">{pretty(line.data.number)}</p>
            {!line.data.ready && <span className="t-small t-muted">Finishing setup, texts work now</span>}
          </div>
        )}
      </header>

      <div className="dial__grid">
        <CallSomeone />
        <div className="dial__inbox">
          <span className="t-label t-muted">Live inbox</span>
          {!inbox.data?.threads.length ? (
            <p className="t-small t-muted">No texts yet.{line.data && ` Text ${pretty(line.data.number)} and watch your agent screen you here.`}</p>
          ) : (
            <ul className="dial__threads">
              {inbox.data.threads.map(t => (
                <li key={t.contact}>
                  <span className="t-small t-muted">{pretty(t.contact)}</span>
                  {t.messages.slice(-4).map((m, i) => (
                    <p key={i} className={`bubble bubble--${m.from === 'agent' ? 'you' : 'them'}`}>{m.text}</p>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function CallSomeone() {
  const { user, chosen, context } = useProfile();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [call, setCall] = useState<CallView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const profile = { user, chosen, context };

  // Follow the call until the agent has decided. The transcript lands a few seconds after hang-up,
  // so keep checking briefly once it ends, then give up (no answer, or nobody spoke).
  const afterEnd = useRef(0);
  useEffect(() => {
    if (!call || call.decision || error) return;
    if (call.done && ++afterEnd.current > 8) return;
    const t = window.setTimeout(async () => {
      try {
        setCall(await api<CallView>('dial/call', { id: call.id, name, profile }));
      } catch (e) {
        setError((e as Error).message);
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [call, error]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    setBusy(true);
    setError(null);
    setCall(null);
    afterEnd.current = 0;
    try {
      const { id } = await api<{ id: string }>('dial/call', { to: phone, name: name || 'them', profile });
      setCall({ id, state: 'Queued', label: 'Dialling', done: false, turns: [], decision: null });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dial__call">
      <span className="t-label t-muted">Have your agent call someone</span>
      <div className="dial__form">
        <label className="field"><span className="t-small">Name</span><input value={name} onChange={e => setName(e.target.value)} placeholder="Who it’s calling" /></label>
        <label className="field"><span className="t-small">Phone</span><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 415 555 0100" inputMode="tel" /></label>
        <button className="btn btn--ink" onClick={start} disabled={busy || !phone.trim() || (!!call && !call.done)}>
          {busy ? 'Dialling…' : 'Call now'}
        </button>
      </div>
      {error && <p className="t-small dial__error">{error}</p>}
      {call && (
        <div className="dial__live" aria-live="polite">
          <p className="t-small"><span className={`dial__dot${call.done ? '' : ' is-live'}`} /> {call.label || call.state}</p>
          {call.turns.map((t, i) => (
            <p key={i} className={`bubble bubble--${t.from === 'agent' ? 'you' : 'them'}`}>{t.text}</p>
          ))}
          {call.done && !call.decision && call.turns.length > 0 && <p className="t-small t-muted">Reading the transcript…</p>}
          {call.decision && (
            <div className={`live__verdict live__verdict--${call.decision.verdict}`}>
              <VerdictBadge verdict={call.decision.verdict} />
              <p>{call.decision.reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Text the person the booking or the kind "not right now", from the agent's number. */
export function TextFollowUp({ meet }: { meet: Meet }) {
  const { first } = useProfile();
  const them = meet.person.name.split(' ')[0];
  const draft = meet.verdict === 'meet'
    ? `Hi ${them}, ${first}'s assistant here. ${first} would love to meet: does ${dayName(meet)} at ${time(meet)} work for 30 minutes? Reply and I'll lock it in.`
    : `Hi ${them}, ${first}'s assistant here. Thanks for reaching out. ${first} is heads-down on a raise right now so isn't taking new coffees, but would be glad to reconnect later in the year.`;
  const [phone, setPhone] = useState('');
  const [body, setBody] = useState(draft);
  const [state, setState] = useState<{ sent?: string; error?: string; busy?: boolean }>({});

  useEffect(() => {
    setBody(draft);
    setState({});
  }, [meet.id]); // eslint-disable-line react-hooks/exhaustive-deps -- reset only when the person changes

  const send = async () => {
    setState({ busy: true });
    try {
      const r = await api<{ channel: string }>('dial/message', { to: phone, body });
      setState({ sent: r.channel });
    } catch (e) {
      setState({ error: (e as Error).message });
    }
  };

  return (
    <div className="card followup">
      <div className="followup__head">
        <span className="t-label t-muted">{meet.verdict === 'meet' ? 'Book it by text' : 'Send the kind no'}</span>
        <SponsorTag name="Dial" />
      </div>
      <textarea className="question__text" rows={3} value={body} onChange={e => setBody(e.target.value)} />
      <div className="followup__row">
        <input className="followup__phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder={`${them}’s phone`} inputMode="tel" aria-label={`${them}’s phone`} />
        <button className="btn btn--ink btn--sm" onClick={send} disabled={state.busy || !phone.trim() || !body.trim()}>
          {state.busy ? 'Sending…' : 'Send text'}
        </button>
      </div>
      {state.sent && <p className="t-small">Sent by {state.sent === 'imessage' ? 'iMessage' : state.sent.toUpperCase()} from your agent’s number.</p>}
      {state.error && <p className="t-small dial__error">{state.error}</p>}
    </div>
  );
}

const dayName = (m: Meet) => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][m.day];
const time = (m: Meet) => {
  const h = Math.floor(m.start);
  const min = Math.round((m.start - h) * 60);
  return `${((h + 11) % 12) + 1}${min ? `:${String(min).padStart(2, '0')}` : ''}${h < 12 ? 'am' : 'pm'}`;
};

