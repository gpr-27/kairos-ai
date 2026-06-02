#!/usr/bin/env node
/**
 * Free Kairos dev ports before `npm run dev`.
 * Stops stale node/tsx API processes from this repo; warns if another app owns the port.
 */
import { execSync } from 'node:child_process';

// Load repo-root env files into process.env (does not override already-set vars).
try {
  process.loadEnvFile(new URL('../.env.local', import.meta.url));
} catch {
  /* no .env.local */
}
try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch {
  /* no .env */
}

const mlOnly = process.argv.includes('--ml-only') || process.env.ML_ONLY === '1';
const apiOnly = process.argv.includes('--api-only') || process.env.API_ONLY === '1';

const API_PORT = Number(process.env.API_PORT);
const ML_PORT = Number(process.env.ML_PORT);

if (!mlOnly && Number.isNaN(API_PORT)) {
  console.error('[dev] Missing API_PORT in .env.local');
  process.exit(1);
}
if (!apiOnly && Number.isNaN(ML_PORT)) {
  console.error('[dev] Missing ML_PORT in .env.local');
  process.exit(1);
}

const PORTS = [];
if (!mlOnly) PORTS.push(API_PORT);
if (!apiOnly) PORTS.push(ML_PORT);

function pidsOnPort(port) {
  try {
    return execSync(`lsof -ti :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(Number);
  } catch {
    return [];
  }
}

function processArgs(pid) {
  try {
    return execSync(`ps -p ${pid} -o args=`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function isStaleKairosApi(args) {
  return args.includes('kairos-ai') && args.includes('server.ts');
}

function isStaleKairosMl(args) {
  return (
    args.includes('kairos-ai') &&
    args.includes('uvicorn') &&
    (args.includes('app.main:app') || args.includes('backend/ml'))
  );
}

let blocked = false;

for (const port of PORTS) {
  for (const pid of pidsOnPort(port)) {
    const args = processArgs(pid);
    if (isStaleKairosApi(args)) {
      console.log(`[dev] Stopping stale API on port ${port} (pid ${pid})`);
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        /* already gone */
      }
      continue;
    }
    if (isStaleKairosMl(args)) {
      console.log(`[dev] Stopping stale ML service on port ${port} (pid ${pid})`);
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        /* already gone */
      }
      continue;
    }
    const portHint =
      port === ML_PORT
        ? 'Stop that process, or set ML_PORT in .env.local'
        : 'Stop that process or set API_PORT in .env.local';
    console.error(
      `[dev] Port ${port} is in use by pid ${pid} (not a Kairos dev server).\n` +
        `      ${portHint}\n` +
        `      Command: ${args.slice(0, 120)}${args.length > 120 ? '…' : ''}`,
    );
    blocked = true;
  }
}

if (blocked) {
  process.exit(1);
}
