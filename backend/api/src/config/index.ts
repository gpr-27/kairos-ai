/**
 * Centralised, environment-driven configuration for the API service.
 *
 * This is the ONLY module in the API that reads `process.env`. Every other file
 * imports `config` from here. There are NO environment-specific defaults: a
 * missing or invalid value fails startup immediately with a clear, actionable
 * error instead of silently falling back to a localhost/dev value.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

// ─── Load env from the monorepo root ──────────────────────────────────────────
// `.env.local` preferred, then `.env`. dotenv never overrides values already in
// process.env, so real deployment env vars and test-injected values always win.
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(moduleDir, '../../../..');
const envFiles = [path.join(repoRoot, '.env.local'), path.join(repoRoot, '.env')].filter(existsSync);
if (envFiles.length > 0) {
  loadEnv({ path: envFiles });
}

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

/** Best-effort human label for a model id (used when no explicit label is given). */
function prettifyModelId(id: string): string {
  return id
    .split(/[-_/]/)
    .filter(Boolean)
    .map((part) => (/\d/.test(part) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ');
}

/** Parse `AVAILABLE_MODELS` — each entry is `id` or `id|Label`. */
function parseModels(value: string): ModelOption[] {
  return splitCsv(value).map((entry) => {
    const [id, ...labelParts] = entry.split('|');
    const cleanId = (id ?? '').trim();
    const label = labelParts.join('|').trim();
    return { id: cleanId, label: label || prettifyModelId(cleanId) };
  });
}

// ─── Schema (NO environment-specific defaults) ────────────────────────────────
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  API_PORT: z.coerce.number().int().positive(),
  API_BASE_URL: z.string().url(),
  WEB_BASE_URL: z.string().url(),
  ML_BASE_URL: z.string().url(),
  ALLOWED_ORIGINS: z.string().min(1),

  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_JWT_KEY: z.string().optional(),

  MONGODB_URI: z.string().min(1),
  PISTON_BASE_URL: z.string().url(),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),

  LLM_PROVIDER: z.string().min(1),
  DEFAULT_MODEL: z.string().min(1),
  AVAILABLE_MODELS: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),

  // Secret used to HMAC-sign anonymous guest session tokens.
  GUEST_TOKEN_SECRET: z.string().min(16),
});

function fail(lines: string[]): never {
  console.error('\n❌ Invalid or missing environment variables for the API service:\n');
  for (const line of lines) console.error(`   ❌ ${line}`);
  console.error('\n   Fix your .env.local (copy .env.example) and restart.\n');
  process.exit(1);
}

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const fieldErrors = parsed.error.flatten().fieldErrors;
  fail(
    Object.entries(fieldErrors).flatMap(([key, messages]) =>
      (messages ?? []).map((m) => `${key}: ${m}`),
    ),
  );
}

const raw = parsed.data;
const availableModels = parseModels(raw.AVAILABLE_MODELS);

if (availableModels.length === 0) {
  fail(['AVAILABLE_MODELS must list at least one model id']);
}
if (!availableModels.some((m) => m.id === raw.DEFAULT_MODEL)) {
  fail([`DEFAULT_MODEL "${raw.DEFAULT_MODEL}" is not present in AVAILABLE_MODELS`]);
}

// ─── Public config object ─────────────────────────────────────────────────────
export const config = {
  nodeEnv: raw.NODE_ENV,
  isProduction: raw.NODE_ENV === 'production',
  isDevelopment: raw.NODE_ENV === 'development',
  isTest: raw.NODE_ENV === 'test',

  api: { port: raw.API_PORT, baseUrl: raw.API_BASE_URL },
  web: { baseUrl: raw.WEB_BASE_URL },
  ml: { baseUrl: raw.ML_BASE_URL },
  cors: { allowedOrigins: splitCsv(raw.ALLOWED_ORIGINS) },

  clerk: {
    publishableKey: raw.CLERK_PUBLISHABLE_KEY,
    secretKey: raw.CLERK_SECRET_KEY,
    jwtKey: raw.CLERK_JWT_KEY,
  },

  mongo: { uri: raw.MONGODB_URI },
  piston: { baseUrl: raw.PISTON_BASE_URL },
  log: { level: raw.LOG_LEVEL },

  llm: {
    provider: raw.LLM_PROVIDER,
    defaultModel: raw.DEFAULT_MODEL,
    availableModels,
    availableModelIds: availableModels.map((m) => m.id),
    groqApiKey: raw.GROQ_API_KEY,
  },

  guest: { tokenSecret: raw.GUEST_TOKEN_SECRET },
} as const;

export type AppConfig = typeof config;

/**
 * Non-secret startup summary lines for the diagnostics banner.
 * Secrets are reported only as present/absent, never printed.
 */
export function describeConfig(): string[] {
  return [
    `NODE_ENV=${config.nodeEnv}`,
    `API_PORT=${config.api.port}`,
    `API_BASE_URL=${config.api.baseUrl}`,
    `WEB_BASE_URL=${config.web.baseUrl}`,
    `ML_BASE_URL=${config.ml.baseUrl}`,
    `ALLOWED_ORIGINS=${config.cors.allowedOrigins.length}`,
    `LLM_PROVIDER=${config.llm.provider}`,
    `DEFAULT_MODEL=${config.llm.defaultModel}`,
    `AVAILABLE_MODELS=${config.llm.availableModelIds.length}`,
    `LOG_LEVEL=${config.log.level}`,
    `GROQ_API_KEY=${config.llm.groqApiKey ? 'set ✓' : 'MISSING ✗'}`,
    `CLERK=${config.clerk.secretKey ? 'set ✓' : 'MISSING ✗'}`,
    `GUEST_TOKEN_SECRET=${config.guest.tokenSecret ? 'set ✓' : 'MISSING ✗'}`,
  ];
}
