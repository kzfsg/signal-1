import type { SourceId } from './memoryData';

// Different source types describe what is being read, not a fictional universal chat API.
export const sourceActivity: Record<SourceId, { reading: string; unit: string }> = {
  chatgpt: { reading: 'Reading planning conversations', unit: 'conversations' },
  claude: { reading: 'Reading decisions and comparisons', unit: 'conversations' },
  codex: { reading: 'Reading work-session context', unit: 'work sessions' },
  muse: { reading: 'Reading personal reflections', unit: 'personal conversations' },
  linkedin: { reading: 'Reading professional background', unit: 'profile entries' },
  gmail: { reading: 'Reading email follow-ups', unit: 'email threads' },
  granola: { reading: 'Reading meeting reflections', unit: 'meeting notes' },
  files: { reading: 'Reading your introduction brief', unit: 'documents' },
  'google-drive': { reading: 'Reading deck drafts', unit: 'documents' },
  'google-calendar': { reading: 'Reading agendas and scheduling notes', unit: 'calendar entries' },
  notion: { reading: 'Reading operating priorities', unit: 'planning pages' },
  slack: { reading: 'Reading team decisions', unit: 'team threads' },
  outlook: { reading: 'Reading diligence follow-ups', unit: 'email threads' },
  gemini: { reading: 'Reading pitch rehearsals', unit: 'conversations' },
  perplexity: { reading: 'Reading research criteria', unit: 'research threads' },
  copilot: { reading: 'Reading meeting preparation', unit: 'meeting briefs' },
  hermes: { reading: 'Reading remembered preferences', unit: 'assistant conversations' },
  opencode: { reading: 'Reading demo-preparation context', unit: 'work sessions' },
  pi: { reading: 'Reading task-session context', unit: 'work sessions' },
  messages: { reading: 'Reading post-coffee messages', unit: 'message threads' },
  telegram: { reading: 'Reading founder-group introductions', unit: 'group threads' },
  whatsapp: { reading: 'Reading cofounder conversations', unit: 'message threads' },
  discord: { reading: 'Reading developer-community feedback', unit: 'community threads' },
  openclaw: { reading: 'Reading assistant check-ins', unit: 'assistant conversations' },
  manus: { reading: 'Reading delegated research', unit: 'research tasks' }
};
