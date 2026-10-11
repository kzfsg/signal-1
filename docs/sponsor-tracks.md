# Sponsor track integrations

Each sponsor carries one stage of Signal's flow. Both run against the real services.

| Sponsor | Its job in Signal | Where it shows up | Code |
|---|---|---|---|
| **Dial** | Reach: the agent gets its own phone number, so it can screen people who don't have an agent (by call or text) and follow up by text | Results: "Your agent has a phone number" (call someone live, live inbox) and "Book it by text" under each person's notes | `server/dial.ts`, `api/dial/*` |
| **Keewano** | Memory: every meet is logged as an ordered event timeline per person; a live query finds the patterns, and you can ask it anything | Results: "What six months of coffees add up to" (insights + ask box) | `server/keewano.ts`, `server/history.ts`, `api/keewano/*` |

The agent's brain is one function, `decide()` in `server/agent.ts`, shared by the phone line and the Keewano routes. Its model runs through Vercel AI Gateway (`SIGNAL_MODEL`, default `openai/gpt-5-mini`).

## Dial

```bash
npm run dial:setup                                    # buys an iMessage number, sets the inbound screening prompt
npm run dial:setup -- https://<app>.vercel.app        # also registers the webhook, prints DIAL_WEBHOOK_SECRET
```

- The number is an **iMessage line** on purpose. Standard US numbers can't text US phones until 10DLC registration clears (3–5 business days). iMessage lines aren't subject to 10DLC and fall back to SMS/RCS automatically.
- `POST /api/dial/call` places an outbound AI call with the founder's brief, then polls the call; once the transcript lands, `decide()` makes the meet/skip call.
- `POST /api/dial/webhook` verifies `X-Dial-Signature`. An inbound text gets two qualifying questions, then a decision and a reply. When a call's transcript lands, the agent decides and texts the verdict. Both are logged to Keewano.
- Free accounts allow 5 minutes per call and 2 concurrent calls.

## Keewano

```bash
npm run keewano:setup   # registers Signal's event types and backfills 6 months (320 people) of history
```

- Events per person: `counterpart_type`, `channel`, `withheld`, `failed_check`, `agent_seconds`, `verdict`, `human_met`, `outcome`.
- `GET /api/keewano/insights` runs one live SQL query over Keewano's Postgres wire protocol (`pgsql.keewano.com:27543`). It returns conversion by counterpart type, who came back after a skip, and who pushed for revenue, each traceable to named people.
- `POST /api/keewano/ingest` logs the current run's meets when Results opens.
- `POST /api/keewano/ask` answers free-form questions with Keewano's MCP server as tools, which covers the "answer the judge's question live" requirement.
- Events become queryable about 5 minutes after ingest, so run the backfill before the demo.

## Local dev

`npm run dev` serves the `api/` routes through a small Vite middleware, using the same files Vercel deploys as Functions. Keys come from `.env.local` (see `.env.example`). Without keys, each panel shows what to configure instead of failing.
