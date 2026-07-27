import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useConversationRepository } from '@/infrastructure/di/repository.context';
import type { ConversationId, ConversationStatus } from '@/domain/entities/conversation.entity';
import type { ListConversationsFilter } from '@/domain/repositories/conversation.repository';

const QUERY_KEY = 'conversations';

export function useConversations(filter?: ListConversationsFilter) {
  const repo = useConversationRepository();
  return useQuery({
    queryKey: [QUERY_KEY, filter],
    queryFn: () => repo.list(filter),
  });
}

export function useUpdateConversationStatus() {
  const repo = useConversationRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: ConversationId; status: ConversationStatus }) =>
      repo.updateStatus(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
