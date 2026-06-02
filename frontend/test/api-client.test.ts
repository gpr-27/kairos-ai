import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, apiFetch } from '@/lib/api-client';

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiFetch', () => {
  it('unwraps the { data } envelope on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ data: { id: '1', title: 'Two Sum' } })),
    );

    const result = await apiFetch<{ id: string; title: string }>('/problems/1');
    expect(result).toEqual({ id: '1', title: 'Two Sum' });
  });

  it('returns undefined for 204 No Content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, { status: 204 })));
    const result = await apiFetch('/problems/1', { method: 'DELETE' });
    expect(result).toBeUndefined();
  });

  it('attaches a Bearer token when provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: {} }));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/users/me', { token: 'jwt-123' });

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer jwt-123');
  });

  it('throws a typed ApiError on a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(
            { error: { code: 'NOT_FOUND', message: 'Problem not found' } },
            { ok: false, status: 404 },
          ),
        ),
    );

    await expect(apiFetch('/problems/missing')).rejects.toBeInstanceOf(ApiError);
    await expect(apiFetch('/problems/missing')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Problem not found',
    });
  });
});
