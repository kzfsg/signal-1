import { useState, type ReactNode } from 'react';
import { memoryFields, sources, type Brief, type MemoryField, type SampleSession } from './memoryData';
import { documentLabels, fromMarkdown, toMarkdown } from './memoryMarkdown';

// Render a small, safe Markdown subset as React nodes; never inject imported HTML.
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part.startsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part);
}
function Content({ text }: { text: string }) {
  if (!text.trim()) return <p className="memory-document__empty">Not added yet.</p>;
  return <div className="memory-document__prose">{text.split(/\n\s*\n/).map((block, i) => {
    const lines = block.split('\n');
    if (lines.every(line => /^[-*] /.test(line))) return <ul key={i}>{lines.map((line, j) => <li key={j}>{inline(line.slice(2))}</li>)}</ul>;
    return <p key={i}>{inline(block)}</p>;
  })}</div>;
}

type Props = {
  brief: Brief;
  evidence: SampleSession[];
  review: SampleSession[];
  editedAt: Partial<Record<MemoryField, string>>;
  profile?: Brief;
  notes: string;
  onChange: (brief: Brief) => void;
  onValidityChange: (valid: boolean) => void;
  onReview: () => void;
};

export default function MemoryDocument({ brief, evidence, review, editedAt, profile, notes, onChange, onValidityChange, onReview }: Props) {
  const [view, setView] = useState<'preview' | 'markdown'>('preview');
  const [markdown, setMarkdown] = useState(() => toMarkdown(brief));
  const [invalid, setInvalid] = useState(false);
  const [editing, setEditing] = useState<MemoryField | null>(null);
  const [editValue, setEditValue] = useState('');
  const switchView = (next: typeof view) => {
    if (invalid) return;
    if (editing) onChange({ ...brief, [editing]: editValue });
    if (next === 'markdown') setMarkdown(toMarkdown(editing ? { ...brief, [editing]: editValue } : brief));
    setEditing(null);
    setView(next);
  };
  const download = () => {
    const blob = new Blob([toMarkdown(brief)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'memory.md'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="memory-document">
    <div className="memory-document__toolbar">
      <div className="memory-document__tabs" aria-label="Memory view">
        {(['preview', 'markdown'] as const).map(tab => <button type="button" key={tab} aria-pressed={view === tab} disabled={invalid && tab === 'preview'} onClick={() => switchView(tab)}>{tab === 'preview' ? 'Preview' : 'Markdown'}</button>)}
      </div>
      <button type="button" className="memory-document__action" disabled={invalid || editing !== null} onClick={download}>Export .md</button>
    </div>
    {view === 'preview' ? <div className="memory-document__body">{memoryFields.map(field => {
      // Company is taken from the confirmed profile, never from imported company claims.
      const refs = field.id === 'company' ? [] : evidence.filter(item => item.facts[field.id]);
      const hasProfile = Boolean(profile?.[field.id]?.trim());
      return <section className="memory-document__section" key={field.id}>
        <div className="memory-document__section-head"><h2>{documentLabels[field.id]}</h2>{editing !== field.id && <button className="memory-document__action" aria-label={`Edit ${documentLabels[field.id]}`} onClick={() => { if (editing) onChange({ ...brief, [editing]: editValue }); setEditing(field.id); setEditValue(brief[field.id]); }}>Edit</button>}</div>
        {editing === field.id ? <div className="memory-document__editor"><textarea autoFocus aria-label={documentLabels[field.id]} value={editValue} placeholder={field.placeholder} onChange={e => { setEditValue(e.target.value); onChange({ ...brief, [field.id]: e.target.value }); }} rows={4} /><button className="memory-document__action" onClick={() => setEditing(null)}>Done</button></div> : <Content text={brief[field.id]} />}
        <div className="memory-document__attribution">
          {editedAt[field.id] && <span>Edited by you</span>}
          {(refs.length > 0 || hasProfile) && <details><summary>{[...(hasProfile ? ['Profile'] : []), ...new Set(refs.map(item => sources.find(source => source.id === item.source)?.name))].join(' · ')} ↗</summary>
            <div className="memory-document__sources">{hasProfile && <div><strong>Profile & onboarding</strong><p>{profile?.[field.id]}</p></div>}{refs.map(item => <div key={item.id}><strong>{item.title}</strong><p className="t-small t-muted">{sources.find(source => source.id === item.source)?.name} · {item.daysAgo} days ago · Sample</p><blockquote>{item.excerpt}</blockquote></div>)}{editedAt[field.id] && <p className="t-small t-muted">Original context is retained. It may differ from your edits.</p>}</div>
          </details>}
        </div>
      </section>;
    })}</div> : <div className="memory-document__markdown">
      <label htmlFor="memory-markdown">memory.md</label>
      <p id="memory-markdown-help">Edit the content beneath each heading. Keep the document title and five section headings.</p>
      <textarea id="memory-markdown" aria-describedby="memory-markdown-help memory-markdown-status" aria-invalid={invalid} spellCheck={false} value={markdown} onChange={e => {
        setMarkdown(e.target.value);
        const parsed = fromMarkdown(e.target.value);
        setInvalid(!parsed); onValidityChange(Boolean(parsed));
        if (parsed) onChange(parsed);
      }} />
      <p id="memory-markdown-status" role="status">{invalid ? 'Keep # Your memory and the five original ## headings in order. Your text is still here; restore the headings or undo to continue.' : 'Changes are reflected in Preview and saved in this browser.'}</p>
      {invalid && <button className="memory-document__action" onClick={() => { setMarkdown(toMarkdown(brief)); setInvalid(false); onValidityChange(true); }}>Restore last valid document</button>}
    </div>}
    <div className="memory-document__details">
      {review.length > 0 && <details><summary>Needs review <span>{review.length}</span></summary><p className="t-small t-muted">These conversations have no confirmed facts to add yet.</p>{review.map(item => <div className="memory-document__review" key={item.id}><strong>{item.title}</strong><p>{item.reason}</p><blockquote>{item.excerpt}</blockquote></div>)}<button className="memory-document__action" onClick={onReview}>Review original context</button></details>}
      <details><summary>Recent changes</summary>{Object.entries(editedAt).length ? <ul>{Object.entries(editedAt).sort((a, b) => b[1].localeCompare(a[1])).map(([id, date]) => <li key={id}>{documentLabels[id as MemoryField]} edited by you <time dateTime={date}>{new Date(date).toLocaleString()}</time></li>)}</ul> : <p>Starting memory assembled from your profile and selected sample context.</p>}</details>
      {notes && <details><summary>Onboarding notes</summary><p className="memory-document__notes">{notes}</p></details>}
    </div>
    <p className="memory-document__footnote">Demo memory is saved in this browser. Agent meetings do not use it yet.</p>
  </div>;
}
