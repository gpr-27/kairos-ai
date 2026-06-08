/**
 * WebSocket handler for interactive playground execution.
 *
 * Protocol (all messages are JSON):
 *
 *   Client → Server
 *     { type: 'start',  language: string, code: string }
 *     { type: 'stdin',  data: string }   ← a line of input the user typed
 *     { type: 'kill' }                   ← user clicked Stop
 *
 *   Server → Client
 *     { type: 'ready' }                  ← process spawned, ready for I/O
 *     { type: 'stdout', data: string }   ← chunk of stdout
 *     { type: 'stderr', data: string }   ← chunk of stderr
 *     { type: 'exit',   code: number, runtimeMs: number }
 *     { type: 'error',  message: string }
 */

import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { WebSocket, WebSocketServer } from 'ws';
import { logger } from '../config/logger.js';

// ── Execution plan per language ───────────────────────────────────────────────

interface ExecPlan {
  filename: string;
  compile?: { cmd: string; args: string[] };
  run: { cmd: string; args: string[] };
}

/**
 * Absolute path to the bundled `tsx` binary, used to run the TypeScript playground
 * with no network access. tsx is a workspace devDependency hoisted to the root
 * node_modules in both local dev and the Docker image; we resolve it by absolute
 * path because the child process runs from a throwaway temp dir that has no
 * node_modules of its own (so `npx tsx` would re-download). Falls back to PATH.
 */
function resolveTsxBin(): string {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url)); // …/backend/api/src/ws
  const candidates = [
    path.resolve(moduleDir, '../../../../node_modules/.bin/tsx'), // repo/image root
    path.resolve(process.cwd(), 'node_modules/.bin/tsx'),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? 'tsx';
}
const TSX_BIN = resolveTsxBin();

// Only languages whose runtimes exist in the production image (python3 + node, plus
// the bundled tsx for TypeScript) are runnable interactively. The UI offers exactly
// this set (frontend/src/routes/playground.tsx); anything else returns a clear
// "not supported" message via runSession's guard. Add a toolchain to the Dockerfile
// and an entry here to re-enable a compiled language.
const EXEC_PLANS: Record<string, ExecPlan> = {
  python: { filename: 'main.py', run: { cmd: 'python3', args: ['main.py'] } },
  javascript: { filename: 'main.js', run: { cmd: 'node', args: ['main.js'] } },
  typescript: { filename: 'main.ts', run: { cmd: TSX_BIN, args: ['main.ts'] } },
};

const TIMEOUT_MS = 30_000; // 30 s max per session

// ── Helpers ───────────────────────────────────────────────────────────────────

function send(ws: WebSocket, msg: Record<string, unknown>): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

/**
 * Map a spawn() failure to a clear, user-facing message. A missing runtime binary
 * surfaces as ENOENT ("spawn g++ ENOENT"); translate that into something actionable
 * instead of leaking the raw command name. Only fires when the runtime truly isn't
 * present, so the message is always accurate in context.
 */
function execErrorMessage(err: NodeJS.ErrnoException, language: string): string {
  if (err.code === 'ENOENT') {
    return (
      `The runtime for "${language}" isn't installed on this server, so it can't run here. ` +
      `Try Python or JavaScript, or run this language in your local environment.`
    );
  }
  return err.message;
}

// ── Session handler ───────────────────────────────────────────────────────────

async function runSession(ws: WebSocket, language: string, code: string): Promise<void> {
  const plan = EXEC_PLANS[language];
  if (!plan) {
    send(ws, {
      type: 'error',
      message: `Interactive mode is not supported for "${language}" yet.`,
    });
    return;
  }

  const workDir = await mkdtemp(path.join(os.tmpdir(), 'kairos-exec-'));
  const start = Date.now();
  let child: ChildProcessWithoutNullStreams | null = null;
  let killed = false;

  const cleanup = async () => {
    child?.kill('SIGKILL');
    await rm(workDir, { recursive: true, force: true });
  };

  const timer = setTimeout(async () => {
    killed = true;
    send(ws, { type: 'stderr', data: '\n⏱ Execution timed out (30 s).\n' });
    send(ws, { type: 'exit', code: 124, runtimeMs: Date.now() - start });
    await cleanup();
  }, TIMEOUT_MS);

  try {
    await writeFile(path.join(workDir, plan.filename), code, 'utf-8');

    // ── Compile step (if needed) ─────────────────────────────────────────────
    if (plan.compile) {
      const { cmd, args } = plan.compile;
      const compileResult = await new Promise<{ ok: boolean; output: string }>((resolve) => {
        const proc = spawn(cmd, args, { cwd: workDir });
        let out = '';
        proc.stdout.on('data', (d: Buffer) => {
          out += d.toString();
        });
        proc.stderr.on('data', (d: Buffer) => {
          out += d.toString();
        });
        proc.on('close', (code) => resolve({ ok: code === 0, output: out }));
        proc.on('error', (e) => resolve({ ok: false, output: execErrorMessage(e, language) }));
      });

      if (!compileResult.ok) {
        clearTimeout(timer);
        send(ws, { type: 'stderr', data: compileResult.output });
        send(ws, { type: 'exit', code: 1, runtimeMs: Date.now() - start });
        await cleanup();
        return;
      }
    }

    // ── Run step ─────────────────────────────────────────────────────────────
    const { cmd, args } = plan.run;
    child = spawn(cmd, args, { cwd: workDir });

    send(ws, { type: 'ready' });

    child.stdout.on('data', (chunk: Buffer) => {
      send(ws, { type: 'stdout', data: chunk.toString() });
    });

    child.stderr.on('data', (chunk: Buffer) => {
      send(ws, { type: 'stderr', data: chunk.toString() });
    });

    child.on('error', (err) => {
      if (!killed) send(ws, { type: 'error', message: execErrorMessage(err, language) });
    });

    child.on('close', async (code) => {
      clearTimeout(timer);
      if (!killed) {
        send(ws, { type: 'exit', code: code ?? 1, runtimeMs: Date.now() - start });
      }
      await cleanup();
    });

    // ── Forward stdin from client ─────────────────────────────────────────────
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as { type: string; data?: string };
        if (msg.type === 'stdin' && msg.data !== undefined && child?.stdin) {
          child.stdin.write(msg.data);
        } else if (msg.type === 'kill') {
          killed = true;
          clearTimeout(timer);
          send(ws, { type: 'stderr', data: '\n🛑 Execution stopped.\n' });
          send(ws, { type: 'exit', code: -1, runtimeMs: Date.now() - start });
          cleanup().catch(() => {});
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      killed = true;
      clearTimeout(timer);
      cleanup().catch(() => {});
    });
  } catch (err) {
    clearTimeout(timer);
    logger.error({ err, language }, 'Playground exec error');
    send(ws, { type: 'error', message: err instanceof Error ? err.message : 'Execution failed.' });
    await cleanup();
  }
}

// ── WebSocket server setup ────────────────────────────────────────────────────

export function attachPlaygroundWS(wss: WebSocketServer): void {
  wss.on('connection', (ws) => {
    logger.info('Playground WS connected');

    ws.once('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as {
          type: string;
          language?: string;
          code?: string;
        };
        if (msg.type !== 'start' || !msg.language || !msg.code) {
          send(ws, {
            type: 'error',
            message: 'First message must be {type:"start", language, code}.',
          });
          ws.close();
          return;
        }
        runSession(ws, msg.language, msg.code).catch((err: unknown) => {
          logger.error({ err }, 'runSession threw');
          send(ws, { type: 'error', message: 'Internal server error.' });
        });
      } catch {
        send(ws, { type: 'error', message: 'Invalid JSON.' });
        ws.close();
      }
    });

    ws.on('close', () => logger.info('Playground WS disconnected'));
  });
}
