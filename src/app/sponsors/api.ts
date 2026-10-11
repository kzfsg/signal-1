// Browser side of the sponsor integrations: thin calls to our /api routes, which hold the keys.
import { useCallback, useEffect, useRef, useState } from 'react';

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/${path}`, body === undefined ? undefined : {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({ error: `${res.status} ${res.statusText}` }));
  // 503 means a service isn't set up on this deployment; keep the setup details in the server logs.
  if (res.status === 503) throw new Error('That didn’t go through. Try again in a moment.');
  if (!res.ok) throw new Error(data.error ?? `${res.status}`);
  return data as T;
}

type State<T> = { data: T | null; error: string | null; loading: boolean };

/** GET an /api route, optionally re-polling every `every` ms while `poll` is true. */
export function useApi<T>(path: string | null, every = 0) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: !!path });
  const alive = useRef(true);

  const load = useCallback(async () => {
    if (!path) return;
    try {
      const data = await api<T>(path);
      if (alive.current) setState({ data, error: null, loading: false });
    } catch (e) {
      if (alive.current) setState(s => ({ data: s.data, error: (e as Error).message, loading: false }));
    }
  }, [path]);

  useEffect(() => {
    alive.current = true;
    load();
    const t = every ? window.setInterval(load, every) : 0;
    return () => {
      alive.current = false;
      clearInterval(t);
    };
  }, [load, every]);

  return { ...state, reload: load };
}

