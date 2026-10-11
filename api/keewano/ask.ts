// POST /api/keewano/ask { question } → the agent answers a question about the founder's networking
// history by querying Keewano live through its MCP server.
import { createMCPClient } from '@ai-sdk/mcp';
import { generateText, isStepCount } from 'ai';
import { HttpError, body, json, route } from '../../server/http';
import { MCP_URL, mcpHeaders } from '../../server/keewano';
import { model } from '../../server/model';

const SYSTEM = `You answer questions about a founder's networking history, stored in Keewano.
Each Keewano user is one person the founder's agent screened. Their events, in order:
counterpart_type (vc_technical, vc_generalist, vc_late_stage, angel_infra, operator_agents_in_prod, operator_other,
founder_cofounder_search, recruiter, vendor), channel (agent/call/text), withheld (what the agent refused to share,
e.g. revenue_figures), failed_check (criteria they missed), agent_seconds, verdict (meet/skip),
human_met (bool: did the founder actually meet them), outcome (second_meeting, term_sheet, pilot, intro, came_back).
Always query Keewano for the answer; never guess numbers. Answer in two or three plain sentences with the key numbers.`;

export const POST = route(async req => {
  const { question } = await body<{ question?: string }>(req);
  if (!question?.trim()) throw new HttpError(400, 'Send a `question`.');

  const mcp = await createMCPClient({ transport: { type: 'http', url: MCP_URL, headers: mcpHeaders() } });
  try {
    const tools = await mcp.tools();
    const result = await generateText({
      model: model(),
      system: SYSTEM,
      tools,
      stopWhen: isStepCount(8),
      prompt: question.trim()
    });
    const calls = result.steps.flatMap(s => s.toolCalls.map(c => ({ tool: c.toolName, input: c.input })));
    return json({ answer: result.text, calls });
  } finally {
    await mcp.close();
  }
});
