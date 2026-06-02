/**
 * Vitest global setup for the API.
 *
 * The API config (config/index.ts) now REQUIRES every env var with no defaults.
 * We inject the full set here so validation passes in CI, where the gitignored
 * root `.env.local` does not exist. These are TEST doubles only. `??=` means
 * real env / `.env.local` values always win when present, and `dotenv` never
 * overrides values already in process.env.
 */
process.env.NODE_ENV ??= 'test';
process.env.API_PORT ??= '4000';
process.env.API_BASE_URL ??= 'http://localhost:4000';
process.env.WEB_BASE_URL ??= 'http://localhost:5173';
process.env.ML_BASE_URL ??= 'http://localhost:8000';
process.env.ALLOWED_ORIGINS ??= 'http://localhost:5173,http://localhost:4000';
process.env.CLERK_PUBLISHABLE_KEY ??= 'pk_test_dummy';
process.env.CLERK_SECRET_KEY ??= 'sk_test_dummy';
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/kairos_test';
process.env.PISTON_BASE_URL ??= 'https://emkc.org/api/v2/piston';
// 'fatal' keeps expected error logs (e.g. forced Piston failures) out of test output.
process.env.LOG_LEVEL ??= 'fatal';
process.env.LLM_PROVIDER ??= 'groq';
process.env.DEFAULT_MODEL ??= 'llama-3.3-70b-versatile';
process.env.AVAILABLE_MODELS ??=
  'llama-3.3-70b-versatile|Llama 3.3 70B,llama-3.1-8b-instant|Llama 3.1 8B';
process.env.GROQ_API_KEY ??= 'gsk_test_dummy';
process.env.GUEST_TOKEN_SECRET ??= 'test_guest_secret_0123456789abcdef';
