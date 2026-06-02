import { describe, expect, it } from 'vitest';

import { parseChunkPayload, parseSSEChunk } from '@/lib/chat-stream';

describe('parseSSEChunk', () => {
  it('extracts data payloads from SSE frames', () => {
    const raw = 'data: {"type":"token","content":"Hi"}\n\ndata: {"type":"done","model":"x"}\n\n';
    expect(parseSSEChunk(raw)).toEqual([
      '{"type":"token","content":"Hi"}',
      '{"type":"done","model":"x"}',
    ]);
  });

  it('normalises CRLF line endings', () => {
    const raw = 'data: {"type":"token","content":"a"}\r\n\r\n';
    expect(parseSSEChunk(raw)).toEqual(['{"type":"token","content":"a"}']);
  });

  it('drops the [DONE] sentinel and empty frames', () => {
    const raw = 'data: [DONE]\n\n\n\n';
    expect(parseSSEChunk(raw)).toEqual([]);
  });

  it('joins multi-line data payloads', () => {
    const raw = 'data: line-one\ndata: line-two\n\n';
    expect(parseSSEChunk(raw)).toEqual(['line-one\nline-two']);
  });
});

describe('parseChunkPayload', () => {
  it('parses a valid JSON chunk', () => {
    expect(parseChunkPayload('{"type":"token","content":"Hi"}')).toEqual({
      type: 'token',
      content: 'Hi',
    });
  });

  it('returns null for malformed JSON', () => {
    expect(parseChunkPayload('not json')).toBeNull();
  });
});
