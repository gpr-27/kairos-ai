import { afterEach, describe, expect, it, vi } from 'vitest';

import { getApiBaseUrl, getMlBaseUrl } from '@/config';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('config service URLs', () => {
  it('uses the configured base URLs on localhost (no Vite proxy)', () => {
    // jsdom default location host is "localhost" → direct URLs.
    expect(getApiBaseUrl()).toBe('http://localhost:4000');
    expect(getMlBaseUrl()).toBe('http://localhost:8000');
  });

  it('same-origins to the Vite proxy when served from a non-localhost host', () => {
    vi.stubGlobal('window', {
      location: { hostname: 'demo.ngrok.io', origin: 'https://demo.ngrok.io' },
    });

    // Proxy routing only applies in dev; if DEV is false this falls back to direct URLs.
    if (import.meta.env.DEV) {
      expect(getApiBaseUrl()).toBe('https://demo.ngrok.io/_kairos/api');
      expect(getMlBaseUrl()).toBe('https://demo.ngrok.io/_kairos/ml');
    } else {
      expect(getApiBaseUrl()).toBe('http://localhost:4000');
    }
  });
});
