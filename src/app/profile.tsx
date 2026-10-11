import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { defaultUser, firstName, meets as demoMeets, personalise, questionnaire, type Meet, type User } from './data';

// Everything the person can customise. Saved in localStorage so edits survive a reload.
export type AgentProvider = 'claude' | 'chatgpt' | 'custom';
export interface PersonalAgent {
  provider: AgentProvider;
  endpoint?: string;
}

export const agentLabel: Record<AgentProvider, string> = { claude: 'Claude', chatgpt: 'ChatGPT', custom: 'Custom agent' };

// How the agent reads mid-sentence: "runs on your Claude", "via your own agent".
export const agentName = (a: PersonalAgent) => (a.provider === 'custom' ? 'own agent' : agentLabel[a.provider]);

interface Saved {
  user: User;
  agent: PersonalAgent | null;
  options: Record<string, string[]>;
  chosen: Record<string, string[]>;
  context: string;
}

interface Profile extends Saved {
  first: string;
  meets: Meet[];
  setUser: (patch: Partial<User>) => void;
  toggle: (id: string, option: string) => void;
  addOption: (id: string, option: string) => void;
  setContext: (text: string) => void;
  setAgent: (agent: PersonalAgent | null) => void;
  resetUser: () => void;
}

const KEY = 'signal.profile.v1';

function defaults(): Saved {
  return {
    user: defaultUser,
    agent: null,
    options: Object.fromEntries(questionnaire.map(q => [q.id, q.options])),
    chosen: Object.fromEntries(questionnaire.map(q => [q.id, q.chosen])),
    context: questionnaire.find(q => q.id === 'context')?.text ?? ''
  };
}

function load(): Saved {
  const base = defaults();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Saved> | null;
    if (!saved) return base;
    return {
      user: { ...base.user, ...saved.user },
      agent: saved.agent ?? null,
      options: { ...base.options, ...saved.options },
      chosen: { ...base.chosen, ...saved.chosen },
      context: saved.context ?? base.context
    };
  } catch {
    return base;
  }
}

const ProfileContext = createContext<Profile | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(saved));
  }, [saved]);

  const meets = useMemo(() => personalise(demoMeets, saved.user), [saved.user]);

  const value: Profile = {
    ...saved,
    first: firstName(saved.user.name),
    meets,
    setUser: patch => setSaved(s => ({ ...s, user: { ...s.user, ...patch } })),
    toggle: (id, option) =>
      setSaved(s => {
        const on = s.chosen[id] ?? [];
        return { ...s, chosen: { ...s.chosen, [id]: on.includes(option) ? on.filter(o => o !== option) : [...on, option] } };
      }),
    addOption: (id, option) =>
      setSaved(s => {
        const text = option.trim();
        if (!text) return s;
        const opts = s.options[id] ?? [];
        const on = s.chosen[id] ?? [];
        return {
          ...s,
          options: { ...s.options, [id]: opts.includes(text) ? opts : [...opts, text] },
          chosen: { ...s.chosen, [id]: on.includes(text) ? on : [...on, text] }
        };
      }),
    setContext: context => setSaved(s => ({ ...s, context })),
    setAgent: agent => setSaved(s => ({ ...s, agent })),
    resetUser: () => setSaved(s => ({ ...s, user: defaultUser }))
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const profile = useContext(ProfileContext);
  if (!profile) throw new Error('useProfile must be used inside <ProfileProvider>');
  return profile;
}
