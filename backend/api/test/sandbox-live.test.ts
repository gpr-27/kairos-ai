/**
 * Live integration test: exercises the real Piston endpoint over the network.
 * Verifies the remote sandbox actually compiles & executes submitted code.
 *
 * Skips automatically when the network / Piston is unreachable so the suite
 * stays green offline. Set KAIROS_SKIP_LIVE=1 to force-skip.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { config } from '../src/config/index.js';
import { executeCode } from '../src/services/piston.service.js';

async function pistonReachable(): Promise<boolean> {
  if (process.env.KAIROS_SKIP_LIVE === '1') return false;
  try {
    const res = await fetch(`${config.piston.baseUrl}/runtimes`, {
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

describe('sandbox — live Piston execution', () => {
  let online = false;

  beforeAll(async () => {
    online = await pistonReachable();
    if (!online) {
      console.warn('[sandbox-live] Piston unreachable — skipping live execution test.');
    }
  });

  afterAll(() => {
    /* nothing to clean up */
  });

  it('executes Python on the remote sandbox', async () => {
    if (!online) return;
    const result = await executeCode({ language: 'python', code: 'print("kairos-live")' });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('kairos-live');
  });
});
