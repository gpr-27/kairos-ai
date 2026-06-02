/**
 * Centralised, environment-driven configuration for the frontend.
 *
 * This is the ONLY module that reads `import.meta.env`. Every other file imports
 * `config` (or the URL resolvers) from here. There are NO hardcoded fallbacks:
 * missing or invalid values throw at startup with a clear, actionable message.
 */
import { z } from 'zod';

// ─── Shared helpers ───────────────────────────────────────────────────────────
export interface ModelOption {
  id: string;
  label: string;
}

const splitCsv = (value: string): string[] =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/** Best-effort human label for a model id (used when no explicit label given). */
function prettifyModelId(id: string): string {
  return id
    .split(/[-_/]/)
    .filter(Boolean)
    .map((part) => (/\d/.test(part) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ');
}

/** Parse `VITE_AVAILABLE_MODELS` — each entry is `id` or `id|Label`. */
function parseModels(value: string): ModelOption[] {
  return splitCsv(value).map((entry) => {
    const [id, ...labelParts] = entry.split('|');
    const cleanId = (id ?? '').trim();
    const label = labelParts.join('|').trim();
    return { id: cleanId, label: label || prettifyModelId(cleanId) };
  });
}

// ─── Schema (NO hardcoded fallbacks) ──────────────────────────────────────────
const schema = z.object({
  VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  // API/ML/WebSocket URLs are required only in development (separately-hosted
  // services). A production build is same-origin and derives them from the
  // browser, so they are optional here — see the dev-only check below.
  VITE_API_BASE_URL: z.string().url().optional(),
  VITE_ML_BASE_URL: z.string().url().optional(),
  VITE_SOCKET_URL: z.string().min(1).optional(),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']),
  VITE_LLM_PROVIDER: z.string().min(1),
  VITE_DEFAULT_MODEL: z.string().min(1),
  VITE_AVAILABLE_MODELS: z.string().min(1),
});

const parsed = schema.safeParse({
  VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_ML_BASE_URL: import.meta.env.VITE_ML_BASE_URL,
  VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
  VITE_LLM_PROVIDER: import.meta.env.VITE_LLM_PROVIDER,
  VITE_DEFAULT_MODEL: import.meta.env.VITE_DEFAULT_MODEL,
  VITE_AVAILABLE_MODELS: import.meta.env.VITE_AVAILABLE_MODELS,
});

if (!parsed.success) {
  console.error(
    '❌ Invalid or missing frontend environment variables:',
    parsed.error.flatten().fieldErrors,
  );
  throw new Error(
    'Invalid environment variables. Did you copy .env.example to .env.local and fill it in?',
  );
}

const raw = parsed.data;

// In development the web app talks to separately-hosted API/ML/WebSocket services,
// so their URLs are required. A production build is same-origin — one server serves
// the SPA, proxies `/ml`, and hosts `/api` + the WebSocket — so these are derived
// from `window.location` at runtime and need not be provided at build time.
if (import.meta.env.DEV) {
  const missingUrls = (
    [
      ['VITE_API_BASE_URL', raw.VITE_API_BASE_URL],
      ['VITE_ML_BASE_URL', raw.VITE_ML_BASE_URL],
      ['VITE_SOCKET_URL', raw.VITE_SOCKET_URL],
    ] as const
  )
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missingUrls.length > 0) {
    throw new Error(
      `Missing required dev environment variables: ${missingUrls.join(', ')}. ` +
        'Did you copy .env.example to .env.local and fill it in?',
    );
  }
}

const availableModels = parseModels(raw.VITE_AVAILABLE_MODELS);

if (availableModels.length === 0) {
  throw new Error('VITE_AVAILABLE_MODELS must list at least one model id');
}
if (!availableModels.some((m) => m.id === raw.VITE_DEFAULT_MODEL)) {
  throw new Error(`VITE_DEFAULT_MODEL "${raw.VITE_DEFAULT_MODEL}" is not in VITE_AVAILABLE_MODELS`);
}

// ─── Public config object ─────────────────────────────────────────────────────
export const config = {
  appEnv: raw.VITE_APP_ENV,
  isDev: import.meta.env.DEV,
  isProduction: raw.VITE_APP_ENV === 'production',
  mode: import.meta.env.MODE,

  clerk: { publishableKey: raw.VITE_CLERK_PUBLISHABLE_KEY },
  api: { baseUrl: raw.VITE_API_BASE_URL },
  ml: { baseUrl: raw.VITE_ML_BASE_URL },
  socket: { url: raw.VITE_SOCKET_URL },

  llm: {
    provider: raw.VITE_LLM_PROVIDER,
    defaultModel: raw.VITE_DEFAULT_MODEL,
    availableModels,
  },
} as const;

export type AppConfig = typeof config;

// ─── Service URL resolution ───────────────────────────────────────────────────
// In dev, when the app is opened via ngrok / a LAN host, the browser must not use
// localhost — that points at the visitor's machine. Instead we same-origin to the
// Vite dev server and let its proxy forward to the local services.
const API_PROXY_PREFIX = '/_kairos/api';
const ML_PROXY_PREFIX = '/_kairos/ml';

function shouldProxyViaVite(): boolean {
  if (!config.isDev) return false;
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host !== 'localhost' && host !== '127.0.0.1' && host !== '::1';
}

export function getApiBaseUrl(): string {
  if (shouldProxyViaVite()) return `${window.location.origin}${API_PROXY_PREFIX}`;
  // Production: same-origin — this very host serves the API under `/api/v1`.
  if (!import.meta.env.DEV && typeof window !== 'undefined') return window.location.origin;
  return config.api.baseUrl ?? '';
}

export function getMlBaseUrl(): string {
  if (shouldProxyViaVite()) return `${window.location.origin}${ML_PROXY_PREFIX}`;
  // Production: same-origin — the API proxies `/ml/*` to the co-located ML service.
  if (!import.meta.env.DEV && typeof window !== 'undefined') return `${window.location.origin}/ml`;
  return config.ml.baseUrl ?? '';
}

/** Base WebSocket URL (without a path). Append e.g. `/ws/playground`. */
export function getSocketUrl(): string {
  if (shouldProxyViaVite()) {
    return `${window.location.origin.replace(/^http/, 'ws')}${API_PROXY_PREFIX}`;
  }
  // Production: same-origin — the WebSocket server shares this host.
  if (!import.meta.env.DEV && typeof window !== 'undefined') {
    return window.location.origin.replace(/^http/, 'ws');
  }
  return config.socket.url ?? '';
}
