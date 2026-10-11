import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

/** api/a/b.ts for /api/a/b, else a dynamic sibling like api/a/[action].ts, as Vercel resolves them. */
function routeFile(pathname: string) {
  const exact = fileURLToPath(new URL(`.${pathname}.ts`, import.meta.url));
  if (existsSync(exact)) return exact;
  const dir = fileURLToPath(new URL(`.${pathname.slice(0, pathname.lastIndexOf('/'))}/`, import.meta.url));
  const dynamic = existsSync(dir) ? readdirSync(dir).find(f => /^\[[^\]]+\]\.ts$/.test(f)) : undefined;
  return dynamic ? dir + dynamic : null;
}

/**
 * Serve /api/* in dev from the same files Vercel deploys as Functions (api/**.ts exporting GET/POST
 * with the Web Request/Response signature), so `npm run dev` runs the real integrations.
 */
function apiRoutes(): Plugin {
  return {
    name: 'signal-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        if (!url.pathname.startsWith('/api/')) return next();
        const file = routeFile(url.pathname);
        if (!file) return next();
        try {
          const mod = await server.ssrLoadModule(file);
          const handler = mod[req.method ?? 'GET'];
          if (typeof handler !== 'function') {
            res.statusCode = 405;
            return res.end();
          }
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = chunks.length ? Buffer.concat(chunks) : undefined;
          const request = new Request(url.href, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body
          });
          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          server.ssrFixStacktrace(err as Error);
          next(err);
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  // Server-only keys (DIAL_*, KEEWANO_*, VERCEL_OIDC_TOKEN) for the dev API routes. Not exposed to the
  // browser: Vite only inlines VITE_-prefixed variables.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''), process.env);

  return {
    plugins: [react(), apiRoutes()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
    },
    // Bind IPv4 explicitly: by default "localhost" resolves to ::1 only, which embedded previews
    // connecting to 127.0.0.1 can't reach. Fixed port so the preview URL never drifts.
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true
    }
  };
});
