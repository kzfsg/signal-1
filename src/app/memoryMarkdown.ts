import { memoryFields, type Brief, type MemoryField } from './memoryData';

export const documentLabels: Record<MemoryField, string> = {
  company: 'Company', funding: 'Current raise', goals: 'Goals',
  preferences: 'Preferences', boundaries: 'Privacy & boundaries'
};

export function toMarkdown(brief: Brief): string {
  return '# Your memory\n\n' + memoryFields.map(({ id }) => `## ${documentLabels[id]}\n\n${brief[id]}`).join('\n\n') + '\n';
}

// Keep the five section boundaries explicit: reject ambiguous edits instead of dropping text.
export function fromMarkdown(markdown: string): Brief | null {
  const normalized = markdown.replace(/\r\n/g, '\n');
  const matches = [...normalized.matchAll(/^## (.+)\s*$/gm)];
  if (matches.length !== memoryFields.length || normalized.slice(0, matches[0]?.index).trim() !== '# Your memory') return null;
  const result = {} as Brief;
  for (let i = 0; i < memoryFields.length; i++) {
    const { id } = memoryFields[i];
    if (matches[i][1].trim() !== documentLabels[id]) return null;
    const start = matches[i].index! + matches[i][0].length;
    result[id] = normalized.slice(start, matches[i + 1]?.index ?? normalized.length).trim();
  }
  return result;
}
