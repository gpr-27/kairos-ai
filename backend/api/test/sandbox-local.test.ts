/**
 * Deterministic sandbox test: forces the LOCAL execution fallback by making the
 * Piston `fetch` fail, then verifies code actually compiles & runs on this machine.
 * No network required. Covers python, javascript, and c++ (g++/clang).
 */
import { execSync } from 'node:child_process';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { executeCode } from '../src/services/piston.service.js';

function hasBinary(cmd: string): boolean {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

describe('sandbox — local fallback execution (no network)', () => {
  beforeEach(() => {
    // Force the Piston path to fail so executeCode() uses the local runner.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network disabled for local-fallback test')),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('runs Python and captures stdout', async () => {
    const result = await executeCode({ language: 'python', code: 'print("hello-sandbox")' });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('hello-sandbox');
  });

  it('feeds stdin into the program', async () => {
    const code = 'import sys\nprint(sys.stdin.readline().strip().upper())';
    const result = await executeCode({ language: 'python', code, stdin: 'kairos\n' });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('KAIROS');
  });

  it('reports a non-zero exit code', async () => {
    const result = await executeCode({ language: 'python', code: 'import sys\nsys.exit(3)' });
    expect(result.exitCode).toBe(3);
  });

  it('runs JavaScript via node', async () => {
    const result = await executeCode({ language: 'javascript', code: 'console.log(2 + 3)' });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('5');
  });

  it.runIf(hasBinary('g++'))('compiles and runs C++ (explicit std:: headers)', async () => {
    const code = [
      '#include <iostream>',
      'int main() {',
      '  std::cout << "cpp-ok" << std::endl;',
      '  return 0;',
      '}',
    ].join('\n');
    const result = await executeCode({ language: 'c++', code });
    expect(result.compileError).toBeUndefined();
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('cpp-ok');
  });

  it('surfaces a compile error for invalid C++', async () => {
    if (!hasBinary('g++')) return;
    const result = await executeCode({ language: 'c++', code: 'int main() { return' });
    expect(result.exitCode).not.toBe(0);
    expect(result.compileError ?? result.stderr).toBeTruthy();
  });
});
