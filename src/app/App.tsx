import { useEffect, useState } from 'react';
import { ChromeRipple, Wordmark } from '@/signal';
import { questionnaire, totals } from './data';
import { useProfile } from './profile';
import { Avatar, Calendar } from './parts';
import LiveRun from './LiveRun';
import Results from './Results';
import './app.css';

export type Step = 'login' | 'linkedin' | 'questions' | 'calendar' | 'compress' | 'live' | 'results';

const STAGES: [label: string, steps: Step[]][] = [
  ['Profile', ['linkedin', 'questions']],
  ['Calendar', ['calendar', 'compress']],
  ['Agent meets', ['live']],
  ['Results', ['results']]
];

function readStep(): Step {
  const s = window.location.hash.split('/')[2] as Step | undefined;
  const all: Step[] = ['login', 'linkedin', 'questions', 'calendar', 'compress', 'live', 'results'];
  return s && all.includes(s) ? s : 'login';
}

export default function App() {
  const { user } = useProfile();
  const [step, setStep] = useState<Step>(readStep);

  useEffect(() => {
    const onHash = () => setStep(readStep());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (next: Step) => {
    window.location.hash = `/app/${next}`;
    window.scrollTo(0, 0);
  };

  if (step === 'login') return <Login onDone={() => go('linkedin')} />;

  const stageIndex = STAGES.findIndex(([, steps]) => steps.includes(step));

  return (
    <div className={`app app--${step}`}>
      <header className="app__bar">
        <a href="#/" aria-label="signal home"><Wordmark size="1.4rem" /></a>
        <ol className="app__stages" aria-label="Progress">
          {STAGES.map(([label], i) => (
            <li key={label} className={i < stageIndex ? 'done' : i === stageIndex ? 'current' : ''} aria-current={i === stageIndex ? 'step' : undefined}>
              <span className="app__stage-n">{i + 1}</span> {label}
            </li>
          ))}
        </ol>
        <div className="app__user">
          <span className="t-small">{user.name}</span>
          <Avatar name={user.name} kind="you" size={34} />
        </div>
      </header>

      <main className="app__main">
        {step === 'linkedin' && <LinkedIn onDone={() => go('questions')} />}
        {step === 'questions' && <Questions onDone={() => go('calendar')} />}
        {step === 'calendar' && <ConnectCalendar onDone={() => go('compress')} />}
        {step === 'compress' && <Compress onDone={() => go('live')} />}
        {step === 'live' && <LiveRun onDone={() => go('results')} />}
        {step === 'results' && <Results />}
      </main>
    </div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const { user } = useProfile();
  return (
    <div className="login">
      <ChromeRipple position="bottom">
        <div className="login__inner">
          <div className="login__card">
            <Wordmark size="2.6rem" />
            <h1 className="t-headline">Get your time back.</h1>
            <p className="t-body t-muted">Sign in to build the agent that takes your first coffees for you.</p>
            <button className="btn btn--ink login__btn" onClick={onDone}>Continue with Google</button>
            <button className="btn btn--line login__btn" onClick={onDone}>Continue with email</button>
            <p className="t-small t-muted">Demo: you’ll be signed in as {user.name}.</p>
          </div>
        </div>
      </ChromeRipple>
    </div>
  );
}

function LinkedIn({ onDone }: { onDone: () => void }) {
  const { user, setUser, resetUser } = useProfile();
  const [state, setState] = useState<'idle' | 'importing' | 'done'>('idle');

  const start = () => {
    setState('importing');
    setTimeout(() => setState('done'), 1100);
  };

  return (
    <section className="panel">
      <div className="panel__head">
        <h1 className="t-display">Start with LinkedIn.</h1>
        <p className="t-body t-muted">Your agent reads your public profile so it can introduce you the way you would.</p>
      </div>

      <div className="card form-card">
        <label className="field">
          <span className="t-label">LinkedIn profile</span>
          <input value={user.linkedin} onChange={e => setUser({ linkedin: e.target.value })} disabled={state !== 'idle'} />
        </label>
        {state !== 'done' && (
          <button className="btn btn--ink" onClick={start} disabled={state === 'importing'}>
            {state === 'importing' ? 'Importing profile…' : 'Import profile'}
          </button>
        )}

        {state === 'done' && (
          <div className="profile">
            <div className="profile__who">
              <Avatar name={user.name} kind="you" size={64} />
              <div>
                <p className="t-title">{user.name}</p>
                <p className="t-small">{user.headline}</p>
                <p className="t-small t-muted">{user.location}</p>
              </div>
            </div>
            <p className="t-small t-muted">Edit anything that’s off. Your agent introduces you with exactly this.</p>
            <div className="profile__fields">
              <label className="field">
                <span className="t-label">Name</span>
                <input value={user.name} onChange={e => setUser({ name: e.target.value })} />
              </label>
              <label className="field">
                <span className="t-label">Location</span>
                <input value={user.location} onChange={e => setUser({ location: e.target.value })} />
              </label>
              <label className="field profile__wide">
                <span className="t-label">Headline</span>
                <input value={user.headline} onChange={e => setUser({ headline: e.target.value })} />
              </label>
              <label className="field">
                <span className="t-label">Company</span>
                <input value={user.company} onChange={e => setUser({ company: e.target.value })} />
              </label>
              <label className="field">
                <span className="t-label">What it does</span>
                <input value={user.pitch} onChange={e => setUser({ pitch: e.target.value })} />
              </label>
              <label className="field profile__wide">
                <span className="t-label">Experience, one per line</span>
                <textarea
                  className="question__text"
                  rows={4}
                  value={user.experience.join('\n')}
                  onChange={e => setUser({ experience: e.target.value.split('\n') })}
                />
              </label>
            </div>
            <div className="profile__actions">
              <button className="btn btn--ink" onClick={onDone} disabled={!user.name.trim()}>Looks right</button>
              <button className="btn btn--line" onClick={resetUser}>Reset to LinkedIn</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Questions({ onDone }: { onDone: () => void }) {
  const { user, first, options, chosen, toggle, addOption, context, setContext } = useProfile();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const add = (id: string) => {
    addOption(id, drafts[id] ?? '');
    setDrafts(d => ({ ...d, [id]: '' }));
  };

  return (
    <section className="panel panel--wide">
      <div className="panel__head">
        <h1 className="t-display">Tell your agent what you’re after.</h1>
        <p className="t-body t-muted">Four questions. Your agent uses them in every meet, and you can change them any time.</p>
      </div>

      <div className="questions">
        <div className="questions__list">
          {questionnaire.map(q => (
            <fieldset key={q.id} className="card question">
              <legend className="t-title">{q.question}</legend>
              {q.options.length > 0 ? (
                <div className="chips">
                  {options[q.id].map(o => (
                    <button
                      key={o}
                      type="button"
                      className={`chip${chosen[q.id].includes(o) ? ' chip--on' : ''}`}
                      aria-pressed={chosen[q.id].includes(o)}
                      onClick={() => toggle(q.id, o)}
                    >
                      {o}
                    </button>
                  ))}
                  <form className="chip-add" onSubmit={e => { e.preventDefault(); add(q.id); }}>
                    <input
                      className="chip chip-add__input"
                      placeholder="+ Add your own"
                      aria-label={`Add your own answer to: ${q.question}`}
                      value={drafts[q.id] ?? ''}
                      onChange={e => setDrafts(d => ({ ...d, [q.id]: e.target.value }))}
                    />
                  </form>
                </div>
              ) : (
                <textarea className="question__text" value={context} onChange={e => setContext(e.target.value)} rows={3} />
              )}
            </fieldset>
          ))}
        </div>

        <aside className="mirror">
          <div className="mirror__card surface-sr">
            <div className="mirror__head">
              <Avatar name={user.name} kind="you" size={44} />
              <div>
                <p className="t-title">{first}’s agent</p>
                <p className="t-small">Mirrors what you’re looking for</p>
              </div>
            </div>
            {[
              ['Here to', chosen.goal],
              ['Hoping to meet', chosen.meet],
              ['Not a fit right now', chosen.skip]
            ].map(([label, items]) => (
              <div key={label as string} className="mirror__group">
                <p className="t-label">{label as string}</p>
                <ul>{(items as string[]).map(i => <li key={i}>{i}</li>)}</ul>
              </div>
            ))}
            {context.trim() && (
              <div className="mirror__group">
                <p className="t-label">Good to know</p>
                <p className="t-small">{context}</p>
              </div>
            )}
          </div>
          <button className="btn btn--ink mirror__btn" onClick={onDone}>Build my agent</button>
        </aside>
      </div>
    </section>
  );
}

function ConnectCalendar({ onDone }: { onDone: () => void }) {
  const { meets } = useProfile();
  const [connected, setConnected] = useState(false);

  return (
    <section className="panel panel--wide">
      <div className="panel__head">
        <h1 className="t-display">{connected ? 'Your next four weeks.' : 'Connect your calendar.'}</h1>
        <p className="t-body t-muted">
          {connected
            ? `${totals.count} coffee chats and ${totals.hours} hours. Your agent can take every one of them first.`
            : 'Signal reads the coffee chats you’ve already booked. It never cancels anything without asking.'}
        </p>
      </div>

      {!connected ? (
        <div className="card form-card">
          <button className="btn btn--ink" onClick={() => setConnected(true)}>Connect Google Calendar</button>
        </div>
      ) : (
        <>
          <Calendar meets={meets} />
          <div className="panel__actions">
            <button className="btn btn--ink" onClick={onDone}>Hand these to my agent</button>
          </div>
        </>
      )}
    </section>
  );
}

function Compress({ onDone }: { onDone: () => void }) {
  const { meets } = useProfile();
  const [phase, setPhase] = useState<'packed' | 'compressing' | 'done'>('packed');

  useEffect(() => {
    const a = setTimeout(() => setPhase('compressing'), 600);
    const b = setTimeout(() => setPhase('done'), 600 + 1800);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  return (
    <section className="panel panel--wide compress">
      <div className="compress__stage">
        <div className={`compress__cal${phase === 'done' ? ' compress__cal--gone' : ''}`}>
          <Calendar meets={meets} mode={phase === 'packed' ? 'packed' : 'compressing'} />
        </div>

        {phase === 'done' && (
          <div className="compress__result">
            <div className="compress__nums">
              <div>
                <p className="compress__big t-speed chrome chrome--dark">{totals.hours}h</p>
                <p className="t-small t-muted">{totals.count} coffee chats</p>
              </div>
              <div>
                <p className="compress__big t-speed chrome chrome--dark">{totals.agentMinutes}m</p>
                <p className="t-small t-muted">for your agent to meet them all</p>
              </div>
            </div>
            <p className="t-headline">An hour-long coffee becomes under a minute.</p>
            <button className="btn btn--ink" onClick={onDone}>Send my agent</button>
          </div>
        )}
      </div>
    </section>
  );
}
