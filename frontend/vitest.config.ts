import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

// Reuse the app's Vite config (aliases, plugins) and layer test settings on top.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['test/**/*.test.{ts,tsx}'],
      // Satisfy @/config validation without a real .env.local (absent in CI).
      env: {
        VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_dummy',
        VITE_API_BASE_URL: 'http://localhost:4000',
        VITE_ML_BASE_URL: 'http://localhost:8000',
        VITE_SOCKET_URL: 'ws://localhost:4000',
        VITE_APP_ENV: 'development',
        VITE_LLM_PROVIDER: 'groq',
        VITE_DEFAULT_MODEL: 'llama-3.3-70b-versatile',
        VITE_AVAILABLE_MODELS:
          'llama-3.3-70b-versatile|Llama 3.3 70B,llama-3.1-8b-instant|Llama 3.1 8B',
      },
    },
  }),
);
