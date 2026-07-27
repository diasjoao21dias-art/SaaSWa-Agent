import { useMemo, useState } from 'react';
import { useConversations, useUpdateConversationStatus } from '@/application/use-cases/use-conversations';
import type { Conversation, ConversationStatus } from '@/domain/entities/conversation.entity';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const CHANNEL_COLORS: Record<string, string> = {
  WhatsApp: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Web Chat': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Email: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  SMS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function useFilteredConversations(conversations: readonly Conversation[], search: string) {
  return useMemo(() => {
    if (!search) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.clientName.toLowerCase().includes(q) ||
        c.agentName.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q),
    );
  }, [conversations, search]);
}

function ConversationRow({
  conversation,
  onStatusChange,
}: {
  conversation: Conversation;
  onStatusChange: (id: string, status: ConversationStatus) => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-accent/30 transition-colors border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{conversation.clientName}</span>
          {conversation.unreadCount > 0 && (
            <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">{conversation.unreadCount}</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{conversation.lastMessage}</p>
      </div>
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', CHANNEL_COLORS[conversation.channel] ?? '')}>
          {conversation.channel}
        </span>
        <span className="text-xs text-muted-foreground">{conversation.agentName}</span>
      </div>
      <div className="shrink-0 flex items-center gap-3">
        <StatusBadge status={conversation.status} />
        <Select value={conversation.status} onValueChange={(v) => onStatusChange(conversation.id, v as ConversationStatus)}>
          <SelectTrigger className="h-7 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Aberta</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="closed">Fechada</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-[11px] text-muted-foreground whitespace-nowrap hidden md:block">
          {formatDistanceToNow(conversation.updatedAt, { addSuffix: true, locale: ptBR })}
        </span>
      </div>
    </div>
  );
}

export default function Conversations() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | ''>('');

  const { data: conversations = [], isLoading } = useConversations(
    statusFilter ? { status: statusFilter } : undefined,
  );
  const { mutate: updateStatus } = useUpdateConversationStatus();

  const filtered = useFilteredConversations(conversations, search);

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 bg-card border border-card-border rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Conversas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} conversa(s)</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar conversas…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ConversationStatus | '')}>
          <SelectTrigger className="w-40">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Todos status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="open">Aberta</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="closed">Fechada</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">Nenhuma conversa encontrada.</p>
        ) : (
          filtered.map((c) => (
            <ConversationRow
              key={c.id}
              conversation={c}
              onStatusChange={(id, status) => updateStatus({ id: id as Conversation['id'], status })}
            />
          ))
        )}
      </div>
    </div>
  );
}
