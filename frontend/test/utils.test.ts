import { describe, expect, it } from 'vitest';

import { cn, formatNumber, formatRelativeTime, sleep } from '@/lib/utils';

describe('cn', () => {
  it('merges class names and dedupes conflicting tailwind utilities', () => {
    const isHidden = false;
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-sm', isHidden && 'hidden', 'font-bold')).toBe('text-sm font-bold');
  });
});

describe('formatNumber', () => {
  it('formats numbers with K/M suffixes', () => {
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(1000)).toBe('1K');
    expect(formatNumber(2_500_000)).toBe('2.5M');
  });
});

describe('formatRelativeTime', () => {
  it('describes recent timestamps relatively', () => {
    expect(formatRelativeTime(new Date())).toBe('just now');
    expect(formatRelativeTime(new Date(Date.now() - 5 * 60_000))).toBe('5m ago');
    expect(formatRelativeTime(new Date(Date.now() - 3 * 3_600_000))).toBe('3h ago');
  });
});

describe('sleep', () => {
  it('resolves after the given delay', async () => {
    const start = Date.now();
    await sleep(20);
    expect(Date.now() - start).toBeGreaterThanOrEqual(15);
  });
});
