// Browser side of the live pipeline: typed calls to our /api routes, and which services are switched on.
import { useEffect, useRef, useState } from 'react';
import type { Chat, ContextItem, FounderProfile, Meet, Services, Signals } from '../../server/signal';
import type { User } from './data';
import type { ComposioSource } from './connectorSetup';
import type { Brief, SourceId } from './memoryData';
import { api } from './sponsors/api';

export type { Chat, ComposioSource, ContextItem, Services };

export interface Connection { source: SourceId; status: 'active' | 'pending' | 'failed' }

export const listChats = () => api<{ source: 'calendar' | 'demo'; chats: Chat[] }>('agent/chats');
export const runMeeting = (runId: string, chat: Chat) => api<Meet>('agent/meet', { runId, chat });
export const connectComposio = (source: ComposioSource) => api<{ redirectUrl: string }>('composio/connect', { source });
export const listConnections = () => api<{ connections?: Connection[] }>('composio/connections').then(r => r.connections ?? []);
export const importItems = (sources: ComposioSource[]) => api<{ items: ContextItem[] }>('composio/import', { sources });
export const linkedinProfile = () => api<Partial<FounderProfile>>('composio/profile');
export const saveMemory = (body: { profile: FounderProfile; signals: Signals; brief: Brief }) => api<unknown>('memory', body);

/** Non-empty fields of the imported LinkedIn profile, as an edit to the user. */
export function profilePatch(p: Partial<FounderProfile>): Partial<User> {
  const patch: Partial<User> = {};
  for (const k of ['name', 'company', 'pitch', 'headline', 'location'] as const) if (p[k]?.trim()) patch[k] = p[k];
  if (p.experience?.some(e => e.trim())) patch.experience = p.experience.filter(e => e.trim());
  return patch;
}

interface Status { services: Services; model: string | null }
const off: Services = { fireworks: false, composio: false, keewano: false, dial: false };
const notReady: Status & { ready: boolean } = { services: off, model: null, ready: false };

let status: Promise<Status> | undefined;
// One fetch per page load; a failure isn't cached, and reads as everything off so the demo plays.
function loadStatus() {
  status ??= api<Partial<Status>>('status')
    .then(s => ({ services: { ...off, ...s.services }, model: s.model ?? null }))
    .catch(() => { status = undefined; return { services: off, model: null }; });
  return status;
}

export function useServices() {
  const [s, setS] = useState<(Status & { ready: boolean }) | null>(null);
  useEffect(() => {
    let alive = true;
    loadStatus().then(v => { if (alive) setS({ ...v, ready: true }); });
    return () => { alive = false; };
  }, []);
  return s ?? notReady;
}

const POLL_MS = 2000;
const GIVE_UP_MS = 3 * 60_000;

/** Connect an app through Composio: open its consent page, then poll until the connection is active. */
export function useComposioConnect(onActive: (source: ComposioSource) => void) {
  const [state, setState] = useState<Partial<Record<SourceId, 'pending' | 'failed'>>>({});
  const timers = useRef(new Map<ComposioSource, number>());
  const done = useRef(onActive);
  done.current = onActive;
  useEffect(() => () => timers.current.forEach(clearInterval), []);

  const settle = (source: ComposioSource, next?: 'failed') => {
    clearInterval(timers.current.get(source));
    timers.current.delete(source);
    setState(s => ({ ...s, [source]: next }));
  };

  const connect = async (source: ComposioSource) => {
    // Opened before the await: browsers only allow a popup straight from the click.
    const tab = window.open('', '_blank');
    setState(s => ({ ...s, [source]: 'pending' }));
    try {
      const { redirectUrl } = await connectComposio(source);
      if (tab) tab.location.href = redirectUrl;
      else window.open(redirectUrl, '_blank');
    } catch {
      tab?.close();
      return settle(source, 'failed');
    }
    const until = Date.now() + GIVE_UP_MS;
    clearInterval(timers.current.get(source));
    timers.current.set(source, window.setInterval(async () => {
      const found = (await listConnections().catch(() => [])).find(c => c.source === source);
      if (found?.status === 'active') { settle(source); done.current(source); }
      else if (found?.status === 'failed' || Date.now() > until) settle(source, 'failed');
    }, POLL_MS));
  };

  return { state, connect };
}
