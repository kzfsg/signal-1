// npm run dial:setup -- [https://your-app.vercel.app]
// Gives the agent its phone number on Dial and points Dial's webhooks at the app. Safe to re-run.
// Needs DIAL_API_KEY in .env.local (sign up: `curl -fsSL https://getdial.ai/install | bash`, then
// `dial auth login <email>`).
//
// The number is an iMessage line: texts to US phones from a standard number are blocked until 10DLC
// registration clears (days); iMessage lines skip that and fall back to SMS/RCS automatically.
import { defaultBrief, voiceInstruction } from '../server/agent';
import { dial } from '../server/dial';

const client = dial();
const appUrl = process.argv[2]?.replace(/\/+$/, '');

let number = (await client.listNumbers())[0];
if (number) {
  console.log(`Using existing number ${number.number} (${number.id})`);
} else {
  number = await client.purchaseNumber({
    includeImessage: true,
    inboundInstruction: voiceInstruction(defaultBrief),
    explicitProgrammaticConsent: 'Provisioned by the account holder running `npm run dial:setup` for the Signal app.'
  });
  console.log(`Bought ${number.number} (${number.id}). iMessage lines take a few minutes to finish setting up.`);
}

// Inbound calls: the AI receptionist screens whoever rings, with the founder's brief.
await client.setNumberProperties(number.id, { inboundInstruction: voiceInstruction(defaultBrief), nickname: 'Signal agent' });

const env = [`DIAL_NUMBER_ID=${number.id}`];

if (appUrl) {
  const key = process.env.DIAL_API_KEY!;
  const api = (path: string, init?: RequestInit) =>
    fetch(`https://api.getdial.ai/api/v1${path}`, { ...init, headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', ...init?.headers } })
      .then(async r => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(`Dial ${path} ${r.status}: ${JSON.stringify(body)}`);
        return body;
      });
  const targetUrl = `${appUrl}/api/dial/webhook`;
  const { webhooks = [] } = await api('/webhooks');
  let hook = webhooks.find((w: { targetUrl: string }) => w.targetUrl === targetUrl);
  if (!hook) {
    const created = await api('/webhooks', { method: 'POST', body: JSON.stringify({ targetUrl, eventTypes: ['message.received', 'call.ended', 'call.transcribed'] }) });
    hook = created.webhook ?? created;
    console.log(`Webhook created → ${targetUrl}`);
  } else {
    console.log(`Webhook already points at ${targetUrl}`);
  }
  const { secret } = await api(`/webhooks/${hook.id}/secret`);
  env.push(`DIAL_WEBHOOK_SECRET=${secret}`);
}

console.log('\nAdd to .env.local and to Vercel (vercel env add):');
for (const line of env) console.log(`  ${line}`);
if (!appUrl) console.log('\nRe-run with your deployed URL to connect inbound texts and calls: npm run dial:setup -- https://<app>.vercel.app');
