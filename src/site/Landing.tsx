import { useEffect, useState } from 'react';
import { ChromeRipple, ChromeWord, LightLines, PrismMosaic, Wordmark } from '@/signal';
import { totals } from '@/app/data';
import { useProfile } from '@/app/profile';
import { Avatar, Calendar, NotesCard, TracePanel, VerdictBadge } from '@/app/parts';
import './landing.css';

const steps = [
  {
    n: '1',
    title: 'Your agent learns you',
    body: 'Your agent pulls what it needs from LinkedIn, your Claude chats and your personal agents into one Keewano database.'
  },
  {
    n: '2',
    title: 'Agents meet agents',
    body: 'Your agent sits down with theirs, shares only what you allow, and asks the questions you would ask over coffee.'
  },
  {
    n: '3',
    title: 'You get the notes',
    body: 'Every meet comes back with notes and one clear call: meet, or skip. The good ones land on your calendar.'
  }
];

const exampleIds = ['dana', 'marcus', 'sofia', 'kenji', 'priya', 'lena'];
const NAV_IDLE_MS = 7000;

/**
 * Nav state: whether the page has scrolled, whether a dark section (data-nav="dark") is under the nav,
 * and whether it is hidden after NAV_IDLE_MS without scrolling. Scrolling, or moving the pointer to the
 * top edge, brings it back.
 */
function useNavState() {
  const [state, setState] = useState({ scrolled: false, dark: true, hidden: false });
  useEffect(() => {
    let idle = 0;
    const arm = () => {
      clearTimeout(idle);
      idle = window.setTimeout(() => setState(s => ({ ...s, hidden: true })), NAV_IDLE_MS);
    };
    const update = () => {
      const probe = 36; // vertical middle of the nav
      const dark = [...document.querySelectorAll<HTMLElement>('[data-nav="dark"]')].some(el => {
        const r = el.getBoundingClientRect();
        return r.top <= probe && r.bottom >= probe;
      });
      setState({ scrolled: window.scrollY > 8, dark, hidden: false });
      arm();
    };
    const onPointer = (e: PointerEvent) => {
      if (e.clientY > 80) return;
      setState(s => (s.hidden ? { ...s, hidden: false } : s));
      arm();
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('pointermove', onPointer, { passive: true });
    return () => {
      clearTimeout(idle);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('pointermove', onPointer);
    };
  }, []);
  return state;
}

export default function Landing() {
  const nav = useNavState();
  const { user, meets } = useProfile();
  const examples = exampleIds.map(id => meets.find(m => m.id === id)!);
  const featuredNote = meets.find(m => m.id === 'marcus')!;
  return (
    <div className="site">
      <header className={`nav nav--glass${nav.scrolled ? ' is-scrolled' : ''}${nav.dark ? ' is-dark' : ''}${nav.hidden ? ' is-hidden' : ''}`}>
        <div className="wrap nav__inner">
          <a className="nav__brand" href="#/" aria-label="signal home"><Wordmark size="1.6rem" /></a>
          <nav aria-label="Sections">
            <ul className="nav__links">
              <li><a href="#how">How it works</a></li>
              <li><a href="#example">Example</a></li>
              <li><a href="#notes">Notes</a></li>
            </ul>
          </nav>
          <a className="btn btn--sm btn--white" href="#/app">Open the app</a>
        </div>
      </header>

      <main>
        <section className="hero-l" data-nav="dark">
          <PrismMosaic tile={14}>
            <div className="wrap hero-l__inner">
              <h1 className="hero-l__mark"><Wordmark finish="chrome" depth shimmer /></h1>
              <p className="t-display hero-l__title">A month of coffee chats, in thirty minutes.</p>
            </div>
          </PrismMosaic>
        </section>

        <section className="section-l">
          <div className="wrap split">
            <div className="split__copy">
              <h2 className="t-display">San Francisco runs on coffee.</h2>
              <p className="t-body">
                Founders meet investors. Investors meet founders. Everyone meets everyone, because you can’t tell whether
                someone is the right person until you’ve sat down together.
              </p>
              <p className="t-body">
                So the calendar fills up, and most of those hours end with a warm “let’s keep in touch.” Good people,
                wrong moment.
              </p>
              <ul className="rule-list split__facts">
                <li className="t-headline">{totals.count} coffee chats</li>
                <li className="t-headline">{totals.hours} hours</li>
                <li className="t-headline">{totals.keep} that mattered</li>
              </ul>
            </div>
            <figure className="split__figure">
              <Calendar meets={meets} />
              <figcaption className="t-small t-muted">One month for a seed-stage founder in San Francisco.</figcaption>
            </figure>
          </div>
        </section>

        <section className="section-l surface-white" id="how">
          <div className="wrap">
            <h2 className="t-display section-l__head">How Signal works</h2>
            <ol className="steps">
              {steps.map(s => (
                <li key={s.n} className="card steps__item">
                  <span className="steps__n t-speed chrome chrome--dark" aria-hidden="true">{s.n}</span>
                  <h3 className="t-title">{s.title}</h3>
                  <p className="t-small">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="compress-l surface-ink" data-nav="dark">
          <div className="compress-l__bg" aria-hidden="true"><LightLines intensity={0.8} /></div>
          <div className="wrap compress-l__inner">
            <h2 className="t-display">Compress a month of networking into a lunch break.</h2>
            <div className="compress-l__nums">
              <div>
                <p className="compress-l__big t-speed chrome">{totals.hours}h</p>
                <p className="t-small">of coffee chats on the calendar</p>
              </div>
              <div>
                <p className="compress-l__big t-speed prism-text--vivid">{totals.agentMinutes}m</p>
                <p className="t-small">for your agent to meet all {totals.count}</p>
              </div>
            </div>
            <p className="t-body compress-l__note">An hour-long coffee becomes under a minute of agents talking. You keep the hours for the six that matter.</p>
          </div>
        </section>

        <section className="section-l" id="example">
          <div className="wrap">
            <div className="example__head">
              <h2 className="t-display">One founder’s month, filtered.</h2>
              <div className="persona card">
                <Avatar name={user.name} kind="you" size={56} />
                <div>
                  <p className="t-title">{user.name}</p>
                  <p className="t-small">{user.headline}. {user.company}: {user.pitch}.</p>
                </div>
              </div>
            </div>

            <ul className="examples">
              {examples.map(m => (
                <li key={m.id} className={`card examples__item examples__item--${m.verdict}`}>
                  <div className="examples__who">
                    <Avatar name={m.person.name} kind={m.person.kind} />
                    <div>
                      <p className="t-title">{m.person.name}</p>
                      <p className="t-small t-muted">{m.person.role}, {m.person.org}</p>
                    </div>
                    <VerdictBadge verdict={m.verdict} />
                  </div>
                  <p className="t-small">{m.reason}</p>
                </li>
              ))}
            </ul>

            <div className="example__result">
              <Calendar meets={meets} mode="filtered" compact />
              <p className="t-headline">{totals.keep} of {totals.count} worth meeting. <span className="t-muted">{totals.savedHours} hours back.</span></p>
            </div>
          </div>
        </section>

        <section className="section-l surface-white" id="notes">
          <div className="wrap">
            <div className="section-l__head">
              <h2 className="t-display">Notes, not small talk.</h2>
              <p className="t-body t-muted">Every meet comes back as notes you can read in a minute, with the trace of what your agent asked, shared and held back.</p>
            </div>
            <div className="notes-l">
              <NotesCard meet={featuredNote} />
              <div className="card notes-l__trace"><TracePanel meet={featuredNote} /></div>
            </div>
          </div>
        </section>

        <section className="cta-l">
          <ChromeRipple position="bottom">
            <div className="wrap cta-l__inner">
              <p className="cta-l__mark"><ChromeWord text="time back" finish="dark" depth /></p>
              <p className="t-body cta-l__sub">Let your agent take the first coffee.</p>
              <a className="btn btn--ink" href="#/app" style={{ pointerEvents: 'auto' }}>Build your agent</a>
            </div>
          </ChromeRipple>
        </section>
      </main>

      <footer className="wrap site__foot">
        <Wordmark size="1.25rem" />
        <p className="t-small t-muted">Built for Speedhacks 2026. <a href="#/system">Design system</a></p>
      </footer>
    </div>
  );
}
