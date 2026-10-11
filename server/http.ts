// Small helpers shared by the /api routes (Vercel Functions, Web Request/Response signature).
import { defaultBrief, type Brief } from './agent';
import { HttpError } from './dial';

export { HttpError };

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

/** Wrap a handler so thrown errors come back as `{ error }` JSON instead of a bare 500. */
export function route(fn: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    try {
      return await fn(req);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      const message = err instanceof Error ? err.message : String(err);
      if (!(err instanceof HttpError)) console.error(err);
      return json({ error: message }, status);
    }
  };
}

export async function body<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, 'Expected a JSON body.');
  }
}

/** What the browser sends about the person: their editable profile and questionnaire answers. */
export interface ProfileInput {
  user?: { name?: string; company?: string; pitch?: string };
  chosen?: Record<string, string[]>;
  context?: string;
}

/**
 * The agent's brief from the person's profile. Private facts never come from the browser:
 * they stay on the server, so a leak test can't pass just because the client left them out.
 */
export function briefFrom(p: ProfileInput | undefined): Brief {
  if (!p) return defaultBrief;
  const pick = (id: string, fallback: string[]) => (p.chosen?.[id]?.length ? p.chosen[id] : fallback);
  return {
    ...defaultBrief,
    name: p.user?.name || defaultBrief.name,
    company: p.user?.company || defaultBrief.company,
    pitch: p.user?.pitch || defaultBrief.pitch,
    goals: pick('goal', defaultBrief.goals),
    meet: pick('meet', defaultBrief.meet),
    skip: pick('skip', defaultBrief.skip),
    context: p.context || defaultBrief.context
  };
}
