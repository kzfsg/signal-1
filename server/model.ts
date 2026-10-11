// The language models: Muse Glimmer 30B on Fireworks runs every agent; Jev on OpenRouter makes the
// meet/skip call when OPENROUTER_API_KEY is set. FIREWORKS_BASE_URL and OPENROUTER_BASE_URL point
// either at any OpenAI-compatible server (scripts/fake-fireworks.ts in e2e).
import { createFireworks } from '@ai-sdk/fireworks';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel } from 'ai';
import { HttpError } from './dial';

export const MODEL_ID = process.env.FIREWORKS_MODEL ?? 'accounts/fireworks/models/muse-glimmer-30b';

export function model(): LanguageModel {
  const apiKey = process.env.FIREWORKS_API_KEY;
  if (!apiKey) throw new HttpError(503, 'Fireworks is not configured: set FIREWORKS_API_KEY.');
  return createFireworks({ apiKey, baseURL: process.env.FIREWORKS_BASE_URL })(MODEL_ID);
}

export const JEV_MODEL_ID = process.env.JEV_MODEL ?? 'typesafe/jev-router';

export function jev(): LanguageModel {
  return createOpenAICompatible({
    name: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
    supportsStructuredOutputs: true
  })(JEV_MODEL_ID);
}

/** Who makes the meet/skip call: Jev when OpenRouter is configured, otherwise the agents' own model. */
export function decider(): { model: LanguageModel; name: 'Jev' | 'Muse' } {
  return process.env.OPENROUTER_API_KEY ? { model: jev(), name: 'Jev' } : { model: model(), name: 'Muse' };
}
