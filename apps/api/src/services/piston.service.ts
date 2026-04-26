import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ExternalServiceError } from '../errors/app-error.js';

interface PistonRuntime {
  language: string;
  version: string;
  aliases: string[];
}

interface PistonExecuteResponse {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
}

interface PistonErrorResponse {
  message?: string;
}

interface CommandSpec {
  cmd: string;
  args: string[];
}

interface LocalExecutionPlan {
  compile?: CommandSpec;
  run: CommandSpec;
}

const RUNTIME_CACHE: Map<string, string> = new Map();

const LANGUAGE_TO_FILENAME: Record<string, string> = {
  python: 'main.py',
  'c++': 'main.cpp',
  java: 'Main.java',
  javascript: 'main.js',
  typescript: 'main.ts',
  go: 'main.go',
  rust: 'main.rs',
  ruby: 'main.rb',
  c: 'main.c',
  'csharp.net': 'main.cs',
  kotlin: 'Main.kt',
  swift: 'main.swift',
  php: 'main.php',
  scala: 'Main.scala',
  bash: 'main.sh',
};

function getLocalExecutionPlan(language: string): LocalExecutionPlan | null {
  switch (language) {
    case 'python':
      return { run: { cmd: 'python3', args: ['main.py'] } };
    case 'javascript':
      return { run: { cmd: 'node', args: ['main.js'] } };
    case 'c++':
      return {
        compile: { cmd: 'g++', args: ['main.cpp', '-O2', '-std=c++17', '-o', 'main'] },
        run: { cmd: './main', args: [] },
      };
    case 'java':
      return {
        compile: { cmd: 'javac', args: ['Main.java'] },
        run: { cmd: 'java', args: ['Main'] },
      };
    default:
      return null;
  }
}

function shouldUseLocalFallback(language: string): boolean {
  return getLocalExecutionPlan(language) !== null;
}

async function runProcess(
  command: CommandSpec,
  options: { cwd: string; stdin?: string; timeoutMs: number },
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return await new Promise((resolve, reject) => {
    const child = spawn(command.cmd, command.args, { cwd: options.cwd });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, options.timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) {
        resolve({
          stdout,
          stderr: `${stderr}\nExecution timed out after ${options.timeoutMs}ms`.trim(),
          exitCode: 124,
        });
        return;
      }
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });

    child.stdin.write(options.stdin ?? '');
    child.stdin.end();
  });
}

async function executeCodeLocally(args: ExecuteCodeArgs): Promise<ExecuteCodeResult> {
  const filename = LANGUAGE_TO_FILENAME[args.language] ?? 'main.txt';
  const plan = getLocalExecutionPlan(args.language);
  if (!plan) {
    throw new ExternalServiceError('Code runner', {
      message: `No local fallback configured for ${args.language}`,
    });
  }

  const timeoutMs = args.timeoutMs ?? 5000;
  const start = Date.now();
  const workDir = await mkdtemp(path.join(os.tmpdir(), 'kairos-run-'));

  try {
    await writeFile(path.join(workDir, filename), args.code, 'utf-8');

    if (plan.compile) {
      const compile = await runProcess(plan.compile, { cwd: workDir, timeoutMs });
      if (compile.exitCode !== 0) {
        return {
          stdout: '',
          stderr: compile.stderr,
          exitCode: compile.exitCode,
          compileError: compile.stderr || compile.stdout || 'Compilation failed',
          runtimeMs: Date.now() - start,
        };
      }
    }

    const run = await runProcess(plan.run, {
      cwd: workDir,
      stdin: args.stdin,
      timeoutMs,
    });
    return {
      stdout: run.stdout,
      stderr: run.stderr,
      exitCode: run.exitCode,
      runtimeMs: Date.now() - start,
    };
  } catch (err) {
    throw new ExternalServiceError('Code runner', {
      message:
        err instanceof Error
          ? `Local fallback failed: ${err.message}`
          : 'Local fallback failed unexpectedly',
    });
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function loadRuntimes(): Promise<void> {
  if (RUNTIME_CACHE.size > 0) return;
  try {
    const response = await fetch(`${env.PISTON_BASE_URL}/runtimes`);
    if (!response.ok) {
      let upstreamMessage = `Piston runtimes fetch failed: ${response.status}`;
      try {
        const body = (await response.json()) as PistonErrorResponse;
        if (body.message) upstreamMessage = body.message;
      } catch {
        // ignore non-JSON body
      }
      throw new ExternalServiceError('Piston', {
        status: response.status,
        message: upstreamMessage,
      });
    }
    const runtimes = (await response.json()) as PistonRuntime[];
    for (const runtime of runtimes) {
      if (!RUNTIME_CACHE.has(runtime.language)) {
        RUNTIME_CACHE.set(runtime.language, runtime.version);
      }
      for (const alias of runtime.aliases) {
        if (!RUNTIME_CACHE.has(alias)) {
          RUNTIME_CACHE.set(alias, runtime.version);
        }
      }
    }
    logger.info({ count: RUNTIME_CACHE.size }, 'Piston runtimes loaded');
  } catch (err) {
    if (err instanceof ExternalServiceError) {
      throw err;
    }
    logger.error({ err }, 'Failed to load Piston runtimes');
    throw new ExternalServiceError('Piston');
  }
}

export interface ExecuteCodeArgs {
  language: string;
  code: string;
  stdin?: string;
  timeoutMs?: number;
}

export interface ExecuteCodeResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  compileError?: string;
  runtimeMs?: number;
}

export async function executeCode(args: ExecuteCodeArgs): Promise<ExecuteCodeResult> {
  const hasLocalRunner = shouldUseLocalFallback(args.language);

  try {
    await loadRuntimes();
  } catch (err) {
    if (hasLocalRunner) {
      logger.warn({ lang: args.language }, 'Piston unavailable; using local fallback runner');
      return executeCodeLocally(args);
    }
    throw err;
  }

  {
    const version = RUNTIME_CACHE.get(args.language);
    if (!version) {
      if (hasLocalRunner) {
        logger.warn({ lang: args.language }, 'No Piston runtime found; using local fallback runner');
        return executeCodeLocally(args);
      }
      throw new ExternalServiceError(`Piston (no runtime for ${args.language})`, {
        message: `No remote or local runtime for ${args.language}`,
      });
    }

    const filename = LANGUAGE_TO_FILENAME[args.language] ?? 'main.txt';
    const start = Date.now();

    try {
      const response = await fetch(`${env.PISTON_BASE_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: args.language,
          version,
          files: [{ name: filename, content: args.code }],
          stdin: args.stdin ?? '',
          run_timeout: args.timeoutMs ?? 5000,
          compile_timeout: 10000,
        }),
      });

      if (!response.ok) {
        let upstreamMessage = `Piston returned ${response.status}`;
        try {
          const body = (await response.json()) as PistonErrorResponse;
          if (body.message) {
            upstreamMessage = body.message;
          }
        } catch {
          // ignore non-JSON body
        }
        if (hasLocalRunner) {
          logger.warn(
            { lang: args.language, status: response.status },
            'Piston execute failed; using local fallback runner',
          );
          return executeCodeLocally(args);
        }
        throw new ExternalServiceError('Piston', { status: response.status, message: upstreamMessage });
      }

      const data = (await response.json()) as PistonExecuteResponse;
      const runtimeMs = Date.now() - start;

      return {
        stdout: data.run.stdout,
        stderr: data.run.stderr,
        exitCode: data.run.code,
        compileError: data.compile?.code !== 0 ? data.compile?.output : undefined,
        runtimeMs,
      };
    } catch (err) {
      if (err instanceof ExternalServiceError) {
        if (hasLocalRunner) {
          logger.warn({ lang: args.language }, 'Piston execute failed; using local fallback runner');
          return executeCodeLocally(args);
        }
        logger.error({ err, lang: args.language }, 'Piston execute failed');
        throw err;
      }
      // Network / fetch error
      if (hasLocalRunner) {
        logger.warn({ lang: args.language }, 'Piston network error; using local fallback runner');
        return executeCodeLocally(args);
      }
      logger.error({ err, lang: args.language }, 'Piston execute failed');
      throw new ExternalServiceError('Piston', { message: 'Execution failed unexpectedly' });
    }
  }

}
