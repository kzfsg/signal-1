import { useEffect, useRef, useState } from 'react';
import { composioSetup, connectorSetup, isComposioSource } from './connectorSetup';
import { useComposioConnect, useServices } from './live';
import { sources, type SourceId } from './memoryData';

const categories = ['All apps', 'Connected', 'Personal assistants', 'Work agents', 'Email & calendar', 'Documents & notes', 'Meetings & messaging', 'Professional profile'];

export default function SourcePicker({ selected, disabled, onToggle }: { selected: SourceId[]; disabled: boolean; onToggle: (id: SourceId) => void }) {
  const [category, setCategory] = useState('All apps');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<SourceId | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const source = sources.find(s => s.id === active);
  const { services } = useServices();
  const real = source && services.composio && isComposioSource(source.id) ? source.id : null;
  const setup = source ? { ...connectorSetup[source.id], ...(real ? composioSetup[real] : {}) } : null;
  const latest = useRef(selected);
  latest.current = selected;
  const { state: link, connect } = useComposioConnect(id => { if (!latest.current.includes(id)) onToggle(id); });
  const linking = source ? link[source.id] : undefined;
  const filtered = sources.filter(s => (category === 'All apps' || (category === 'Connected' ? selected.includes(s.id) : s.category === category)) && s.name.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (active && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [active]);
  const close = () => { dialog.current?.close(); setActive(null); };

  return <>
    <div className="connector-settings">
      <nav className="connector-nav" aria-label="Connector categories">
        {categories.map((c, i) => <button key={c} className={i === 2 ? 'connector-category-start' : undefined} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}{c === 'Connected' && <span>{selected.length}</span>}</button>)}
      </nav>
      <div className="connector-catalog">
        <div className="connector-toolbar"><h2>{category}</h2><label className="connector-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg><input type="search" aria-label="Search apps" placeholder="Search apps" value={query} onChange={e => setQuery(e.target.value)} /></label></div>
        <div className="connector-list">
          {filtered.map(s => <div className="connector-row" key={s.id}>
            <button className="connector-details" disabled={disabled} aria-haspopup="dialog" aria-label={`${s.name} details`} onClick={() => setActive(s.id)}>
              <span className="memory-source-mark" data-brand={s.id} aria-hidden="true"><img src={s.logo} alt="" /></span><span className="connector-name">{s.name}</span>
            </button>
            <button className={`connector-connect${selected.includes(s.id) ? ' is-connected' : ''}`} disabled={disabled} aria-label={`${selected.includes(s.id) ? 'Manage' : 'Connect'} ${s.name}`} onClick={() => setActive(s.id)}>{selected.includes(s.id) ? '✓ Connected' : 'Connect'}</button>
          </div>)}
          {!filtered.length && <div className="connector-empty"><p>{query ? 'No apps found.' : 'No apps connected yet.'}</p><button className="memory-text-button" onClick={() => { setQuery(''); setCategory('All apps'); }}>Browse all apps</button></div>}
        </div>
      </div>
    </div>
    <dialog className="connector-dialog" ref={dialog} aria-labelledby="connector-dialog-title" onCancel={close} onClose={() => setActive(null)} onClick={e => { if (e.target === e.currentTarget) { const rect = e.currentTarget.getBoundingClientRect(); if(e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) close(); } }}>
      {source && setup && <><div className="connector-dialog-header"><span className="memory-guide-mark" data-brand={source.id} aria-hidden="true"><img src={source.logo} alt="" /></span><h2 id="connector-dialog-title">{source.name}</h2><button className="connector-close" onClick={close} aria-label="Close connector details">×</button></div><p className="connector-dialog-label">{setup.method}</p><ol>{setup.steps.map(t => <li key={t}>{t}</li>)}</ol>{setup.command && <pre className="connector-command"><code>{setup.command}</code></pre>}{setup.note && <p className="connector-setup-note">{setup.note}</p>}{setup.docs && <a className="connector-docs" href={setup.docs} target="_blank" rel="noreferrer">Official setup guide ↗</a>}<div className="connector-dialog-footer">{real && !selected.includes(source.id)
        ? <><p role="status">{linking === 'pending' ? 'Approve access in the new tab. This updates when Composio confirms.' : linking === 'failed' ? 'That connection didn’t finish. Try again.' : 'Real connection through Composio · you approve access in a new tab.'}</p><button className="connector-action" disabled={disabled || linking === 'pending'} onClick={() => connect(real)}>{linking === 'pending' ? 'Waiting for approval…' : linking === 'failed' ? 'Try again' : 'Connect with Composio'}</button></>
        : <><p>{real ? 'Real connection through Composio.' : 'Simulation only · no sign-in, install or upload.'}</p><button className="connector-action" disabled={disabled} onClick={() => { onToggle(source.id); close(); }}>{selected.includes(source.id) ? 'Disconnect' : setup.action}</button></>}</div></>}
    </dialog>
  </>;
}
