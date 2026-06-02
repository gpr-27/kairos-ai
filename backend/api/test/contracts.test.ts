import { describe, expect, it } from 'vitest';

import {
  LANGUAGE_LABELS,
  PISTON_LANGUAGE_MAP,
  SUPPORTED_LANGUAGES,
  languageSchema,
  runCodeResponseSchema,
} from '@kairos/types';

describe('shared language contracts', () => {
  it('maps every supported language to a Piston runtime string', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(PISTON_LANGUAGE_MAP[lang]).toBeTruthy();
      expect(LANGUAGE_LABELS[lang]).toBeTruthy();
    }
  });

  it('uses the Piston-specific aliases the executor expects', () => {
    expect(PISTON_LANGUAGE_MAP.cpp).toBe('c++');
    expect(PISTON_LANGUAGE_MAP.csharp).toBe('csharp.net');
    expect(PISTON_LANGUAGE_MAP.python).toBe('python');
    expect(PISTON_LANGUAGE_MAP.bash).toBe('bash');
  });

  it('accepts a valid language and rejects an unknown one', () => {
    expect(languageSchema.safeParse('python').success).toBe(true);
    expect(languageSchema.safeParse('cobol').success).toBe(false);
  });
});

describe('runCodeResponse contract', () => {
  it('parses a well-formed run result', () => {
    const parsed = runCodeResponseSchema.safeParse({
      status: 'accepted',
      testResults: [{ index: 0, passed: true, input: '1', expectedOutput: '1', actualOutput: '1' }],
      passedCount: 1,
      totalCount: 1,
      runtimeMs: 12,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an invalid status', () => {
    const parsed = runCodeResponseSchema.safeParse({
      status: 'exploded',
      testResults: [],
      passedCount: 0,
      totalCount: 0,
    });
    expect(parsed.success).toBe(false);
  });
});
