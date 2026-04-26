import { getApiBaseUrl } from './dev-service-urls';

export interface ApiClientOptions extends RequestInit {
  token?: string | null;
  baseUrl?: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiFetch<T>(
  path: string,
  { token, baseUrl, headers, ...init }: ApiClientOptions = {},
): Promise<T> {
  const url = `${baseUrl ?? getApiBaseUrl()}${path}`;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...((headers as Record<string, string>) ?? {}),
  };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...init, headers: finalHeaders });

  if (!response.ok) {
    let errorBody: { error?: { code?: string; message?: string; details?: unknown } } = {};
    try {
      errorBody = await response.json();
    } catch {
      // body is not JSON
    }

    throw new ApiError(
      errorBody.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      errorBody.error?.code ?? 'UNKNOWN_ERROR',
      errorBody.error?.details,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const json = (await response.json()) as { data: T };
  return json.data;
}
