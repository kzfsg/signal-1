import type { ReactNode } from 'react';

export type Prop = [name: string, type: string, note: string];

/** One documented item: what it is, a live preview, how to use it, and its rules. */
export function Entry({
  id,
  name,
  summary,
  source,
  usage,
  props,
  rules,
  surface = 'paper',
  children
}: {
  id: string;
  name: string;
  summary: string;
  source?: string;
  usage?: string;
  props?: Prop[];
  rules?: string[];
  surface?: 'paper' | 'white' | 'ink' | 'flush';
  children: ReactNode;
}) {
  return (
    <article className="entry" id={id}>
      <header className="entry__head">
        <h3 className="t-headline">{name}</h3>
        <p className="t-body t-muted">{summary}</p>
        {source && <p className="t-small t-muted">Built on React Bits {source}</p>}
      </header>

      <div className={`entry__preview entry__preview--${surface}`}>{children}</div>

      {(usage || props || rules) && (
        <div className="entry__spec">
          {usage && <pre className="entry__code"><code>{usage}</code></pre>}
          {props && (
            <table className="entry__props">
              <thead>
                <tr><th>Prop</th><th>Type</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {props.map(([n, t, note]) => (
                  <tr key={n}><td><code>{n}</code></td><td><code>{t}</code></td><td>{note}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          {rules && (
            <ul className="entry__rules">
              {rules.map(r => <li key={r}>{r}</li>)}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}

export function Group({ id, title, intro, children }: { id: string; title: string; intro: string; children: ReactNode }) {
  return (
    <section className="group" id={id}>
      <header className="group__head">
        <h2 className="t-display">{title}</h2>
        <p className="t-body t-muted">{intro}</p>
      </header>
      {children}
    </section>
  );
}
