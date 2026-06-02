import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthenticatedFetch } from '@/hooks/use-authenticated-fetch';
import type {
  AppendMessagesBody,
  ChatSessionDetail,
  ChatSessionSummary,
  CreateChatBody,
  ListChatsResult,
} from '@kairos/types';

// ── Query keys ────────────────────────────────────────────────────────────────

export const CHATS_QUERY_KEY = 'chats' as const;

export interface ListChatsParams {
  q?: string;
  source?: 'assistant' | 'solver' | 'playground';
  page?: number;
  limit?: number;
}

function buildListPath(params: ListChatsParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.source) search.set('source', params.source);
  if (params.page != null) search.set('page', String(params.page));
  if (params.limit != null) search.set('limit', String(params.limit));
  const query = search.toString();
  return query ? `/api/v1/chats?${query}` : '/api/v1/chats';
}

// ── Imperative client (usable outside react-query) ─────────────────────────────

export interface ChatsApi {
  listChats: (params?: ListChatsParams) => Promise<ListChatsResult>;
  getChat: (id: string) => Promise<ChatSessionDetail>;
  createChat: (body: CreateChatBody) => Promise<ChatSessionDetail>;
  renameChat: (id: string, title: string) => Promise<ChatSessionSummary>;
  deleteChat: (id: string) => Promise<void>;
  appendMessages: (id: string, body: AppendMessagesBody) => Promise<ChatSessionDetail>;
}

/**
 * Returns a stable set of imperative helpers for the chat-history API, each
 * authenticated via the current Clerk token. Use this when you need to call the
 * API outside of a react-query hook (e.g. persisting a streamed turn).
 */
export function useChatsApi(): ChatsApi {
  const authedFetch = useAuthenticatedFetch();

  return useMemo<ChatsApi>(
    () => ({
      listChats: (params = {}) => authedFetch<ListChatsResult>(buildListPath(params)),
      getChat: (id) => authedFetch<ChatSessionDetail>(`/api/v1/chats/${id}`),
      createChat: (body) =>
        authedFetch<ChatSessionDetail>('/api/v1/chats', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      renameChat: (id, title) =>
        authedFetch<ChatSessionSummary>(`/api/v1/chats/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ title }),
        }),
      deleteChat: (id) =>
        authedFetch<void>(`/api/v1/chats/${id}`, { method: 'DELETE' }),
      appendMessages: (id, body) =>
        authedFetch<ChatSessionDetail>(`/api/v1/chats/${id}/messages`, {
          method: 'POST',
          body: JSON.stringify(body),
        }),
    }),
    [authedFetch],
  );
}

// ── React-query hooks ──────────────────────────────────────────────────────────

/** Live, searchable list of the user's chat sessions. */
export function useChats(params: ListChatsParams = {}) {
  const { listChats } = useChatsApi();
  return useQuery({
    queryKey: [CHATS_QUERY_KEY, 'list', params],
    queryFn: () => listChats(params),
    staleTime: 10_000,
  });
}

/** A single chat session with its full message history. */
export function useChat(id: string | null | undefined) {
  const { getChat } = useChatsApi();
  return useQuery({
    queryKey: [CHATS_QUERY_KEY, 'detail', id],
    queryFn: () => getChat(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateChat() {
  const { createChat } = useChatsApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateChatBody) => createChat(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, 'list'] });
    },
  });
}

export function useRenameChat() {
  const { renameChat } = useChatsApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => renameChat(id, title),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, 'list'] });
      void queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, 'detail', id] });
    },
  });
}

export function useDeleteChat() {
  const { deleteChat } = useChatsApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteChat(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, 'list'] });
    },
  });
}

export function useAppendMessages() {
  const { appendMessages } = useChatsApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: AppendMessagesBody }) =>
      appendMessages(id, body),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, 'list'] });
      void queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, 'detail', id] });
    },
  });
}

/** Invalidate the chat list (e.g. after persisting a streamed turn manually). */
export function useInvalidateChats(): () => void {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, 'list'] });
  }, [queryClient]);
}
