import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite natively exposes all VITE_* prefixed environment variables from
// process.env as import.meta.env.VITE_* at build time — no define block needed.
// On Vercel, project env vars are injected into process.env before the build runs.
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), tailwindcss()],
  css: {
    postcss: {
      plugins: [],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/production-acceptance.test.ts', 'node_modules', 'dist'],
  },
});
