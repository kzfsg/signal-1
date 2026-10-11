import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
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
});
