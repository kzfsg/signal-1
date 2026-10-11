import { useEffect, useMemo, useRef, useState } from 'react';
import { assembleMemory, createBrief, emptyDraft, loadDraft, memoryFields, sessionsForProfile, sources, storageKey, type SourceId } from './memoryData';
import { useProfile } from './profile';
import { importItems, listConnections, saveMemory, useServices, type ContextItem } from './live';
import { isComposioSource } from './connectorSetup';
import SourcePicker from './SourcePicker';
import ContextImport from './ContextImport';
import MemoryDocument from './MemoryDocumentView';
import './memory.css';

export type MemoryStep = 'sources' | 'sessions' | 'memory';
const steps: { id: MemoryStep; label: string }[] = [{ id: 'sources', label: 'Choose sources' }, { id: 'sessions', label: 'Review context' }, { id: 'memory', label: 'Your memory' }];

export default function MemoryOnboarding({ step, go }: { step: MemoryStep; go: (step: MemoryStep | 'calendar' | 'questions') => void }) {
  const { user, chosen, context, agent } = useProfile();
  const sessions = useMemo(() => sessionsForProfile(user), [user]);
  const profileBrief = () => ({ ...createBrief([]), company: `${user.company}: ${user.pitch}.\n${user.name} · ${user.headline} · ${user.location}.\n${user.experience.join("; ")}.`, goals: (chosen.goal ?? []).join("; "), preferences: [(chosen.meet ?? []).length ? `Hoping to meet: ${chosen.meet.join("; ")}` : "", (chosen.skip ?? []).length ? `Not a fit: ${chosen.skip.join("; ")}` : ""].filter(Boolean).join("\n") });
  const [draft, setDraft] = useState(loadDraft);
  const [busy, setBusy] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [documentValid, setDocumentValid] = useState(true);
  const { services } = useServices();
  const [real, setReal] = useState<{ items: ContextItem[] } | { error: string } | 'loading' | null>(null);
  const [saving, setSaving] = useState<'idle' | 'saving' | 'failed'>('idle');
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (step !== 'sessions') setBusy(false); if (step !== 'memory') setDocumentValid(true); }, [step]);
  useEffect(() => { heading.current?.focus(); }, [step]);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(draft)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [draft]);
  const available = sessions.filter(s => draft.sources.includes(s.source) && s.daysAgo <= draft.range);
  const included = available.filter(s => draft.included.includes(s.id));
  const suggested = available.filter(s => s.classification === 'Relevant');
  const changeSource = (id: SourceId) => setDraft(d => ({ ...d, sources: d.sources.includes(id) ? d.sources.filter(s => s !== id) : [...d.sources, id], generated: false, saved: false }));
  const importSamples = () => {
    setBusy(true);
    go('sessions');
    if (services.composio) void importReal();
  };
  // Real items come from the connections that are active on Composio and still selected here.
  const importReal = async () => {
    setReal('loading');
    try {
      const active = (await listConnections()).filter(c => c.status === 'active' && draft.sources.includes(c.source)).map(c => c.source).filter(isComposioSource);
      setReal(active.length ? await importItems(active) : null);
    } catch (e) {
      setReal({ error: (e as Error).message });
    }
  };
  const saveAndContinue = async () => {
    const next = { ...draft, saved: true };
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setDraft(next); } catch { setStorageError(true); return; }
    if (services.fireworks || services.keewano) {
      setSaving('saving');
      try {
        await saveMemory({
          profile: { name: user.name, company: user.company, pitch: user.pitch, headline: user.headline, location: user.location, experience: user.experience.filter(e => e.trim()) },
          signals: { goals: chosen.goal ?? [], meet: chosen.meet ?? [], skip: chosen.skip ?? [], context },
          brief: draft.brief
        });
        setSaving('idle');
      } catch {
        setSaving('failed');
        await new Promise(r => setTimeout(r, 1800));
      }
    }
    if (alive.current) go('calendar');
  };
  const finishImport = () => {
    setDraft(d => ({ ...d, included: suggested.map(s => s.id), generated: false, saved: false }));
    setBusy(false);
  };

  const generate = () => {
    const profile = profileBrief();
    const brief = assembleMemory(profile, included);
    setDraft(d => ({ ...d, included: included.map(s => s.id), brief, provenance: { profile, sessions: included, notes: context }, editedAt: {}, generated: true, saved: false }));
    go('memory');
  };

  const title = busy && step === 'sessions' ? 'Getting to know your startup.' : step === 'sources' ? 'Connect your apps.' : step === 'sessions' ? 'Keep the context that matters.' : 'Your memory.';
  return (
    <section className={`panel panel--wide memory-flow${step === 'sources' || busy ? ' memory-flow--sources' : ''}${step === 'memory' ? ' memory-flow--document' : ''}`}>
      <div className="memory-navigation">
      <div className="memory-topline">
        <span className="memory-demo">Personal context</span>
        <span className="t-small t-muted">Demo · sample conversations</span>
      </div>
      <nav aria-label="Memory onboarding" className="memory-steps">
        {steps.map((s, i) => <button key={s.id} aria-current={step === s.id ? 'step' : undefined} disabled={busy || (s.id === 'sessions' && available.length === 0) || (s.id === 'memory' && !draft.generated)} onClick={() => s.id === 'sessions' && step === 'sources' ? importSamples() : go(s.id)}><span>{i + 1}</span>{s.label}</button>)}
      </nav>
      </div>
      <div className="panel__head memory-heading">
        <h1 className="t-display" ref={heading} tabIndex={-1}>{title}</h1>
        <p className="t-body t-muted">{busy && step === 'sessions' ? 'Connecting the dots across your selected conversations.' : step === 'sources' ? 'Choose the sources for your startup’s memory.' : step === 'sessions' ? 'Review a sample backfill. Signal suggests relevant context; you decide what becomes memory.' : 'Review what Signal knows about you. Edit anything before you continue.'}</p>
      </div>
      {storageError && <p role="status">Browser storage is unavailable. Your edits will last only while this screen stays open.</p>}

      {step === 'sources' && <>
        <div className="memory-saved-note"><span><strong>{user.company}</strong> · Your profile and goals are already saved.{agent && ' Your selected personal agent is unchanged.'}</span><button className="memory-text-button" onClick={() => go('questions')}>Review profile goals</button></div>
        <SourcePicker selected={draft.sources} disabled={busy} onToggle={changeSource} />
        <div className="memory-footer">
          <label className="memory-range">Look back through sample history<select value={draft.range} disabled={busy} onChange={e => setDraft(d => ({ ...d, range: Number(e.target.value), generated: false, saved: false }))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></label>
          <div className="memory-footer-actions"><span className="t-small" role="status">{draft.sources.length} sources · {available.length} sample items</span><button className="btn btn--ink" disabled={!available.length || busy} onClick={importSamples}>{busy ? 'Preparing sample history…' : draft.generated ? 'Reimport sample history' : 'Import sample history'}</button></div>
        </div>
        <button className="memory-text-button" disabled={busy} onClick={() => { setDraft({ ...emptyDraft(), sources: draft.sources, brief: profileBrief(), provenance: { profile: profileBrief(), sessions: [], notes: context }, generated: true }); go('memory'); }}>Continue with profile only</button>
        {draft.generated && <p className="t-small t-muted">Reimporting starts a new review and replaces the current draft when you create memory again.</p>}
      </>}

      {step === 'sessions' && busy && <ContextImport items={available} onComplete={finishImport} onCancel={() => { setBusy(false); go('sources'); }} />}

      {step === 'sessions' && !busy && <>
        <div className="memory-review-summary"><p><strong>{available.length}</strong> sample items found</p><p><strong>{suggested.length}</strong> suggested as relevant</p><p><strong>{included.length}</strong> selected for memory</p></div>
        {real === 'loading' && <p className="t-small t-muted" role="status">Importing from your connected apps…</p>}
        {real && real !== 'loading' && ('error' in real
          ? <p className="t-small" role="status">Couldn’t import from your connected apps ({real.error}). The sample review below still works.</p>
          : <div className="memory-session-list">
            <h2 className="t-title">{services.keewano ? 'Imported into KeewanoDB' : 'Imported into your memory'} · {real.items.length} items from your apps</h2>
            {real.items.map((item, i) => <article className="memory-session" key={`${item.source}-${i}`}><div><div className="memory-session-meta"><span>{sources.find(source => source.id === item.source)?.name ?? item.source}</span></div><h2>{item.title}</h2><p>{item.text.length > 240 ? `${item.text.slice(0, 240)}…` : item.text}</p></div></article>)}
          </div>)}
        <p className="t-small t-muted">Classification and extraction are scripted for this demo. Expand an item to inspect its evidence. Unrelated and uncertain items start excluded.</p>
        <div className="memory-session-list">
          {available.map(s => <article className="memory-session" key={s.id}>
            <div className="memory-session-main"><input type="checkbox" aria-label={`Include ${s.title}`} checked={draft.included.includes(s.id)} onChange={() => setDraft(d => ({ ...d, included: d.included.includes(s.id) ? d.included.filter(id => id !== s.id) : [...d.included, s.id], generated: false, saved: false }))} />
              <div><div className="memory-session-meta"><span>{sources.find(source => source.id === s.source)?.name} · {s.daysAgo} days ago</span><span className={`memory-classification memory-classification--${s.classification === 'Relevant' ? 'relevant' : s.classification === 'Needs review' ? 'review' : 'excluded'}`}>{s.classification}</span></div><h2>{s.title}</h2><p>{s.reason}</p>
                <details><summary>View sample excerpt</summary><blockquote>{s.excerpt}</blockquote>{Object.keys(s.facts).length === 0 && <p className="t-small">No confirmed startup facts in this sample. Including it will not change your funding target or create a preference.</p>}</details>
              </div>
            </div>
          </article>)}
          {!available.length && <div className="card form-card"><p>No sample history in this selection. Choose a source or a wider date range.</p><button className="btn btn--line" onClick={() => go('sources')}>Choose sources</button></div>}
        </div>
        <div className="memory-footer"><button className="btn btn--line" onClick={() => go('sources')}>Back to sources</button><button className="btn btn--ink" onClick={generate}>{included.length ? `Create memory from ${included.length} items` : 'Create a blank memory'}</button></div>
      </>}

      {step === 'memory' && <>
        {!draft.generated ? <div className="card form-card"><p>Choose and review your context first, or begin with a blank memory.</p><button className="btn btn--ink" onClick={() => go('sources')}>Choose sources</button><button className="btn btn--line" onClick={() => setDraft({ ...emptyDraft(), sources: draft.sources, brief: profileBrief(), provenance: { profile: profileBrief(), sessions: [], notes: context }, generated: true })}>Use profile</button></div> : <>
          {!draft.provenance && <p className="t-small t-muted">This older draft has no saved source snapshot. Re-create memory from context to attach verified source references; your current edits are preserved until then.</p>}
          <MemoryDocument brief={draft.brief} evidence={draft.provenance?.sessions ?? []} review={available.filter(item => item.classification === 'Needs review')} editedAt={draft.editedAt ?? {}} profile={draft.provenance?.profile} notes={draft.provenance?.notes ?? context} onValidityChange={setDocumentValid} onReview={() => go('sessions')} onChange={brief => setDraft(d => {
            const editedAt = { ...d.editedAt };
            const now = new Date().toISOString();
            for (const { id } of memoryFields) if (brief[id] !== d.brief[id]) editedAt[id] = now;
            return { ...d, brief, editedAt, saved: false };
          })} />
          <div className="memory-footer"><button className="btn btn--line" onClick={() => go(available.length ? 'sessions' : 'sources')}>Back to context</button><div className="memory-footer-actions"><span className="t-small t-muted">You can return to edit this memory.</span><button className="btn btn--ink" disabled={!documentValid || !draft.brief.company.trim() || saving === 'saving'} onClick={saveAndContinue}>{saving === 'saving' ? 'Saving…' : 'Save memory & continue'}</button></div></div>
          {!draft.brief.company.trim() && <p className="t-small">Add what you’re building to continue.</p>}
          {saving === 'failed' && <p className="t-small" role="status">Couldn’t reach your agent’s memory, so it’s saved only in this browser. Continuing.</p>}
        </>}
      </>}
    </section>
  );
}
