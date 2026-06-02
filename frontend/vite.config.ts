import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Build tooling cannot import the runtime config, so it reads the shared root env
// directly (no hardcoded fallbacks). loadEnv reads .env/.env.local from the repo root.
const rootEnv = loadEnv(process.env.NODE_ENV ?? 'development', path.resolve(__dirname, '..'), '');

export default defineConfig({
  // Load .env/.env.local from the monorepo root so the frontend shares root env config.
  envDir: path.resolve(__dirname, '..'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@kairos/types': path.resolve(__dirname, '../backend/types/src/index.ts'),
    },
  },
  server: {
    port: rootEnv.WEB_PORT ? Number(rootEnv.WEB_PORT) : undefined,
    // Allow another Vite app on the same port (e.g. a second repo) without failing startup.
    strictPort: false,
    allowedHosts: true,
    // So ngrok / LAN visitors hit local API + ML on the same origin (see getApiBaseUrl / getMlBaseUrl).
    proxy: {
      '/_kairos/api': {
        target: rootEnv.API_BASE_URL,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/_kairos\/api/, ''),
        ws: true,
      },
      '/_kairos/ml': {
        target: rootEnv.ML_BASE_URL,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/_kairos\/ml/, ''),
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          monaco: ['@monaco-editor/react', 'monaco-editor'],
          radix: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
        },
      },
    },
  },
});
