import { useEffect, useMemo, useRef, useState } from 'react';
import { sources, type SampleSession } from './memoryData';
import { sourceActivity } from './sourceActivity';

function buildStreams(items: SampleSession[]) {
  return sources.filter(source => items.some(item => item.source === source.id)).map(source => {
    let cursor = 0;
    const seed = [...source.id].reduce((sum, c) => sum + c.charCodeAt(0), 0);
    const conversations = items.filter(item => item.source === source.id).map((item, index) => {
      const start = cursor;
      const read = start + 850 + (seed + index * 173) % 650;
      const classify = read + 1050 + (seed + index * 211) % 800;
      const end = classify + 950 + (seed + index * 127) % 850;
      cursor = end;
      return { item, start, read, classify, end };
    });
    return { source, conversations, duration: cursor };
  });
}
type Stream = ReturnType<typeof buildStreams>[number];
const result = (item: SampleSession) => item.classification === 'Relevant' ? 'Investment signal' : item.classification === 'Needs review' ? 'Needs review' : 'Unrelated';

function ConnectorStream({ stream, elapsed }: { stream: Stream; elapsed: number }) {
  const [expanded, setExpanded] = useState(true);
  const historyDialog = useRef<HTMLDialogElement>(null);
  const { source, conversations, duration } = stream;
  const processed = conversations.filter(c => elapsed >= c.end).length;
  const complete = elapsed >= duration;
  const current = conversations.find(c => elapsed < c.end);
  const status = complete ? 'Import complete' : current && elapsed < current.read ? sourceActivity[source.id].reading : current && elapsed < current.classify ? 'Classifying context' : 'Extracting findings';
  const renderConversations = () => conversations.map(({ item, start, read, classify, end }) => {
        const pending = elapsed < start;
        const done = elapsed >= end;
        const extracting = elapsed >= classify;
        const label = pending ? 'Queued' : done ? result(item) : elapsed < read ? 'Reading' : elapsed < classify ? 'Classifying' : item.classification === 'Relevant' ? 'Extracting signal' : 'Checking relevance';
        return <article key={item.id} className={`import-conversation${pending ? ' is-pending' : ''}${!pending && !done ? ' is-active' : ''}`}>
          <div className="import-conversation-meta"><span>{item.daysAgo === 1 ? 'Yesterday' : `${item.daysAgo} days ago`}</span><span className={`import-item-status${done ? item.classification === 'Relevant' ? ' is-relevant' : item.classification === 'Needs review' ? ' is-review' : ' is-unrelated' : ''}`}>{!pending && !done && <span className="import-spinner" aria-hidden="true" />}{label}</span></div>
          <h3>{item.title}</h3>
          {!pending && <blockquote>{item.excerpt}</blockquote>}
          {extracting && <div className={`import-finding${item.classification === 'Relevant' ? ' is-relevant' : ''}`}><span>{result(item)}</span><p>{Object.values(item.facts).join(' ') || item.reason}</p></div>}
        </article>;
      });
  return <section className={`import-stream${complete ? ' is-complete' : ''}`} aria-label={`${source.name} import`}>
    <div className="import-stream-toggle">
      <button className="import-stream-open" aria-label={`View ${source.name} context`} aria-haspopup="dialog" onClick={() => historyDialog.current?.showModal()}>
        <span className="memory-source-mark" data-brand={source.id}><img src={source.logo} alt="" /></span>
        <span className="import-stream-name"><strong>{source.name}</strong><span>{processed} / {conversations.length} {sourceActivity[source.id].unit} reviewed</span></span>
      </button>
      <span className={complete ? 'import-done' : 'import-spinner'} aria-hidden="true">{complete ? '✓' : ''}</span>
      <button className="import-stream-collapse" aria-label={`${expanded ? 'Collapse' : 'Expand'} ${source.name} preview`} aria-expanded={expanded} aria-controls={`stream-${source.id}`} onClick={() => setExpanded(value => !value)}><span className={`import-chevron${expanded ? ' is-open' : ''}`} aria-hidden="true">⌄</span></button>
    </div>
    <div className="import-stream-status"><span>{status}</span><span>{Math.min(100, Math.round(elapsed / duration * 100))}%</span></div>
    <progress value={Math.min(elapsed, duration)} max={duration} aria-label={`${source.name} progress`} />
    {!expanded && <p className="import-collapsed-preview">{current?.item.title ?? `${conversations.filter(c => c.item.classification === 'Relevant').length} relevant items ready`}</p>}
    <div id={`stream-${source.id}`} hidden={!expanded} className={`import-stack${conversations.length > 2 ? ' has-overflow' : ''}`}>
      <div className="import-conversations">{renderConversations()}</div>
      {conversations.length > 2 && <button className="import-view-history" onClick={() => historyDialog.current?.showModal()} aria-haspopup="dialog">View full history <span>{conversations.length}</span><span aria-hidden="true">↓</span></button>}
    </div>
    <dialog ref={historyDialog} className="connector-dialog import-history-dialog" aria-labelledby={`history-title-${source.id}`}>
      <div className="connector-dialog-header"><span className="memory-source-mark" data-brand={source.id}><img src={source.logo} alt="" /></span><h2 id={`history-title-${source.id}`}>{source.name} history</h2><button className="connector-close" aria-label="Close history" onClick={() => historyDialog.current?.close()}>×</button></div>
      <p className="import-history-caption">{conversations.length} {sourceActivity[source.id].unit} in your selected sample history · {processed} reviewed</p>
      <div className="import-history-list">{renderConversations()}</div>
    </dialog>
  </section>;
}

export default function ContextImport({ items, onComplete, onCancel }: { items: SampleSession[]; onComplete: () => void; onCancel: () => void }) {
  const streams = useMemo(() => buildStreams(items), [items]);
  const [elapsed, setElapsed] = useState(0);
  const duration = Math.max(0, ...streams.map(s => s.duration));
  const complete = elapsed >= duration;
  useEffect(() => {
    if (complete) return;
    const start = performance.now();
    const timer = window.setInterval(() => setElapsed(previous => Math.max(previous, performance.now() - start)), 150);
    return () => window.clearInterval(timer);
  }, [complete]);
  const processed = streams.flatMap(s => s.conversations).filter(c => elapsed >= c.end);
  const finished = streams.filter(s => elapsed >= s.duration).length;
  return <div className="context-import">
    <div className="import-overview" role="status"><span><span className={complete ? 'import-done' : 'import-spinner'} aria-hidden="true">{complete ? '✓' : ''}</span>{complete ? 'Context ready to review' : `Pulling from ${streams.length} sources in parallel`}</span><span>{processed.length} / {items.length} items · {finished} / {streams.length} sources complete</span></div>
    <div className="import-streams">{streams.map(stream => <ConnectorStream key={stream.source.id} stream={stream} elapsed={elapsed} />)}</div>
    {!streams.length && <p>No conversations in this selection. Choose another source or a wider date range.</p>}
    <div className="memory-footer"><button className="memory-text-button" onClick={onCancel}>Back to sources</button>{complete ? <button className="btn btn--ink" onClick={onComplete}>Review extracted context</button> : <button className="memory-text-button" onClick={() => setElapsed(duration)}>Skip animation</button>}</div>
    <p className="t-small t-muted">Simulated import · fictional conversations, scripted classification and findings.</p>
  </div>;
}
