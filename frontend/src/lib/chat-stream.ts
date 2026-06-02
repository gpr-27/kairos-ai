/**
 * Shared SSE parsing for the AI Coach chat stream.
 *
 * The ML service streams `text/event-stream` frames whose `data:` payloads are
 * JSON chunks of the form `{ type: 'token' | 'done' | 'error', ... }`.
 */

export interface ChatStreamChunk {
  type?: 'token' | 'done' | 'error' | string;
  content?: string;
  error?: string;
  model?: string;
}

/** Split a raw SSE buffer into its `data:` payload strings (drops `[DONE]`). */
export function parseSSEChunk(raw: string): string[] {
  const payloads: string[] = [];
  const normalised = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const events = normalised.split('\n\n');
  for (const evt of events) {
    const dataLines = evt
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim());
    if (dataLines.length === 0) continue;
    const payload = dataLines.join('\n');
    if (!payload || payload === '[DONE]') continue;
    payloads.push(payload);
  }
  return payloads;
}

/** Safely parse a single SSE payload into a typed chunk (null if not JSON). */
export function parseChunkPayload(payload: string): ChatStreamChunk | null {
  try {
    return JSON.parse(payload) as ChatStreamChunk;
  } catch {
    return null;
  }
}
