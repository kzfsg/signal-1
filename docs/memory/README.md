# Signal: personal context, connectors, and evolving memory

Working research and proposed design, 2026-10-11. The onboarding simulation below is implemented; the connector architecture remains a proposal. No background collector or external connection has been installed.

## Onboarding simulation

The integrated route on top of main (`e150182`) is:

`login → linkedin → questions → sources → sessions → memory → calendar → compress → live → results`

The original LinkedIn profile editor and four-question screen are preserved. The older personal-agent picker on LinkedIn has been removed; connections are configured through the Personal context connector catalog. Questions now continues to Personal context; the memory stage saves and hands off to the original Google Calendar screen. Direct `#/app/sources` access remains available. Main’s Dial/Keewano integrations are retained without changes.

1. Browse 25 sources across personal assistants, work agents, email/calendar, documents/notes, meetings/messaging, and professional profiles. Search or filter by Connected. Click an app or its Connect button to see its setup method, instructions and official documentation. The final dialog action simulates connection and persists across reloads. Connected opens details with a Disconnect action. No account authorization or history access occurs.
2. Select a 7-, 30-, or 90-day window and import matching fixture items. A three-column progress screen runs selected source streams concurrently, with independent timings and per-source progress. Each card expands to show queued conversations, excerpts, classifications and specific investment findings. Expanded cards reserve two fixed-height finding slots from the start. Once extracted, the finding replaces the preview excerpt; the full excerpt stays in the history dialog. The overflow fade and View full history button appear only for sources with more than two items. View full history opens a scrollable dialog containing the selected source’s complete sample list and untruncated available excerpts. Final classification badges read Investment signal, Unrelated, or Needs review. New text never expands the card. It distinguishes confirmed signals, uncertain context and unrelated items, then offers Review extracted context. Skip animation completes the same walkthrough immediately; Back to sources cancels it.
3. Review relevance labels, explanations, and excerpts. Relevant items start selected; unrelated and uncertain ones start excluded. Users can override inclusion.
4. Create and edit the company, funding, goals, preferences, and private-information fields. Each generated field links to its supporting sample excerpts. Hypothetical and unrelated examples produce no confirmed facts even if included.
5. Save and continue to the existing calendar demo. A link there returns to the memory review. A profile-only path skips sample extraction while keeping connected sources and seeding the brief with confirmed company, goals and fit preferences. A company description is required to continue.

Drafts persist in browser local storage under `signal.memory-onboarding.v1`. Recreating memory replaces edited fields with the newly selected sample evidence. There is no actual file upload, OAuth, session monitoring, model extraction, or post-meeting update. Main’s subsequent agent conversations and recommendations remain scripted (with its existing profile personalization) and do not consume this additional memory yet. The sponsor integrations from main remain unchanged.

Connector rows and setup dialogs use locally bundled product logos from `src/assets/sources/`. Exact download URLs are recorded in `src/assets/sources/sources.json`: Claude, Muse, LinkedIn, Google, and Granola assets come from their official sites; ChatGPT, Codex, Slack, and Outlook marks come from the ASVG logo catalog, and Notion comes from Simple Icons. Additional agent marks come from Hermes, Pi, OpenCode, OpenClaw, and Manus’s official sites; Gemini, Perplexity, Microsoft Copilot, Telegram, WhatsApp, and Discord come from ASVG, and Messages from Wikimedia Commons. The white LinkedIn mark is presented on LinkedIn blue. `files.png` is Microsoft’s Fluent Emoji open-folder icon, with its MIT license retained in `fluentui-emoji-LICENSE.txt`. Muse (Meta) uses the Muse product mark from Meta’s connector platform, not a generic Meta wordmark. Brand images identify sources only; integrations remain simulated.

| File | Responsibility |
| --- | --- |
| `src/app/SourcePicker.tsx` | Searchable settings catalog, category filters, source status, and setup dialog |
| `src/app/connectorSetup.ts` | Provider-specific setup methods, commands, limitations and official documentation links |
| `src/app/ContextImport.tsx` | Concurrent source cards with expandable conversation streams, timed classification and extraction |
| `src/app/MemoryOnboarding.tsx` | Three-step source, session, and memory review UI |
| `src/app/memoryData.ts` | Typed source catalog, sample sessions, deterministic extraction, draft validation |
| `src/app/memory.css` | Responsive onboarding styles using the existing design tokens |
| `src/app/App.tsx` | Preserved profile/questionnaire routes, inserted Personal context stage and calendar connection reuse |
| `src/app/profile.tsx` | Existing shared editable identity, goals, exclusions, notes and selected personal agent, read by memory onboarding |

Run with `npm ci` and `npm run dev`; validate compilation with `npm run build`. Browser checks should cover source removal, date filtering, inclusion overrides, empty/manual entry, editing and reload persistence, evidence visibility, and the calendar handoff.

Verified on 2026-10-11: production build passed (Vite reports a bundle-size warning); eight data checks passed for empty/excluded/hypothetical input, deduplication, invalid stored data, and fixture IDs. Desktop and 390px browser checks passed for source removal, date filtering, default exclusions, inclusion overrides, manual entry, edited-memory reload, and calendar handoff. No browser console errors were reported.

Signal should learn what makes a meeting worthwhile for a particular person, company, fund, and moment. Memory should retain the reasons behind preferences and the evidence that could change a recommendation.

The connector design follows the browse/select/setup pattern described in [OpenAI’s apps guide](https://academy.openai.com/en/public/clubs/work-users-ynjqu/resources/connectors), with Signal-specific categories. Desktop and mobile checks also covered all 25 logo loads, search and empty results, category filters, connect/disconnect and reload persistence, Escape dismissal, and Calendar’s uncertain sample remaining excluded.

## Potential founder and investor workflows

These are plausible workflows to validate through interviews and examples of actual work. Published vendor workflows demonstrate possible uses, not their prevalence across founders or VCs.

| Founder activity | Example assistant request | Potential memory |
| --- | --- | --- |
| Plan a raise | Who should we raise from given our current position? | Current goals, constraints, timing, uncertainties |
| Research investors | Find partners who understand open-source infrastructure. | Candidate investors and desired expertise; research is not endorsement |
| Compare investors | Would domain expertise outweigh a larger check? | Conditional trade-offs |
| Prepare outreach | Mention adoption, but leave out revenue. | Positioning and explicit disclosure restrictions |
| Prepare meetings | What should I ask about board involvement? | Concerns and unanswered questions |
| Reflect on meetings | They were helpful but pushed us away from open source. | Relationship-specific experience and possible preference |
| Choose follow-ups | Keep them warm; don't prioritize another call this month. | Relationship status and timing |

| Investor activity | Example assistant request | Potential memory |
| --- | --- | --- |
| Explore a thesis | Which infrastructure problems are becoming urgent? | Emerging interests, distinct from approved fund mandate |
| Source startups | Find teams solving this problem. | Current sourcing priorities |
| Screen a company | Compare this deck with our criteria. | Fit hypotheses and missing evidence |
| Research founders | What shows that the team understands the buyer? | Evidence the partner values |
| Prepare diligence | What would need to be true for this to work? | Questions blocking conviction |
| Discuss internally | I like the team; can our fund meet their terms? | Personal interest versus institutional constraints |
| Pass or proceed | Revisit after two deployments. | Conditional interest and re-engagement trigger |

Corrections, comparisons, decisions, and post-meeting reflections may reveal more than initial research prompts. One declined meeting does not establish a permanent preference. Interview participants about their last real decision and the assistant interactions around it.

## Source roles and connector options

| Source | Useful context | Initial connection proposal | Continuous updates |
| --- | --- | --- | --- |
| Codex local sessions | Selected conversations, decisions, corrections | Opt-in local companion; investigate supported app-server reads first | Poll changed accessible threads; use supported events only where their scope is verified |
| Claude Code | Local conversation context | Opt-in local companion and documented lifecycle hooks | Enqueue processing after completed work; read transcript incrementally |
| ChatGPT | Selected chats, project context, user-reviewed brief | User-supplied conversation export or explicit submission to a Signal tool | Tool submissions when invoked; no universal account-wide history feed verified |
| Claude web/Desktop | Selected chats and existing memory | User-provided chat export or memory export; explicit Signal tool submission where supported | No universal account-wide conversation webhook verified |
| Muse | Ongoing goals and editable personal memories | User-reviewed brief or selected memory files supplied by the user | External synchronization API remains unverified; assume Meta Muse here |
| LinkedIn | Professional background and public statements | User-supplied profile content initially; investigate approved access separately | Explicit refresh; not a source of private intent |
| Meeting notes, email, CRM | Outcomes, objections, commitments, relationship status | Later, scoped authorized connectors or selected uploads | Provider-specific polling/webhooks after verification |

### Two connector directions

1. **Signal reads an authorized source.** A local companion or provider adapter retrieves selected history and changed records. This supports backfill and automatic capture within the granted scope.
2. **An assistant sends context to Signal.** A proposed Signal MCP tool accepts a contextual observation, evidence references, and scope. The assistant could also retrieve the user's current Signal brief. This supports intentional handoffs, but invocation is not guaranteed.

An MCP server exposes tools/resources to a client; installing it does not automatically expose that client's entire history, native memories, or other sessions to Signal. Model API access also must not be treated as access to a consumer account's chat history. Authentication, available data, and event coverage are separate questions.

### Verified foundations and limits

- Codex documents `thread/list` and `thread/read`; `thread/read` with `includeTurns` reads stored turns without resuming execution. Confirm installed-version behavior, pagination, storage visibility, and cross-client event coverage before implementation. Do not resume a thread merely to collect its history. [Codex app-server](https://learn.chatgpt.com/docs/app-server)
- Earlier in this workspace session, a prior conversation was successfully located in local Codex storage and exported into `docs/conversations/`. This is evidence for a local import on this machine, not a stable public storage contract. Its working directory was the home directory despite being about Signal: directory-based classification alone would have missed it.
- Claude Code documents hooks and transcript paths. Hooks can enqueue work without blocking the user's interaction; hook names and payloads must be checked against the installed version. Claude Code and Claude web/Desktop require separate adapters. [Claude Code hooks](https://code.claude.com/docs/en/hooks)
- Claude documents user exports of chat history and memory. [Chat export](https://support.claude.com/en/articles/9450526-export-your-claude-data), [memory transfer](https://support.claude.com/en/articles/12123587-import-and-export-your-memory-from-claude)
- ChatGPT project context is useful inside ChatGPT; that does not establish external access to all project conversations. [Projects](https://learn.chatgpt.com/docs/projects)
- Muse describes persistent context and user-editable memory files; this does not establish an external subscription interface. [Muse design](https://introducing.muse.ai/)
- MCP tools receive explicit structured arguments from their client. [MCP server concepts](https://developers.openai.com/plugins/concepts/mcp-server)

## Recommended update lifecycle

Use a bounded historical backfill, incremental updates after completed turns, and a daily reconciliation job. Proposed timing such as a 30–60 second debounce is a design choice, not a provider capability or latency guarantee.

```text
User selects sources, projects, date range, and processing permissions
  -> Backfill accessible, selected history once
  -> Normalize messages with source IDs, roles, times, and revisions
  -> Classify relevant spans and identify their subjects
  -> Extract evidence-backed candidate observations
  -> Compare with relevant existing memories
  -> Add / reinforce / supersede / contest / expire
  -> Refresh the current brief and affected recommendations

New completed turn or changed source
  -> Same pipeline, processing only the change and necessary context

Daily reconciliation
  -> Catch missed changes, retry failures, check freshness and conflicts
```

### 1. Connection scope and history

The user chooses which sources Signal may inspect, whether historical backfill is enabled, and which date range/projects are included. Private personal context and shared company context are separate scopes. A founder's private reflection is not automatically shared with cofounders; a partner's opinion is not automatically fund policy.

A local companion is needed for automatic access to local session files; a normal hosted frontend cannot silently monitor them. Prefer supported read interfaces. Treat direct JSONL parsing as a version-sensitive fallback. If classification runs locally, irrelevant content can remain local. If a hosted model performs classification, that content has already left the device and the permission description must say so.

Do not assume all history is accessible. Display coverage, last sync, disconnected sources, and backfill progress. Exclude internal reasoning, credentials, and irrelevant tool output; retain relevant user-visible messages and explicitly selected research evidence.

### 2. Classification throughout a conversation

Session start is a discovery event, not enough evidence for a permanent classification. Evaluate completed turns with a context window and reconsider when the topic changes.

Useful labels: fundraising decisions; investor/startup research; relationship feedback; company or fund context; unrelated; uncertain.

Store relevance at the message-span level. A mixed chat should not require importing every unrelated section. Keywords and directory names are hints, not final decisions. Product, traction, or runway discussions may affect fundraising even without mentioning investors.

Identify whether content describes the actual user/company, an external party, an explored scenario, quoted material, or fictional demo data. Discussions about building Signal are not evidence that Signal's founders are raising a round. Ari and Tracewell in the existing demo are fictional and must not become memories about the repository owner.

### 3. Evidence-backed extraction

Extract observations, not a replacement biography. Suggested fields:

```text
observation_id
owner_scope: private person / authorized company / authorized fund
subject: person / startup / fund / round / relationship
kind: fact / goal / preference / constraint / event / open question
claim and conditions
attribution: user statement / third-party claim / assistant inference
source: provider, thread, message, revision, supporting excerpt
observed_at and effective_at
status: candidate / confirmed / contested / superseded / expired
disclosure: private / approved audience / ask first
supersedes and supporting observations
```

Preserve numerical units and temporal qualifiers. A goal, hypothetical, prediction, third-party assertion, and completed event are different types of evidence. Assistant suggestions must not become user preferences unless adopted. Instructions inside imported material are evidence to classify, not authority to change Signal's permissions or policies.

### 4. Updating memory

| New evidence | Operation | Example |
| --- | --- | --- |
| New fact or goal | Add | Looking for a lead investor |
| Independent support for an existing preference | Reinforce | Another reflection favors technical diligence expertise |
| Explicit correction or actual state transition | Supersede, preserving history | Lead signed; now seeking smaller complementary checks |
| Unresolved disagreement | Mark contested and ask when consequential | Two conflicting target amounts without clear dates |
| Time-sensitive fact becomes old | Mark stale or expire | This month's meeting availability |
| User retracts or source is removed | Remove affected evidence and recompute dependents | Incorrect preference removed from brief and retrieval |

Newer is not automatically truer. A new assistant suggestion cannot override a direct user statement. Multiple summaries copied from one conversation are one evidence lineage, not independent corroboration. Merely repeating Signal's own brief back through another assistant does not strengthen its evidence.

Automatically incorporate unambiguous in-scope facts into private memory; keep inferred preferences tentative. Surface consequential conflicts and proposed changes to deal-breakers for review. Never broaden disclosure permissions based on inference.

### 5. Storage and retrieval responsibilities

Keep three logical layers: source evidence, versioned observations, and a current brief derived from those observations. A vector index can locate related evidence; it does not determine truth, ownership, freshness, or which claim supersedes another. A small prototype can use JSON or SQLite plus ordinary filtering; a vector database is not required to demonstrate the concept.

Filter by authorized owner and subject before retrieval. Give the matching agent relevant current facts, unresolved questions, and supporting evidence. Construct a separate disclosure-approved view for communication with the other person's agent.

### 6. Reliability and cadence

- Backfill once, then track per-source cursors or revisions. Process new content plus the context needed to interpret it, rather than rereading all history daily.
- Use stable message IDs and revisions, or source offsets/content hashes where IDs are unavailable. Deduplicate retries and copied exports. Track edits, branches, and deletions where exposed.
- For file watching, process only complete records, recover from truncation/rotation, and keep checkpoints. Use a durable queue; checkpoint committed processing, not merely detection.
- At turn completion or after a short idle interval, extract candidates and update private state. Do not commit lasting memories from partial streamed sentences.
- Run daily reconciliation for missed events, expired facts, and conflicts. Offline devices cannot provide live local updates; show delayed status and catch up later.
- Refresh only recommendations that depend on changed memories. Preserve the memory version behind each recommendation.
- Source deletion propagation is limited by what the connector exposes. Provide explicit deletion controls, remove derived brief/index entries, and disclose any retention limits.

## Smallest convincing simulation

Start with a fixture replaying a selected local Codex-style transcript. A real local adapter can follow after validating access. Do not represent fixtures as live connections.

1. Unrelated coding turn: no fundraising memory added.
2. Same conversation changes topic: user says they need a lead who understands open source.
3. Extract a private goal and preference with exact supporting excerpts.
4. A hypothetical smaller round is discussed: actual round target remains unchanged.
5. Later user says a lead has signed: supersede the search-for-lead goal.
6. Show the brief and investor recommendation changing with an explanation.
7. Replay the same input: no duplicate memories.
8. Show that private context remains absent from the counterparty's view.

This proves relevance filtering, meaning extraction, change over time, and controlled use. It does not require building every provider connector.

## Open decisions

- Initial audience: technically inclined founders with local agents, or founders/investors using primarily web assistants?
- Initial scope: one private founder context or a shared startup workspace with explicit contribution permissions?
- Is the first deliverable a fixture simulation, a selected-file import, or an opt-in local collector?
- Which consequential memory changes need confirmation before affecting recommendations?

## Research context

- [Founder diligence workflow](https://www.capitaly.vc/blog/founder-diligence-30-minutes-claude-workflow-vetting-vcs): an example of assistant-assisted investor evaluation; vendor guidance rather than adoption evidence.
- [Claude for investing teams](https://claude.com/resources/webinars/claude-for-investing-teams): screening, diligence, monitoring, and reporting as potential workflows.
- [LinkedIn profile guidance](https://students.linkedin.com/en-us): professional identity and interests as background context.
- [Earlier Signal conversation](../conversations/2026-10-11-codex-signal-1.txt): product thesis and qualitative interview notes.

## Expanded connector selection

The catalog now includes Gemini, Perplexity, Microsoft Copilot, Hermes, OpenCode, Pi agent, OpenClaw, Manus, Messages, Telegram, WhatsApp, and Discord, each with a local logo and a fictional backfill item (31 sample items total).

- **Personal assistants:** OpenClaw, Manus, Gemini, Perplexity, Microsoft Copilot, and Hermes supplement ChatGPT, Claude, and Muse. Research threads can reveal questions and priorities; they do not automatically establish a user's decisions. [Hermes documents persistent memory and session recall](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory), [Gemini documents past chats](https://support.google.com/gemini/answer/13666746), and [Microsoft documents Copilot conversation history](https://support.microsoft.com/en-us/microsoft-copilot/conversation-history-in-microsoft-copilot). These capabilities motivate the catalog; they do not establish that third-party history APIs are available.
- **Work agents:** Codex, [OpenCode](https://opencode.ai/docs/), and [Pi at pi.dev](https://pi.dev/docs/latest) are grouped separately because their primary positioning is coding/work sessions. Pi agent here is not Inflection's Pi personal assistant. Relevant business context may still occur in their sessions; coding-only samples remain excluded.
- **Messaging:** Messages, Telegram, WhatsApp, Discord, and Slack may contain founder reflections, warm introductions, and follow-up context. [Telegram selected exports](https://telegram.org/blog/export-and-more) and [WhatsApp chat exports](https://faq.whatsapp.com/1180414079177245/) are potential future import routes. Apple Messages would need an explicitly scoped device/export approach; no universal OAuth history connection is assumed. Third-party recommendations in sample threads are marked Needs review, and unrelated social chats are excluded.

These are product-fit candidates, not a claim about adoption rankings or implemented integrations. The simulation never reads inboxes, devices, chat accounts, or agent storage. Backfill remains a separate review step after connection; no memory is extracted merely by clicking Connect. Disconnect removes a source from the next import but does not erase an already edited brief automatically.

## Connection setup and import walkthrough

Setup research checked on 2026-10-11. `connectorSetup.ts` is the single source for the UI instructions and links for all 25 entries. It separates a documented provider capability from the proposed Signal adapter; no command installs a fictitious Signal package. No credentials are collected and no command is executed.

| Route | Sources | Production requirement / limitation |
| --- | --- | --- |
| OAuth authorization | Gmail, Google Calendar, Google Drive, Outlook, Notion, Slack | Registered application, provider consent and scoped access. User filtering is not necessarily a narrower OAuth permission. |
| Hosted MCP with browser OAuth | Granola | MCP-capable client and Granola authorization; endpoint shown in dialog. |
| Local agent / terminal export | Codex, OpenClaw, Hermes, OpenCode, Pi agent | Installed agent and selected session access. OpenCode and Pi document exports. Signal's local reader is not implemented. |
| Exported history | ChatGPT, Claude, Gemini, LinkedIn, Telegram, WhatsApp, Messages, Discord | User-selected export; availability and contents vary. Discord's archive contains the user's own messages. |
| Reviewed manual context | Perplexity, Microsoft Copilot, Manus, Muse (Meta) | Reviewed conversation/task brief; no claim of a third-party OAuth API for personal chat history. Manus team session export requires the appropriate role. |
| Local files | Files & notes | Future file selection and parsing; demo selects a sample brief. |

Muse is Meta's personal agent, confirmed by the user and [Meta's Muse page](https://ai.meta.com/muse/). [Meta's connector guidelines](https://muse.ai/platform/docs) describe exposing a service to Muse, not granting Signal an API to pull a user's Muse archive. The proposed near-term import is a reviewed brief. The current Muse logo was verified against that official connector site.

Conductor was removed at the user's request. Stored source selections and included-item IDs are migrated to remove it without discarding the rest of the draft or edited fields.

The import animation derives its title, excerpt, classification and findings from the exact fixtures selected by source and date range. It never implies an investment finding for an unrelated session or upgrades a hypothetical funding scenario to fact. Timers stop when cancelled or unmounted; reduced-motion preference disables the spinning animation. Progress is transient, not persisted; reloading returns to review using the saved draft, and users can reimport from Sources to replay. Each source processes its own conversations on a deterministic schedule while the other sources progress concurrently. A skip action completes all streams. The longest source determines completion time, rather than the total number of selected sources.

Additional browser verification: all 25 setup dialogs opened with provider-specific instructions; simulated Codex/Claude connection worked; four selected conversations produced two confirmed signals, one review item and one exclusion; the generated brief retained the specific traction and autonomy preference. Cancel/restart and skip worked. OpenClaw appeared in the selected-source walkthrough, mobile dialog/progress screens had no horizontal overflow, all logos loaded, and the Conductor migration preserved edited company text. Production build passed; the existing Vite chunk-size advisory remains.

Stacked-history verification: card heights stayed unchanged before/after import; the Claude history dialog showed both selected conversations with Investment signal and Needs review labels. Escape dismissed it and the dialog fit the mobile viewport. Build passed.

## Main integration (2026-10-11)

Pulled main at `e150182`. Main added editable profiles, custom questionnaire options, a personal-agent selector, and sponsor panels while retaining the original onboarding order. The prior branch is retained as `memory-personalisation-before-main-20261011`, with uncommitted work in the stash labeled `memory onboarding before main integration`, because the remote history had been rewritten with no common ancestor.

Personal context is inserted after Profile (LinkedIn + questions) and before Calendar. Confirming LinkedIn marks that source selected for memory. The shared profile supplies company identity, explicit goals and fit preferences to the generated brief; the freeform onboarding notes remain visible with a link back to edit them. Fictional connector samples adopt the editable user/company identity, while funding, traction and inferred preferences remain clearly labeled simulated evidence. Previously saved meeting-agent preferences remain stored, but the older profile-page agent picker has been removed to avoid a duplicate connection step. Existing saved memory remains available until the user regenerates or edits it.

Google Calendar reuses its simulated connection from source selection. Connecting it on the Calendar screen also persists that source for future visits. Profile-only onboarding keeps the source connections, so skipping extraction does not disconnect Calendar.

All five numbered stages are clickable and return to the first screen of their section, preserving saved profile and memory choices for revision. The current stage is announced with `aria-current`; keyboard focus is visible. Mobile shows the five numbered buttons in a separate header row. Verified backward navigation from Calendar to connectors and Profile, mobile sizing without horizontal overflow, and a passing production build.

Verified: build and client/server type checks passed; all five existing server tests passed. Browser walkthrough covered sign-in, editable LinkedIn fields, questions, connector setup, parallel import, review, profile-aware memory creation, calendar handoff and reload persistence. An edited company and its pitch were retained in memory, questionnaire goals were prefilled, and a previously connected calendar did not prompt for another connection. No external calls or messages were initiated during verification.

## Memory document views

The memory screen uses one document surface with Preview and Markdown views instead of separate form cards and a decorative sidebar. `src/app/MemoryDocumentView.tsx` provides inline section editing, expandable original source excerpts, uncertain conversations under Needs review, onboarding notes, and the latest edit time for each section. Company attribution points to the confirmed profile. Corrections are labeled “Edited by you” while original context remains available.

`src/app/memoryMarkdown.ts` serializes the shared brief into a downloadable `memory.md`. Browser storage remains the persistence mechanism; a Markdown file is created only when exported. Both views update the same brief. Markdown supports plain paragraphs, bullet lists, bold and inline code in Preview; other syntax remains literal text. The document title and five section headings must remain intact and ordered. Invalid boundaries preserve the editor buffer and block Preview, export and Continue until corrected or restored; only valid content is persisted. Recent changes records the latest user edit per section, not a complete revision history. Recreating the brief clears these edit markers.

Verified production build and browser checks: inline-to-Markdown synchronization, Markdown-to-Preview formatting, persistence across reloads, invalid heading protection, export filename, expandable sources, edit metadata and Calendar handoff. Serialization round-trip covered empty sections, multiline text and lists; extra headings were rejected. Mobile at 390px had no horizontal overflow. Existing browser drafts were restored after testing.

## Calendar-aligned visual polish

Connector, import and memory screens reuse the calendar's Hanken Grotesk body type, Barlow Condensed labels/actions, neutral paper/ink palette, radius tokens and restrained active-step gradient. The memory document puts company/background across its full width, then pairs the four remaining sections in two desktop columns. Mobile retains one column and natural document scrolling; text is never clipped to force it into a viewport. Navigation and demo metadata share a compact row above the memory heading.

Newly generated company memory includes the editable profile's founder name, headline, location and experience. Zheng Feng's existing repository profile supplies Stanford MS&E, NUS Overseas Colleges, TikTok/Ant Group experience, founder background and LLM research. Intuition-specific ChatGPT, Claude, Codex and Granola fixtures add sample fundraising plans, design-partner objectives, investor-fit preferences and sharing boundaries. These are explicitly demo scenarios, not verified fundraising or meeting facts. The Intuition Codex fixture no longer borrows Tracewell's invented traction numbers. Other user/company profiles retain the generic fixtures. Existing saved memory is not overwritten; regenerate it to use the expanded samples.

Verified: production build; Markdown includes the expanded profile; connector setup dialog remains accessible; no horizontal overflow at 390px. At 1440×900, all five sections' text in the LinkedIn/ChatGPT/Claude/Codex example was visible without scrolling (last text at approximately 881px). Longer user edits and smaller screens can still require normal page scrolling. Browser test data was restored afterward.

### Source alignment at generation time

Generated memory now persists a snapshot of the exact profile fields, selected source excerpts and onboarding notes used to create it. Preview and Markdown share one brief; the source references are supporting metadata in Preview, not embedded in exported Markdown. Later profile changes cannot silently relabel an old memory's evidence. Section edits retain original evidence and show “Edited by you.” Older drafts without snapshots preserve their content and ask users to regenerate before showing source references. Browser verification covered Markdown round-trip, exact company/profile and funding/source alignment, edited-field attribution, reload persistence and subsequent profile changes.
