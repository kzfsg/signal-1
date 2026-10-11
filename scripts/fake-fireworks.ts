// A stand-in for Fireworks and OpenRouter (Jev): an OpenAI-compatible POST /chat/completions that answers plausibly
// without a key, so the whole pipeline runs in `npm run e2e`. Structured requests get an object that
// fits the JSON schema; plain requests get one of the facts from the system prompt.
// Standalone: `tsx scripts/fake-fireworks.ts` (PORT, default 8787), then FIREWORKS_BASE_URL and OPENROUTER_BASE_URL=http://127.0.0.1:8787.
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

type Schema = {
  type?: string | string[];
  properties?: Record<string, Schema>;
  items?: Schema;
  enum?: unknown[];
  anyOf?: Schema[];
  minimum?: number;
};

interface Message {
  role: string;
  content: string | { type: string; text?: string }[];
}

const text = (m: Message) => (typeof m.content === 'string' ? m.content : m.content.map(p => p.text ?? '').join(''));

// What makes the fake's assessment fail its checks: the demo month's skip reasons.
const SKIP = /consumer|recruit|selling|series b|later stage|cofounder|climate|healthcare/i;
const CRITERIA = ['Invests at seed', 'Devtools or infra thesis', 'Technical background'];
const QUESTIONS = [
  'What stage and size of check does that usually mean, and is there a technical partner who would lead?',
  'How quickly could that turn into something this quarter, and what would you want to see first?',
  'Is there anything you would need from our side before a first conversation?'
];
const TOPICS = ['Stage and check size', 'Timing and what they need', 'Next steps'];

interface Ctx {
  skip: boolean;
  asks: number; // how many lines the founder's agent has said so far
}

function fill(s: Schema, ctx: Ctx, name = '', i = 0): unknown {
  const types = ([] as string[]).concat(s.type ?? []);
  const nullable = types.includes('null') || s.anyOf?.some(a => a.type === 'null');
  if (nullable) return null;
  if (s.anyOf) return fill(s.anyOf[0], ctx, name, i);
  if (s.enum) return s.enum[0];
  const type = types[0] ?? (s.properties ? 'object' : 'string');
  switch (type) {
    case 'object': {
      const o = Object.fromEntries(Object.entries(s.properties ?? {}).map(([k, v]) => [k, fill(v, ctx, k, i)])) as Record<string, unknown>;
      // A decision is consistent with its checks: meet only when every check passes.
      if ('verdict' in o && Array.isArray(o.checks)) o.verdict = o.checks.every(c => c.pass) ? 'meet' : 'skip';
      return o;
    }
    case 'array': {
      const n = name === 'checks' ? 3 : 2;
      return Array.from({ length: n }, (_, j) => fill(s.items ?? {}, ctx, name, j));
    }
    case 'boolean':
      return name === 'pass' ? !ctx.skip : name === 'enough' ? ctx.asks >= 2 : true;
    case 'number':
    case 'integer':
      return name === 'confidence' ? (ctx.skip ? 88 : 93) : (s.minimum ?? 0);
    default:
      return string(name, ctx, i);
  }
}

function string(name: string, ctx: Ctx, i: number) {
  switch (name) {
    case 'label':
      return CRITERIA[i % CRITERIA.length];
    case 'say':
      return QUESTIONS[Math.min(ctx.asks - 1, QUESTIONS.length - 1)] ?? QUESTIONS[0];
    case 'topic':
      return TOPICS[Math.min(ctx.asks - 1, TOPICS.length - 1)] ?? TOPICS[0];
    case 'reply':
      return 'The first option works. Confirmed on our side.';
    case 'reason':
      return ctx.skip ? 'What they do is on the not-a-fit list for this month.' : 'They match who the founder wants to meet and can help this quarter.';
    case 'summary':
      return ctx.skip ? 'Friendly, but not a fit for what the founder needs now.' : 'A strong fit for this quarter.';
    case 'next':
      return ctx.skip ? 'Skip for now and keep in touch.' : 'Meet next week, demo first.';
    case 'kind':
      return 'vc';
    default:
      return `${name || 'note'} ${i + 1}`;
  }
}

/** A plain reply: the system prompt's "- fact" line that best matches what was just said, not yet used. */
function factReply(messages: Message[]) {
  const system = messages.filter(m => m.role === 'system').map(text).join('\n');
  const facts = system.split('Rules:')[0].split('\n').filter(l => l.startsWith('- ')).map(l => l.slice(2));
  if (!facts.length) return 'Happy to chat.';
  const said = new Set(messages.filter(m => m.role === 'assistant').map(text));
  const unused = facts.filter(f => !said.has(f));
  const pool = unused.length ? unused : facts;
  const last = text(messages.filter(m => m.role === 'user').at(-1) ?? { role: 'user', content: '' }).toLowerCase();
  const words = new Set(last.split(/\W+/).filter(w => w.length > 3));
  const score = (f: string) => f.toLowerCase().split(/\W+/).filter(w => words.has(w)).length;
  return pool.reduce((best, f) => (score(f) > score(best) ? f : best), pool[0]);
}

export function completion(body: { messages: Message[]; response_format?: { type: string; json_schema?: { schema: Schema } } }) {
  const user = body.messages.filter(m => m.role === 'user').map(text).join('\n');
  // Judge the logged conversation, not the instructions around it (which name the skip list's kinds).
  const conversation = /<conversation>([\s\S]*?)<\/conversation>/.exec(user)?.[1] ?? user;
  const schema = body.response_format?.json_schema?.schema;
  const content = schema
    ? JSON.stringify(fill(schema, { skip: SKIP.test(conversation), asks: (conversation.match(/^You: /gm) ?? []).length }))
    : factReply(body.messages);
  return {
    id: `fake-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'fake',
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }
  };
}

export function startFake(port = Number(process.env.PORT ?? 8787)): Promise<{ port: number; close(): void }> {
  const server = createServer(async (req, res) => {
    if (req.method !== 'POST' || !req.url?.endsWith('/chat/completions')) {
      res.writeHead(404).end();
      return;
    }
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(completion(body)));
  });
  return new Promise(resolve =>
    server.listen(port, '127.0.0.1', () => {
      const address = server.address();
      resolve({ port: typeof address === 'object' && address ? address.port : port, close: () => server.close() });
    })
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { port } = await startFake();
  console.log(`fake fireworks on http://127.0.0.1:${port} (FIREWORKS_BASE_URL)`);
}
