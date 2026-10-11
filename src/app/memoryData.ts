import type { User } from './data';
import geminiLogo from '../assets/sources/gemini.svg';
import perplexityLogo from '../assets/sources/perplexity.svg';
import copilotLogo from '../assets/sources/copilot.svg';
import hermesLogo from '../assets/sources/hermes.png';
import opencodeLogo from '../assets/sources/opencode.png';
import piLogo from '../assets/sources/pi.svg';
import openclawLogo from '../assets/sources/openclaw.svg';
import manusLogo from '../assets/sources/manus.svg';
import messagesLogo from '../assets/sources/messages.svg';
import telegramLogo from '../assets/sources/telegram.svg';
import whatsappLogo from '../assets/sources/whatsapp.svg';
import discordLogo from '../assets/sources/discord.svg';
import driveLogo from '../assets/sources/google-drive.svg';
import calendarLogo from '../assets/sources/google-calendar.svg';
import notionLogo from '../assets/sources/notion.svg';
import slackLogo from '../assets/sources/slack.svg';
import outlookLogo from '../assets/sources/outlook.svg';
import chatgptLogo from '../assets/sources/chatgpt.svg';
import claudeLogo from '../assets/sources/claude.png';
import codexLogo from '../assets/sources/codex.svg';
import museLogo from '../assets/sources/muse.svg';
import linkedinLogo from '../assets/sources/linkedin.png';
import gmailLogo from '../assets/sources/gmail.svg';
import granolaLogo from '../assets/sources/granola.svg';
import filesLogo from '../assets/sources/files.png';

export type SourceId = 'gemini' | 'perplexity' | 'copilot' | 'hermes' | 'opencode' | 'pi' | 'openclaw' | 'manus' | 'messages' | 'telegram' | 'whatsapp' | 'discord' | 'chatgpt' | 'claude' | 'codex' | 'muse' | 'linkedin' | 'gmail' | 'granola' | 'files' | 'google-drive' | 'google-calendar' | 'notion' | 'slack' | 'outlook';
export type MemoryField = 'company' | 'funding' | 'goals' | 'preferences' | 'boundaries';
export const memoryFields: { id: MemoryField; label: string; placeholder: string }[] = [
  { id: 'company', label: 'What you’re building', placeholder: 'Your company, product, and who it helps' },
  { id: 'funding', label: 'Your current raise', placeholder: 'Stage, target, traction, and where the round stands' },
  { id: 'goals', label: 'What you need now', placeholder: 'What would make the next conversation worthwhile?' },
  { id: 'preferences', label: 'What a good fit looks like', placeholder: 'Expertise, working style, and trade-offs' },
  { id: 'boundaries', label: 'What stays private', placeholder: 'Information your agent should hold back' }
];
export const sources: { id: SourceId; name: string; logo: string; category: string }[] = [
  { id: 'openclaw', name: 'OpenClaw', logo: openclawLogo, category: 'Personal assistants' },
  { id: 'manus', name: 'Manus', logo: manusLogo, category: 'Personal assistants' },
  {"id": "gemini", "name": "Gemini", "logo": geminiLogo, "category": "Personal assistants"},
  {"id": "perplexity", "name": "Perplexity", "logo": perplexityLogo, "category": "Personal assistants"},
  {"id": "copilot", "name": "Microsoft Copilot", "logo": copilotLogo, "category": "Personal assistants"},
  {"id": "hermes", "name": "Hermes", "logo": hermesLogo, "category": "Personal assistants"},
  {"id": "opencode", "name": "OpenCode", "logo": opencodeLogo, "category": "Work agents"},
  {"id": "pi", "name": "Pi agent", "logo": piLogo, "category": "Work agents"},
  {"id": "messages", "name": "Messages", "logo": messagesLogo, "category": "Meetings & messaging"},
  {"id": "telegram", "name": "Telegram", "logo": telegramLogo, "category": "Meetings & messaging"},
  {"id": "whatsapp", "name": "WhatsApp", "logo": whatsappLogo, "category": "Meetings & messaging"},
  {"id": "discord", "name": "Discord", "logo": discordLogo, "category": "Meetings & messaging"},
  { id: 'google-drive', name: 'Google Drive', logo: driveLogo, category: 'Documents & notes' },
  { id: 'google-calendar', name: 'Google Calendar', logo: calendarLogo, category: 'Email & calendar' },
  { id: 'outlook', name: 'Outlook', logo: outlookLogo, category: 'Email & calendar' },
  { id: 'notion', name: 'Notion', logo: notionLogo, category: 'Documents & notes' },
  { id: 'slack', name: 'Slack', logo: slackLogo, category: 'Meetings & messaging' },
  { id: 'chatgpt', name: 'ChatGPT', logo: chatgptLogo, category: 'Personal assistants' },
  { id: 'claude', name: 'Claude', logo: claudeLogo, category: 'Personal assistants' },
  { id: 'codex', name: 'Codex', logo: codexLogo, category: 'Work agents' },
  { id: 'muse', name: 'Muse (Meta)', logo: museLogo, category: 'Personal assistants' },
  { id: 'linkedin', name: 'LinkedIn', logo: linkedinLogo, category: 'Professional profile' },
  { id: 'gmail', name: 'Gmail', logo: gmailLogo, category: 'Email & calendar' },
  { id: 'granola', name: 'Granola', logo: granolaLogo, category: 'Meetings & messaging' },
  { id: 'files', name: 'Files & notes', logo: filesLogo, category: 'Documents & notes' }
];
export interface SampleSession { id: string; source: SourceId; title: string; daysAgo: number; classification: 'Relevant' | 'Not relevant' | 'Needs review'; reason: string; excerpt: string; facts: Partial<Record<MemoryField, string>> }
export const sessions: SampleSession[] = [
  { id: 'openclaw-intro', source: 'openclaw', title: 'Warm introductions · this week’s priorities', daysAgo: 1, classification: 'Relevant', reason: 'The founder prioritizes warm introductions to technical seed investors.', excerpt: 'Ari: Prioritize introductions from founders we already know. We need a seed lead who understands open-source infrastructure, not another general networking call.', facts: { goals: 'Get warm introductions to seed leads through trusted founders.', preferences: 'Prioritize investors who understand open-source infrastructure.' } },
  { id: 'manus-diligence', source: 'manus', title: 'Investor research · shortlist criteria', daysAgo: 3, classification: 'Relevant', reason: 'The task includes an explicit instruction about investor fit.', excerpt: 'Ari: Build the shortlist around seed investors who have backed developer tools. Flag portfolio conflicts; exclude consumer-only funds.', facts: { preferences: 'Prioritize seed investors with developer tools experience and check portfolio conflicts.' } },
  {"id": "gemini-sample", "source": "gemini", "title": "Investor shortlist", "daysAgo": 2, "classification": "Relevant", "reason": "An explicit statement from the fictional founder informs startup context.", "excerpt": "I want seed investors who understand developer infrastructure.", "facts": {"goals": "Find seed investors with developer infrastructure expertise."}},
  {"id": "perplexity-sample", "source": "perplexity", "title": "Researching seed funds", "daysAgo": 2, "classification": "Needs review", "reason": "Research or another person’s suggestion does not confirm the founder’s intent.", "excerpt": "Which funds have invested in open-source infrastructure? These are candidates, not my shortlist.", "facts": {}},
  {"id": "copilot-sample", "source": "copilot", "title": "Preparing investor questions", "daysAgo": 2, "classification": "Relevant", "reason": "An explicit statement from the fictional founder informs startup context.", "excerpt": "I want to ask how they help with customer introductions and technical hiring.", "facts": {"goals": "Discuss customer introductions and technical hiring support with investors."}},
  {"id": "hermes-sample", "source": "hermes", "title": "Remember my investor preferences", "daysAgo": 2, "classification": "Relevant", "reason": "An explicit statement from the fictional founder informs startup context.", "excerpt": "Remember: keep product decisions with us and prioritize investors who support open source.", "facts": {"preferences": "Retain product autonomy and prioritize support for open-source distribution."}},
  {"id": "opencode-sample", "source": "opencode", "title": "Preparing the investor demo", "daysAgo": 2, "classification": "Relevant", "reason": "An explicit statement from the fictional founder informs startup context.", "excerpt": "For the demo brief: Tracewell builds open-source tracing for AI agents in production.", "facts": {"company": "Tracewell builds open-source tracing for AI agents in production."}},
  {"id": "pi-sample", "source": "pi", "title": "Refactoring the test suite", "daysAgo": 2, "classification": "Not relevant", "reason": "This conversation contains no fundraising or startup preferences.", "excerpt": "Rename the test helper and fix the failing import.", "facts": {}},
  {"id": "messages-sample", "source": "messages", "title": "Reflection after investor coffee", "daysAgo": 2, "classification": "Relevant", "reason": "An explicit statement from the fictional founder informs startup context.", "excerpt": "Ari: They pushed us to drop open source. I want a lead who supports that model.", "facts": {"preferences": "Wants an investor who supports open-source distribution."}},
  {"id": "telegram-sample", "source": "telegram", "title": "Founder group · fund recommendation", "daysAgo": 2, "classification": "Needs review", "reason": "Research or another person’s suggestion does not confirm the founder’s intent.", "excerpt": "Another founder: You should try Northstar, they might invest. Ari has not confirmed interest.", "facts": {}},
  {"id": "whatsapp-sample", "source": "whatsapp", "title": "Cofounder · introductions", "daysAgo": 2, "classification": "Relevant", "reason": "An explicit statement from the fictional founder informs startup context.", "excerpt": "Ari: Please ask me before forwarding revenue numbers or customer names to investors.", "facts": {"boundaries": "Ask before sharing revenue figures or customer names."}},
  {"id": "discord-sample", "source": "discord", "title": "Community · weekend games", "daysAgo": 2, "classification": "Not relevant", "reason": "This conversation contains no fundraising or startup preferences.", "excerpt": "Anyone joining game night on Saturday?", "facts": {}},
  { id: 'drive-brief', source: 'google-drive', title: 'Tracewell · seed deck', daysAgo: 2, classification: 'Relevant', reason: 'Current company and fundraising context from a sample deck.', excerpt: 'Tracewell builds open-source tracing for AI agents. We are raising a $2.5M seed.', facts: { company: 'Tracewell builds open-source tracing for AI agents in production.', funding: 'Raising a $2.5M seed.' } },
  { id: 'calendar-agenda', source: 'google-calendar', title: 'Investor coffee · agenda', daysAgo: 3, classification: 'Needs review', reason: 'A planned meeting is not evidence of interest or a completed outcome.', excerpt: 'Discuss a potential lead investment and technical diligence with Lattice Capital.', facts: {} },
  { id: 'outlook-followup', source: 'outlook', title: 'Following up on technical diligence', daysAgo: 4, classification: 'Relevant', reason: 'An explicit request in an investor follow-up.', excerpt: 'We are looking for a lead who understands developer infrastructure and can help with customer introductions.', facts: { goals: 'Find a lead with developer infrastructure expertise and customer introductions.' } },
  { id: 'notion-plan', source: 'notion', title: 'Fundraising priorities', daysAgo: 1, classification: 'Relevant', reason: 'Current priorities from a dated planning page.', excerpt: 'Keep open-source distribution. Prioritize technical expertise over brand recognition.', facts: { preferences: 'Prioritize technical expertise and support for open-source distribution.' } },
  { id: 'slack-decision', source: 'slack', title: 'Team discussion · what we share', daysAgo: 2, classification: 'Relevant', reason: 'A team discussion contains a stated disclosure boundary.', excerpt: 'We can share adoption numbers. Ask before sending revenue or customer names outside the team.', facts: { boundaries: 'Ask before sharing revenue figures or customer names.' } },

  { id: 'gpt-raise', source: 'chatgpt', title: 'Planning Tracewell’s seed round', daysAgo: 2, classification: 'Relevant', reason: 'An explicit current fundraising target and investor need.', excerpt: 'We’re raising a $2.5M seed for Tracewell. We still need a lead who can go deep on developer infrastructure.', facts: { funding: 'Raising a $2.5M seed; looking for a lead investor.', goals: 'Find a lead with deep developer infrastructure expertise.' } },
  { id: 'gpt-trip', source: 'chatgpt', title: 'A weekend in Big Sur', daysAgo: 3, classification: 'Not relevant', reason: 'Personal travel planning does not describe this raise.', excerpt: 'Help me plan a two-day trip with a coastal hike.', facts: {} },
  { id: 'claude-fit', source: 'claude', title: 'Comparing two potential investors', daysAgo: 4, classification: 'Relevant', reason: 'A direct correction reveals a working-style preference.', excerpt: 'I want help with customer introductions, but product and hiring decisions should stay with us.', facts: { preferences: 'Values customer introductions while retaining product and hiring autonomy.' } },
  { id: 'claude-scenario', source: 'claude', title: 'Could a smaller round work?', daysAgo: 12, classification: 'Needs review', reason: 'Explores a hypothetical $1M round; no change to the actual target is confirmed.', excerpt: 'What if we raised $1M instead? Just exploring—keep our current plan for now.', facts: {} },
  { id: 'codex-context', source: 'codex', title: 'Trace viewer work → fundraising context', daysAgo: 1, classification: 'Relevant', reason: 'A mixed session contains an explicit company description and traction. Coding details are left out.', excerpt: 'For the investor demo: Tracewell is open-source tracing for AI agents in production. We have 40 teams using it and 6 paying pilots.', facts: { company: 'Tracewell builds open-source tracing for AI agents in production.', funding: '40 teams use the open-source version; 6 are paying pilots.' } },
  { id: 'codex-css', source: 'codex', title: 'Fix the mobile navigation', daysAgo: 2, classification: 'Not relevant', reason: 'Implementation details contain no fundraising or relationship decisions.', excerpt: 'The menu overflows at 390px. Adjust the mobile breakpoint.', facts: {} },
  { id: 'muse-goal', source: 'muse', title: 'What matters in the next investor meeting', daysAgo: 5, classification: 'Relevant', reason: 'Current goals and an explicit disclosure boundary.', excerpt: 'Prioritize technical investors and design partners. Share adoption numbers, but ask me before sharing revenue or customer names.', facts: { goals: 'Meet technical investors and teams that could become design partners.', boundaries: 'Ask before sharing revenue figures or customer names.' } },
  { id: 'muse-personal', source: 'muse', title: 'Organize my errands', daysAgo: 8, classification: 'Not relevant', reason: 'Personal tasks are outside this startup context.', excerpt: 'Group my grocery shopping and dry-cleaning pickup into one trip.', facts: {} },
  { id: 'linkedin-profile', source: 'linkedin', title: 'Ari Kapoor · profile', daysAgo: 14, classification: 'Relevant', reason: 'Professional background; it does not establish current fundraising intent.', excerpt: 'Founder & CEO, Tracewell. Previously worked on observability at Stripe and tracing at Segment.', facts: { company: 'Founded by Ari Kapoor, with observability experience at Stripe and Segment.' } },
  { id: 'gmail-followup', source: 'gmail', title: 'Follow-up with Halyard Ventures', daysAgo: 6, classification: 'Relevant', reason: 'A past exchange explains why the meeting did not progress.', excerpt: 'Thanks for the conversation. We need a technical lead for this round; a consumer-focused fund isn’t the right fit right now.', facts: { preferences: 'Prioritize a technical lead over consumer-focused funds for this round.' } },
  { id: 'gmail-news', source: 'gmail', title: 'Your weekly events newsletter', daysAgo: 1, classification: 'Not relevant', reason: 'A generic newsletter is not evidence of personal intent.', excerpt: 'This week: meetups, product launches, and community events.', facts: {} },
  { id: 'granola-reflection', source: 'granola', title: 'Investor coffee · founder reflection', daysAgo: 3, classification: 'Relevant', reason: 'The founder explains a mismatch, beyond basic sector fit.', excerpt: 'They understood devtools, but wanted us to abandon open source. I want an investor who supports that distribution model.', facts: { preferences: 'Wants an investor who supports open-source distribution.' } },
  { id: 'granola-old', source: 'granola', title: 'Early fundraising brainstorm', daysAgo: 45, classification: 'Needs review', reason: 'An older exploratory discussion, not the current funding plan.', excerpt: 'Maybe we bootstrap, or raise a small angel round. We haven’t decided.', facts: {} },
  { id: 'files-brief', source: 'files', title: 'Tracewell · company brief', daysAgo: 7, classification: 'Relevant', reason: 'A dated company brief with a current product and fundraising goal.', excerpt: 'Open-source tracing for production AI agents. Raising a $2.5M seed to grow the product and recruit design partners.', facts: { company: 'Tracewell builds open-source tracing for AI agents in production.', funding: 'Raising a $2.5M seed.', goals: 'Grow the product and recruit design partners.' } }
];
export type Brief = Record<MemoryField, string>;
export function createBrief(included: string[], evidence: SampleSession[] = sessions): Brief {
  return Object.fromEntries(memoryFields.map(({ id }) => [id, [...new Set(evidence.filter(s => included.includes(s.id)).map(s => s.facts[id]).filter(Boolean))].join('\n')])) as Brief;
}
export interface MemoryDraft { sources: SourceId[]; range: number; included: string[]; brief: Brief; provenance?: { profile: Brief; sessions: SampleSession[]; notes: string }; editedAt?: Partial<Record<MemoryField, string>>; generated: boolean; saved: boolean }
export const emptyDraft = (): MemoryDraft => ({ sources: [], range: 30, included: [], brief: createBrief([]), generated: false, saved: false });
export const storageKey = 'signal.memory-onboarding.v1';
export function loadDraft(): MemoryDraft {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    // Retire Conductor without discarding the rest of a saved demo draft.
    if (Array.isArray(parsed?.sources)) parsed.sources = parsed.sources.filter((id: unknown) => id !== 'conductor');
    if (Array.isArray(parsed?.included)) parsed.included = parsed.included.filter((id: unknown) => id !== 'conductor-sample');
    if (parsed?.editedAt) parsed.editedAt = Object.fromEntries(Object.entries(parsed.editedAt).filter(([id, date]) => memoryFields.some(field => field.id === id) && typeof date === 'string' && !Number.isNaN(Date.parse(date))));
    if (parsed && Array.isArray(parsed.sources) && parsed.sources.every((s: unknown) => sources.some(source => source.id === s)) && [7, 30, 90].includes(parsed.range) && Array.isArray(parsed.included) && parsed.included.every((id: unknown) => sessions.some(s => s.id === id)) && memoryFields.every(f => typeof parsed.brief?.[f.id] === 'string') && typeof parsed.generated === 'boolean' && typeof parsed.saved === 'boolean') return parsed;
  } catch { /* Storage can be unavailable or from an older demo. */ }
  return emptyDraft();
}

// Reuse the editable profile identity in fictional connector samples. These remain demo evidence.
export function sessionsForProfile(user: User): SampleSession[] {
  const replace = (text: string) => text
    .replace(/Tracewell builds open-source tracing for AI agents in production\./g, `${user.company}: ${user.pitch}.`)
    .replace(/Tracewell is open-source tracing for AI agents in production\./g, `${user.company}: ${user.pitch}.`)
    .replace(/Tracewell builds open-source tracing for AI agents\./g, `${user.company}: ${user.pitch}.`)
    .replace(/Open-source tracing for production AI agents\./g, `${user.company}: ${user.pitch}.`)
    .replace(/Tracewell/g, user.company).replace(/Ari Kapoor/g, user.name).replace(/\bAri\b/g, user.name.split(' ')[0]);
  // Additional Intuition-specific fixtures are invented demo scenarios, not biography.
  const intuitionSamples: Record<string, Partial<SampleSession>> = {
    'gpt-raise': {
      title: 'Intuition · seed round and the next milestone',
      excerpt: 'Demo founder: Model a $2.5M seed for Intuition. The next milestone is proving that engineers can understand an unfamiliar repository faster, then turning early design partners into repeat users. I want a technical lead who understands AI developer tools; no investor commitment is confirmed.',
      facts: { funding: 'Demo target: $2.5M seed; looking for a technical lead. No investor commitments confirmed.', goals: 'Validate faster codebase onboarding with design partners and turn early trials into repeat usage.' }
    },
    'claude-fit': {
      title: 'Investor fit · technical depth and useful introductions',
      excerpt: 'Demo founder: Prioritize seed investors who understand AI developer tools and can introduce engineering teams. I can show Intuition working on a real repository. Keep product and hiring decisions with our team. Ask before sharing revenue, customer names or private code.',
      facts: { preferences: 'Prefer technical seed investors who bring engineering-team introductions. Keep product and hiring decisions with the founding team.', boundaries: 'Ask before sharing revenue, customer names or private code. Share the product story and a reviewed demo.' }
    },
    'codex-context': {
      title: 'Intuition demo · explain the codebase, not just the code',
      reason: 'A mixed work session includes a product narrative and design-partner goal; implementation details are excluded.',
      excerpt: 'Demo founder: Show how Intuition turns a repository into a living course and updates explanations as code changes. The investor demo should follow a developer joining an unfamiliar codebase. Avoid inventing usage or revenue numbers; we need design-partner feedback first.',
      facts: { company: `${user.company}: ${user.pitch}.`, goals: 'Demo the unfamiliar-codebase onboarding journey and collect design-partner feedback. Usage and revenue are not established in this sample.' }
    },
    'granola-reflection': {
      title: 'Investor coffee · product understanding versus generic AI interest',
      excerpt: 'Demo founder: They were interested in AI but did not engage with the codebase-learning workflow. Next time, start with a repository walkthrough. Prioritize someone who can challenge the developer experience and introduce engineering teams, rather than another generic networking call.',
      facts: { preferences: 'Look for specific product feedback and relevant engineering introductions, rather than generic AI interest.' }
    }
  };
  const isIntuitionDemo = user.name === 'Kwok Zheng Feng' && user.company === 'Intuition';
  const profileSessions = isIntuitionDemo ? sessions.map(session => ({ ...session, ...intuitionSamples[session.id] })) : sessions;
  const adapt = (text: string) => isIntuitionDemo ? replace(text).replace(/open-source infrastructure/g, 'AI developer tools').replace(/open-source distribution/g, 'developer-led adoption').replace(/open source/g, 'developer-led adoption') : replace(text);
  return profileSessions.map(session => session.id === 'linkedin-profile' 
    ? { ...session, title: `${user.name} · profile`, excerpt: [user.headline, ...user.experience].join('. '), facts: { company: `${user.company}: ${user.pitch}.` } }
    : { ...session, title: adapt(session.title), excerpt: adapt(session.excerpt), facts: Object.fromEntries(Object.entries(session.facts).map(([key, value]) => [key, adapt(value)])) });
}
