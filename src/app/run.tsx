import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { Meet } from './data';
import { listChats, runMeeting, type Chat } from './live';
import { useProfile } from './profile';

export type MeetResult = Meet | { error: string };

/** One live run of the agent over the calendar. `results` fills in as meetings finish, in any order. */
export interface Run {
  runId: string;
  source: 'calendar' | 'demo';
  chats: Chat[];
  results: Record<string, MeetResult>;
}

interface RunContext {
  run: Run | null;
  /** Load the chats and open a fresh run. */
  begin: () => Promise<void>;
  /** Start meeting the run's chats. Starting the same run twice does nothing. */
  start: (run: Run) => void;
}

const IN_FLIGHT = 4;

export const isMeet = (r: MeetResult | undefined): r is Meet => !!r && !('error' in r);

// A failed meeting is retried once, then recorded, so it never stalls the rest of the run.
async function meetOnce(runId: string, chat: Chat): Promise<MeetResult> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await runMeeting(runId, chat);
    } catch (e) {
      if (attempt) return { error: (e as Error).message };
    }
  }
}

const RunCtx = createContext<RunContext | null>(null);

export function RunProvider({ children }: { children: ReactNode }) {
  const [run, setRun] = useState<Run | null>(null);
  const started = useRef(new Set<string>());
  const loading = useRef<Promise<void> | null>(null);

  // One load at a time, so a double mount can't open two runs.
  const begin = useCallback(() => {
    loading.current ??= listChats()
      .then(({ source, chats }) => {
        if (!chats.length) throw new Error('No chats on the calendar');
        setRun({ runId: crypto.randomUUID(), source, chats, results: {} });
      })
      .finally(() => { loading.current = null; });
    return loading.current;
  }, []);

  const start = useCallback((r: Run) => {
    if (started.current.has(r.runId)) return;
    started.current.add(r.runId);
    const todo = [...r.chats];
    const worker = async () => {
      for (let chat = todo.shift(); chat; chat = todo.shift()) {
        const result = await meetOnce(r.runId, chat);
        const id = chat.id;
        setRun(cur => (cur?.runId === r.runId ? { ...cur, results: { ...cur.results, [id]: result } } : cur));
      }
    };
    for (let i = 0; i < IN_FLIGHT; i++) void worker();
  }, []);

  return <RunCtx.Provider value={{ run, begin, start }}>{children}</RunCtx.Provider>;
}

/** The run, the chats on the calendar (`plan`), and the finished meets, in chat order. With no run both are the demo month. */
export function useRun() {
  const ctx = useContext(RunCtx);
  if (!ctx) throw new Error('useRun must be used inside <RunProvider>');
  const { meets: demo } = useProfile();
  const meets = ctx.run ? ctx.run.chats.map(c => ctx.run!.results[c.id]).filter(isMeet) : demo;
  return { ...ctx, meets, plan: ctx.run ? ctx.run.chats : demo };
}
