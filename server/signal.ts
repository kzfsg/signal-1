// The domain the live pipeline passes between modules: who the founder is, the chats on their
// calendar, and the services that are switched on. The meeting's output is `Meet` from the app.
import type { Meet, Person } from '../src/app/data';

export type { Meet, Person };

export type ServiceId = 'fireworks' | 'composio' | 'keewano' | 'dial';
export type Services = Record<ServiceId, boolean>;

/** One piece of context pulled from a connected app. */
export interface ContextItem {
  source: string; // app SourceId, e.g. 'gmail'
  title: string;
  text: string;
  at: string; // ISO
}

/** What the founder told Signal a good signal looks like. */
export interface Signals {
  goals: string[];
  meet: string[];
  skip: string[];
  context: string;
}

export interface FounderProfile {
  name: string;
  company: string;
  pitch: string;
  headline: string;
  location: string;
  experience: string[];
}

/** Everything the founder's agent knows about them. Lives in KeewanoDB. */
export interface FounderMemory {
  profile: FounderProfile;
  signals: Signals;
  /** The reviewed memory document from onboarding: company, funding, goals, preferences, boundaries. */
  brief: Record<'company' | 'funding' | 'goals' | 'preferences' | 'boundaries', string>;
  items: ContextItem[];
  savedAt: string; // ISO
}

/** A coffee chat on the calendar, before the agents meet. `Meet` minus the outcome. */
export type Chat = Pick<Meet, 'id' | 'person' | 'week' | 'day' | 'start' | 'minutes'> & {
  startsAt: string; // ISO
  email?: string;
};

export interface Slot {
  start: string; // ISO
  minutes: number;
}
