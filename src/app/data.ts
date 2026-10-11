// Hardcoded demo data for the Signal app: one founder, one month of coffee chats, one agent run.

export type Kind = 'vc' | 'angel' | 'founder' | 'operator' | 'recruiter';
export type Verdict = 'meet' | 'skip';

export interface Person {
  name: string;
  role: string;
  org: string;
  kind: Kind;
}

export interface Check {
  label: string;
  pass: boolean;
}

export interface Notes {
  summary: string;
  after: string[];
  overlap: string[];
  worth: string[];
  next: string;
}

export interface TraceStep {
  t: string;
  step: string;
  detail: string;
}

export interface Meet {
  id: string;
  person: Person;
  week: number; // 0-3
  day: number; // 0-4, Mon-Fri
  start: number; // hour, e.g. 10.5
  minutes: number;
  verdict: Verdict;
  reason: string;
  checks: Check[];
  agentSeconds: number;
  transcript?: [speaker: 'you' | 'them', text: string][];
  notes?: Notes;
  shared?: string[];
  withheld?: string[];
  trace?: TraceStep[];
}

export interface User {
  name: string;
  headline: string;
  company: string;
  pitch: string;
  linkedin: string;
  location: string;
  experience: string[];
}

// Defaults are filled from the public LinkedIn profile; the person can edit every field in the app.
export const defaultUser: User = {
  name: 'Kwok Zheng Feng',
  headline: 'Founder @ Intuition · Stanford MS&E',
  company: 'Intuition',
  pitch: 'An IDE that turns your codebase into a living course that updates as you code',
  linkedin: 'linkedin.com/in/kwokzhengfeng',
  location: 'San Francisco Bay Area',
  experience: ['SWE and AI internships at TikTok and Ant Group', '3x founder, 1x exit', 'AI researcher (LLMs)', 'Stanford MS&E, NUS Overseas Colleges']
};

export const questionnaire = [
  {
    id: 'goal',
    question: 'What are you hoping to get out of meeting people this month?',
    options: ['Raise a round', 'Find design partners', 'Hire', 'Find a cofounder', 'Get advice', 'Meet people'],
    chosen: ['Raise a round', 'Find design partners']
  },
  {
    id: 'meet',
    question: 'Who would you love to meet?',
    options: ['Seed investors with a devtools thesis', 'Technical partners', 'Angels from infra companies', 'Teams running agents in production', 'Other devtool founders'],
    chosen: ['Seed investors with a devtools thesis', 'Technical partners', 'Angels from infra companies', 'Teams running agents in production']
  },
  {
    id: 'skip',
    question: 'Who is not a fit right now?',
    options: ['Consumer-only funds', 'Series B+ investors', 'Recruiters', 'People selling tools', 'Founders looking for a cofounder'],
    chosen: ['Consumer-only funds', 'Series B+ investors', 'Recruiters', 'People selling tools', 'Founders looking for a cofounder']
  },
  {
    id: 'context',
    question: 'Anything your agent should know?',
    options: [],
    chosen: [],
    text: 'Building Intuition while at Stanford. Prev TikTok and Ant Group, 3x founder with 1x exit. Happy to demo the product.'
  }
];

export const criteria = [
  'Invests at seed',
  'Devtools or infra thesis',
  'Technical background',
  'Runs agents in production',
  'Can help this quarter'
];

const featured: Meet[] = [
  {
    id: 'dana',
    person: { name: 'Dana Whitfield', role: 'Partner', org: 'Halyard Ventures', kind: 'vc' },
    week: 0, day: 0, start: 9, minutes: 60,
    verdict: 'skip',
    reason: 'Consumer and marketplaces fund. No devtools in the portfolio and no technical partner to champion it.',
    checks: [{ label: 'Invests at seed', pass: true }, { label: 'Devtools or infra thesis', pass: false }, { label: 'Technical background', pass: false }],
    agentSeconds: 41,
    transcript: [
      ['you', "{first}'s raising a $2.5M seed for {company}, open-source tracing for AI agents. Who does Halyard back at seed?"],
      ['them', 'Consumer and marketplaces mostly. Our last five were a resale app, two wellness brands, a rentals marketplace and a creator tool.'],
      ['you', 'Any infrastructure or developer tools in the portfolio, or a partner who covers them?'],
      ['them', "No. Dana's open to new categories, but would want a co-investor to lead the technical diligence."],
      ['you', "Understood. {first}'s looking for a lead who can go deep on the product. I'll pass for now and keep Halyard in mind for later rounds."],
      ['them', 'Fair. Happy to reconnect when there is consumer-facing usage.']
    ],
    notes: {
      summary: 'Seed fund focused on consumer and marketplaces. Friendly, but not equipped to lead a devtools round.',
      after: ['Consumer brands with strong retention', 'Marketplaces at seed'],
      overlap: ['Invests at your stage'],
      worth: ['Would need another fund to lead technical diligence', 'No devtools portfolio companies to reference'],
      next: 'Skip for now. Revisit if {company} ever ships a consumer-facing product.'
    },
    shared: ['Round size and stage', 'What {company} does', 'Open-source adoption'],
    withheld: ['Revenue figures', 'Pilot customer names'],
    trace: [
      { t: '00:00', step: 'Handshake', detail: 'Exchanged public profiles and intents' },
      { t: '00:06', step: 'Asked', detail: 'Seed portfolio and thesis' },
      { t: '00:17', step: 'Asked', detail: 'Technical partner coverage' },
      { t: '00:29', step: 'Evaluated', detail: '1 of 3 checks passed' },
      { t: '00:41', step: 'Verdict', detail: 'Skip, 94% confidence' }
    ]
  },
  {
    id: 'marcus',
    person: { name: 'Marcus Oyelaran', role: 'General Partner', org: 'Lattice Capital', kind: 'vc' },
    week: 0, day: 1, start: 10.5, minutes: 60,
    verdict: 'meet',
    reason: 'Former staff engineer who has led four devtools seeds. Writes $1–2M checks and is actively looking at agent infrastructure.',
    checks: [{ label: 'Invests at seed', pass: true }, { label: 'Devtools or infra thesis', pass: true }, { label: 'Technical background', pass: true }],
    agentSeconds: 58,
    transcript: [
      ['you', "{first}'s raising a $2.5M seed for {company}, open-source tracing for AI agents. What is Lattice looking at right now?"],
      ['them', "Agent infrastructure is our top theme this year. Marcus led seeds in two observability companies and wrote code for a decade before investing."],
      ['you', '40 teams run the open-source version, 6 are paying pilots. Most found it on their own. Does that profile fit how Lattice leads?'],
      ['them', 'Very much. Marcus leads at $1–2M and likes bottoms-up adoption. He would want to see the trace viewer and talk to two pilot users.'],
      ['you', '{first} can demo live and line up two pilot calls. How fast does Lattice usually move?'],
      ['them', 'Partner meeting within two weeks of a first call if it clicks.'],
      ['you', 'Great. Proposing 30 minutes Thursday at 2pm, demo first.'],
      ['them', 'Confirmed on our side.']
    ],
    notes: {
      summary: 'Technical GP leading seeds in agent infrastructure. Strongest lead candidate this month.',
      after: ['Bottoms-up devtools with open-source traction', 'Founders who can demo, not just pitch'],
      overlap: ['Led two observability seeds', 'Check size fits a lead in your round', 'Agent infrastructure is a stated theme'],
      worth: ['Will ask for two pilot customer calls', 'Moves to partner meeting within two weeks'],
      next: 'Meet Thursday 2:00pm, 30 min. Open with the live trace viewer.'
    },
    shared: ['Round size and stage', 'Open-source adoption', 'Number of paying pilots'],
    withheld: ['Revenue figures', 'Pilot customer names'],
    trace: [
      { t: '00:00', step: 'Handshake', detail: 'Exchanged public profiles and intents' },
      { t: '00:05', step: 'Asked', detail: 'Current themes and check size' },
      { t: '00:18', step: 'Shared', detail: 'Adoption and pilot count' },
      { t: '00:31', step: 'Asked', detail: 'Process and timeline' },
      { t: '00:44', step: 'Evaluated', detail: '3 of 3 checks passed' },
      { t: '00:52', step: 'Scheduled', detail: 'Proposed Thu 2:00pm, accepted' },
      { t: '00:58', step: 'Verdict', detail: 'Meet, 96% confidence' }
    ]
  },
  {
    id: 'sofia',
    person: { name: 'Sofia Brandt', role: 'Founder', org: 'Bloomly', kind: 'founder' },
    week: 0, day: 2, start: 12, minutes: 45,
    verdict: 'skip',
    reason: 'Building a consumer wellness app and looking for a technical cofounder. Kind fit for each other later, not for what {first} needs now.',
    checks: [{ label: 'Can help this quarter', pass: false }, { label: 'Technical background', pass: false }, { label: 'Devtools or infra thesis', pass: false }],
    agentSeconds: 34,
    transcript: [
      ['you', "{first}'s building {company} and is focused on raising and finding design partners. What's Sofia hoping to get from the chat?"],
      ['them', "Sofia's looking for a technical cofounder for Bloomly, a wellness app, and wanted {first}'s take on hiring engineers."],
      ['you', "{first} isn't looking to join or advise a new company this quarter. Could a referral help instead?"],
      ['them', 'A referral would be great, actually.'],
      ['you', "I'll pass along two engineers from {first}'s network who are exploring founding roles. Skipping the meeting so neither of you loses an hour."]
    ],
    notes: {
      summary: 'Early consumer founder searching for a technical cofounder.',
      after: ['A technical cofounder', 'Advice on hiring engineers'],
      overlap: ['None with your goals this month'],
      worth: ['Agent offered two referrals instead of a meeting'],
      next: 'Skip. Intro email with two referrals sent on your behalf.'
    },
    shared: ['What {company} does'],
    withheld: ['Round details', 'Traction'],
    trace: [
      { t: '00:00', step: 'Handshake', detail: 'Exchanged public profiles and intents' },
      { t: '00:07', step: 'Asked', detail: 'What they hope to get from the chat' },
      { t: '00:19', step: 'Offered', detail: 'Referrals instead of a meeting' },
      { t: '00:28', step: 'Evaluated', detail: '0 of 3 checks passed' },
      { t: '00:34', step: 'Verdict', detail: 'Skip, 98% confidence' }
    ]
  },
  {
    id: 'kenji',
    person: { name: 'Kenji Morales', role: 'Staff Engineer', org: 'Rampart', kind: 'operator' },
    week: 0, day: 3, start: 14, minutes: 45,
    verdict: 'meet',
    reason: 'Runs 30+ agents in production and is losing days debugging them. Ideal design partner, and could become a paying pilot.',
    checks: [{ label: 'Runs agents in production', pass: true }, { label: 'Technical background', pass: true }, { label: 'Can help this quarter', pass: true }],
    agentSeconds: 52,
    transcript: [
      ['you', '{company} traces AI agents step by step in production. Does Rampart run agents today?'],
      ['them', "Over 30 in production, handling disputes and KYC. Kenji's team spends a couple of days a week chasing failures."],
      ['you', "That's exactly the problem {first} built {company} for. What do you use today?"],
      ['them', "Logs and a homegrown dashboard. Nobody trusts it. Kenji's been looking for something open source they can self-host."],
      ['you', 'Self-hosting is supported. Would Kenji try a two-week pilot with one agent?'],
      ['them', 'Yes, if security signs off. He would want to see the data model first.'],
      ['you', '{first} will bring the schema. 45 minutes next Tuesday, 11am?'],
      ['them', 'Booked.']
    ],
    notes: {
      summary: 'Engineer running a large agent fleet in fintech with real, painful debugging needs.',
      after: ['Self-hostable, open-source tracing', 'Fewer days lost to agent failures'],
      overlap: ['Exactly your core use case', 'Willing to pilot this quarter'],
      worth: ['Security review needed before a pilot', 'Wants the data model up front'],
      next: 'Meet Tuesday 11:00am, 45 min. Bring the schema and the self-hosting guide.'
    },
    shared: ['What {company} does', 'Self-hosting support'],
    withheld: ['Round details', 'Other pilot customers'],
    trace: [
      { t: '00:00', step: 'Handshake', detail: 'Exchanged public profiles and intents' },
      { t: '00:06', step: 'Asked', detail: 'Agents in production and current tooling' },
      { t: '00:22', step: 'Proposed', detail: 'Two-week pilot with one agent' },
      { t: '00:38', step: 'Evaluated', detail: '3 of 3 checks passed' },
      { t: '00:46', step: 'Scheduled', detail: 'Proposed Tue 11:00am, accepted' },
      { t: '00:52', step: 'Verdict', detail: 'Meet, 93% confidence' }
    ]
  },
  {
    id: 'lena',
    person: { name: 'Lena Okafor', role: 'Angel investor', org: 'ex-VP Engineering, Datadog', kind: 'angel' },
    week: 0, day: 4, start: 10.5, minutes: 45,
    verdict: 'meet',
    reason: 'Former VP Engineering at Datadog. Writes $50–100K angel checks and offers intros to observability buyers.',
    checks: [{ label: 'Invests at seed', pass: true }, { label: 'Devtools or infra thesis', pass: true }, { label: 'Technical background', pass: true }],
    agentSeconds: 47,
    transcript: [
      ['you', "{first}'s raising a seed for {company}, tracing for AI agents. Is Lena writing checks right now?"],
      ['them', 'Selectively, $50–100K, only in observability and developer infrastructure.'],
      ['you', 'Beyond the check, {first} wants advice on selling to platform teams. Is that something Lena helps with?'],
      ['them', 'Constantly. She ran the team that sold Datadog into platform orgs and still makes intros.'],
      ['you', "Then a meeting is worth it. 30 minutes, coffee near Lena's office?"],
      ['them', 'Friday 9am at Sightglass works.']
    ],
    notes: {
      summary: 'Operator-turned-angel with deep observability experience and a strong buyer network.',
      after: ['Observability and infrastructure deals', 'Founders she can help sell'],
      overlap: ['Angel check alongside a lead', 'Intros to platform teams'],
      worth: ['Only invests in her domain, which is yours'],
      next: 'Meet Friday 9:00am at Sightglass, 30 min.'
    },
    shared: ['Round size and stage', 'What {company} does'],
    withheld: ['Revenue figures'],
    trace: [
      { t: '00:00', step: 'Handshake', detail: 'Exchanged public profiles and intents' },
      { t: '00:08', step: 'Asked', detail: 'Check size and focus' },
      { t: '00:21', step: 'Asked', detail: 'Help beyond capital' },
      { t: '00:36', step: 'Evaluated', detail: '3 of 3 checks passed' },
      { t: '00:47', step: 'Verdict', detail: 'Meet, 91% confidence' }
    ]
  },
  {
    id: 'tom',
    person: { name: 'Tom Reyes', role: 'Technical recruiter', org: 'Northstar Talent', kind: 'recruiter' },
    week: 1, day: 0, start: 15.5, minutes: 30,
    verdict: 'skip',
    reason: 'Recruiting pitch. {first} is not hiring until after the round closes.',
    checks: [{ label: 'Can help this quarter', pass: false }, { label: 'Invests at seed', pass: false }, { label: 'Runs agents in production', pass: false }],
    agentSeconds: 22,
    transcript: [
      ['them', 'Tom places senior engineers at seed-stage startups and would love to help {company} grow the team.'],
      ['you', "Thanks. {first} isn't hiring until after the round. I'll keep Northstar's details for then."],
      ['them', 'Understood, thanks for the quick answer.']
    ],
    notes: {
      summary: 'Agency recruiter offering engineering placements.',
      after: ['New hiring clients'],
      overlap: ['None this quarter'],
      worth: ['Saved for after the round closes'],
      next: 'Skip. Contact saved to your post-raise list.'
    },
    shared: ['Hiring status'],
    withheld: ['Round details', 'Traction'],
    trace: [
      { t: '00:00', step: 'Handshake', detail: 'Exchanged public profiles and intents' },
      { t: '00:09', step: 'Matched', detail: 'Intent: recruiting, on your skip list' },
      { t: '00:22', step: 'Verdict', detail: 'Skip, 99% confidence' }
    ]
  },
  {
    id: 'priya',
    person: { name: 'Priya Shah', role: 'Principal', org: 'Northbeam Growth', kind: 'vc' },
    week: 1, day: 1, start: 12, minutes: 60,
    verdict: 'skip',
    reason: 'Strong devtools thesis, but only invests Series B and later. Worth reconnecting in two years.',
    checks: [{ label: 'Invests at seed', pass: false }, { label: 'Devtools or infra thesis', pass: true }, { label: 'Technical background', pass: true }],
    agentSeconds: 39,
    transcript: [
      ['you', "{first}'s raising a $2.5M seed for {company}. Does Northbeam invest at seed?"],
      ['them', 'No, Series B onward. But Priya tracks devtools early and keeps relationships with seed founders.'],
      ['you', "Then it's a relationship to keep warm, not a meeting this month. Can I add Priya to {first}'s quarterly update?"],
      ['them', 'Please do.']
    ],
    notes: {
      summary: 'Growth-stage investor who follows devtools early.',
      after: ['Devtools companies with $10M+ ARR'],
      overlap: ['Your category, a later stage'],
      worth: ['Good future relationship. Added to your investor update list.'],
      next: 'Skip for now. Added to quarterly updates.'
    },
    shared: ['Round size and stage', 'What {company} does'],
    withheld: ['Revenue figures', 'Pilot customer names'],
    trace: [
      { t: '00:00', step: 'Handshake', detail: 'Exchanged public profiles and intents' },
      { t: '00:07', step: 'Asked', detail: 'Stage focus' },
      { t: '00:24', step: 'Evaluated', detail: 'Stage mismatch on a must-have' },
      { t: '00:39', step: 'Verdict', detail: 'Skip, 90% confidence' }
    ]
  },
  {
    id: 'ines',
    person: { name: 'Ines Duarte', role: 'Head of Platform', org: 'Calder AI', kind: 'operator' },
    week: 1, day: 2, start: 14, minutes: 45,
    verdict: 'meet',
    reason: 'Platform team of 12 shipping agents to enterprise customers. Has budget for tracing this quarter.',
    checks: [{ label: 'Runs agents in production', pass: true }, { label: 'Technical background', pass: true }, { label: 'Can help this quarter', pass: true }],
    agentSeconds: 49,
    transcript: [
      ['you', '{company} traces AI agents in production. How does Calder debug agents today?'],
      ['them', "Painfully. Ines's team supports enterprise customers who ask why an agent did something, and they can't always answer."],
      ['you', 'Step-level traces with inputs and tool calls are exactly what {company} shows. Is there budget for this?'],
      ['them', 'There is a line item for observability this quarter. Ines would want an evaluation plan.'],
      ['you', '{first} will bring one. 45 minutes on Wednesday the 19th?'],
      ['them', 'Works.']
    ],
    notes: {
      summary: 'Enterprise-facing AI company that needs to explain agent behaviour to customers.',
      after: ['Answers for customers asking why an agent acted', 'An evaluation plan'],
      overlap: ['Budget this quarter', 'Strong pilot candidate'],
      worth: ['Enterprise security review likely'],
      next: 'Meet Wednesday 19th, 45 min. Bring an evaluation plan.'
    },
    shared: ['What {company} does', 'Pilot terms'],
    withheld: ['Round details'],
    trace: [
      { t: '00:00', step: 'Handshake', detail: 'Exchanged public profiles and intents' },
      { t: '00:08', step: 'Asked', detail: 'Current debugging workflow' },
      { t: '00:23', step: 'Asked', detail: 'Budget and timing' },
      { t: '00:40', step: 'Evaluated', detail: '3 of 3 checks passed' },
      { t: '00:49', step: 'Verdict', detail: 'Meet, 89% confidence' }
    ]
  },
  {
    id: 'will',
    person: { name: 'Will Hart', role: 'Associate', org: 'Basin VC', kind: 'vc' },
    week: 1, day: 3, start: 9, minutes: 30,
    verdict: 'skip',
    reason: 'Generalist associate gathering decks. No devtools focus, and partners decide without meeting founders first.',
    checks: [{ label: 'Invests at seed', pass: true }, { label: 'Devtools or infra thesis', pass: false }, { label: 'Technical background', pass: false }],
    agentSeconds: 31
  },
  {
    id: 'ruth',
    person: { name: 'Ruth Adeyemi', role: 'Partner', org: 'Foundry Point', kind: 'vc' },
    week: 2, day: 1, start: 10.5, minutes: 60,
    verdict: 'meet',
    reason: 'AI infrastructure partner and former ML engineer. Leads seeds and asked specifically about agent observability.',
    checks: [{ label: 'Invests at seed', pass: true }, { label: 'Devtools or infra thesis', pass: true }, { label: 'Technical background', pass: true }],
    agentSeconds: 55
  },
  {
    id: 'jonah',
    person: { name: 'Jonah Feld', role: 'Founder', org: 'Spanline', kind: 'founder' },
    week: 2, day: 3, start: 15.5, minutes: 45,
    verdict: 'skip',
    reason: 'Building a competing tracing product. Friendly, but the overlap makes an open conversation hard right now.',
    checks: [{ label: 'Can help this quarter', pass: false }, { label: 'Technical background', pass: true }, { label: 'Devtools or infra thesis', pass: true }],
    agentSeconds: 36
  },
  {
    id: 'hana',
    person: { name: 'Hana Sato', role: 'Head of DevRel', org: 'Skyport', kind: 'operator' },
    week: 3, day: 2, start: 12, minutes: 45,
    verdict: 'meet',
    reason: "Runs Skyport's developer community of 200K and is looking for open-source tools to feature. Real distribution.",
    checks: [{ label: 'Can help this quarter', pass: true }, { label: 'Technical background', pass: true }, { label: 'Runs agents in production', pass: false }],
    agentSeconds: 44
  }
];

// The rest of the month: short chats the agent filters quickly.
const others: [Person, string, Check[]][] = [
  [{ name: 'Ben Aldridge', role: 'Partner', org: 'Cove Ventures', kind: 'vc' }, 'Consumer-only fund.', [{ label: 'Devtools or infra thesis', pass: false }]],
  [{ name: 'Maya Lin', role: 'Founder', org: 'Petal', kind: 'founder' }, 'Looking for a technical cofounder.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Raj Patel', role: 'AE', org: 'Outreachly', kind: 'operator' }, 'Selling an outbound sales tool.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Elena Voss', role: 'Principal', org: 'Meridian Growth', kind: 'vc' }, 'Invests Series B and later.', [{ label: 'Invests at seed', pass: false }]],
  [{ name: 'Sam Okoro', role: 'Recruiter', org: 'Talentbridge', kind: 'recruiter' }, 'Recruiting pitch.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Grace Kim', role: 'Associate', org: 'Harbor Fund', kind: 'vc' }, 'Generalist associate collecting decks.', [{ label: 'Devtools or infra thesis', pass: false }]],
  [{ name: 'Leo Martins', role: 'Founder', org: 'Tidepool', kind: 'founder' }, 'Fintech founder looking for intros.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Nora Quinn', role: 'Partner', org: 'Sunfield', kind: 'vc' }, 'Climate-only fund.', [{ label: 'Devtools or infra thesis', pass: false }]],
  [{ name: 'Omar Haddad', role: 'Founder', org: 'Loopkit', kind: 'founder' }, 'Consumer social app, wants feedback.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Iris Chen', role: 'Scout', org: 'Atlas Ventures', kind: 'vc' }, 'Scout without check-writing authority.', [{ label: 'Invests at seed', pass: false }]],
  [{ name: 'Felix Brand', role: 'Consultant', org: 'Brand & Co', kind: 'operator' }, 'Selling GTM consulting.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Zoe Park', role: 'Founder', org: 'Quilt', kind: 'founder' }, 'Marketplace founder, general networking.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Andre Silva', role: 'Partner', org: 'Redline Capital', kind: 'vc' }, 'Leads Series A and later only.', [{ label: 'Invests at seed', pass: false }]],
  [{ name: 'Kate Moss', role: 'Recruiter', org: 'Hirewise', kind: 'recruiter' }, 'Recruiting pitch.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Yusuf Ali', role: 'Founder', org: 'Gleam', kind: 'founder' }, 'Beauty brand founder, wants intros.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Clara Diaz', role: 'Partner', org: 'Wildflower', kind: 'vc' }, 'Consumer-only fund.', [{ label: 'Devtools or infra thesis', pass: false }]],
  [{ name: 'Dev Mehta', role: 'PM', org: 'Brightline', kind: 'operator' }, 'Career chat, no overlap with your goals.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Lucy Grant', role: 'Associate', org: 'Pine Street', kind: 'vc' }, 'Generalist, wants the deck first.', [{ label: 'Devtools or infra thesis', pass: false }]],
  [{ name: 'Marco Bell', role: 'Founder', org: 'Fable', kind: 'founder' }, 'Looking for a technical cofounder.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Tara Singh', role: 'Partner', org: 'Oakline', kind: 'vc' }, 'Healthcare-only fund.', [{ label: 'Devtools or infra thesis', pass: false }]],
  [{ name: 'Hugo Laurent', role: 'Sales', org: 'Pipewise', kind: 'operator' }, 'Selling a CRM.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Amy Zhou', role: 'Founder', org: 'Nest', kind: 'founder' }, 'Proptech founder, general networking.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Victor Ng', role: 'Principal', org: 'Summit Growth', kind: 'vc' }, 'Invests Series C and later.', [{ label: 'Invests at seed', pass: false }]],
  [{ name: 'Rosa Ortiz', role: 'Recruiter', org: 'Peak Search', kind: 'recruiter' }, 'Recruiting pitch.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Ethan Cole', role: 'Founder', org: 'Drift Labs', kind: 'founder' }, 'Gaming founder, wants advice on raising.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Mia Novak', role: 'Partner', org: 'Lumen Fund', kind: 'vc' }, 'Consumer-only fund.', [{ label: 'Devtools or infra thesis', pass: false }]],
  [{ name: 'Jack Rowe', role: 'Agency', org: 'Rowe Media', kind: 'operator' }, 'Selling content marketing.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Sara Haas', role: 'Founder', org: 'Mosaic Pay', kind: 'founder' }, 'Payments founder looking for intros.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Paul Wren', role: 'Associate', org: 'Fieldstone', kind: 'vc' }, 'Generalist associate collecting decks.', [{ label: 'Devtools or infra thesis', pass: false }]],
  [{ name: 'Nina Roy', role: 'Founder', org: 'Kindred', kind: 'founder' }, 'Looking for a technical cofounder.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Owen Price', role: 'Partner', org: 'Granite Peak', kind: 'vc' }, 'Leads Series B and later.', [{ label: 'Invests at seed', pass: false }]],
  [{ name: 'Lily Hart', role: 'Recruiter', org: 'Crewline', kind: 'recruiter' }, 'Recruiting pitch.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Adam Fox', role: 'Founder', org: 'Parcel', kind: 'founder' }, 'Logistics founder, general networking.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Joy Bello', role: 'Partner', org: 'Riverbend', kind: 'vc' }, 'Consumer-only fund.', [{ label: 'Devtools or infra thesis', pass: false }]],
  [{ name: 'Max Weber', role: 'BDR', org: 'Leadflow', kind: 'operator' }, 'Selling lead generation.', [{ label: 'Can help this quarter', pass: false }]],
  [{ name: 'Eva Lund', role: 'Founder', org: 'Sprout', kind: 'founder' }, 'Edtech founder, wants feedback on a deck.', [{ label: 'Can help this quarter', pass: false }]]
];

const SLOTS = [9, 10.5, 12, 14, 15.5, 17];
const PER_DAY = [3, 2, 3, 2, 2]; // Mon-Fri, 12 a week, 48 a month
const DURATIONS = [30, 45, 60, 45];

function buildMonth(): Meet[] {
  const taken = new Set(featured.map(m => `${m.week}-${m.day}-${m.start}`));
  const perDay = new Map<string, number>();
  for (const m of featured) perDay.set(`${m.week}-${m.day}`, (perDay.get(`${m.week}-${m.day}`) ?? 0) + 1);

  const filler: Meet[] = [];
  let i = 0;
  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 5; day++) {
      let count = perDay.get(`${week}-${day}`) ?? 0;
      for (let s = 0; s < SLOTS.length && count < PER_DAY[day]; s++) {
        const start = SLOTS[(s + week + day) % SLOTS.length];
        if (taken.has(`${week}-${day}-${start}`) || i >= others.length) continue;
        const [person, reason, checks] = others[i];
        filler.push({
          id: `m${i}`,
          person, week, day, start,
          minutes: DURATIONS[i % DURATIONS.length],
          verdict: 'skip',
          reason,
          checks,
          agentSeconds: 14 + ((i * 7) % 16)
        });
        taken.add(`${week}-${day}-${start}`);
        count++;
        i++;
      }
    }
  }
  return [...featured, ...filler].sort((a, b) => a.week - b.week || a.day - b.day || a.start - b.start);
}

export const meets = buildMonth();

export const totals = (() => {
  const minutes = meets.reduce((sum, m) => sum + m.minutes, 0);
  const agentSeconds = meets.reduce((sum, m) => sum + m.agentSeconds, 0);
  const keep = meets.filter(m => m.verdict === 'meet');
  return {
    count: meets.length,
    hours: Math.round(minutes / 60),
    agentMinutes: Math.round(agentSeconds / 60),
    keep: keep.length,
    keepHours: Math.round(keep.reduce((s, m) => s + m.minutes, 0) / 60),
    savedHours: Math.round((minutes - keep.reduce((s, m) => s + m.minutes, 0)) / 60)
  };
})();

export const kindLabel: Record<Kind, string> = {
  vc: 'Investor',
  angel: 'Angel',
  founder: 'Founder',
  operator: 'Operator',
  recruiter: 'Recruiter'
};

export const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export function formatTime(h: number) {
  const hour = Math.floor(h);
  const min = h % 1 ? '30' : '00';
  const suffix = hour >= 12 ? 'pm' : 'am';
  return `${hour > 12 ? hour - 12 : hour}:${min}${suffix}`;
}

export function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2);
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'You';
}

// Swap the {first} and {company} placeholders in the demo month for the current profile.
export function personalise(list: Meet[], user: User): Meet[] {
  const vars = { first: firstName(user.name), company: user.company.trim() || 'your company' };
  const fill = (v: unknown): unknown => {
    if (typeof v === 'string') return v.replace(/\{(first|company)\}/g, (_, k: keyof typeof vars) => vars[k]);
    if (Array.isArray(v)) return v.map(fill);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]));
    return v;
  };
  return fill(list) as Meet[];
}
