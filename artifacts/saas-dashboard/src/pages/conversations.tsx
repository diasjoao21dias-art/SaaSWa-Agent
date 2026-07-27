/**
 * Conversations — lista paginada de conversas com filtros.
 * Dados da API com fallback em mock quando offline.
 */
import { useState } from 'react';
import {
  useListConversations, useUpdateConversation,
  getListConversationsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MOCK_CONVERSATIONS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const CHANNEL_COLORS: Record<string, string> = {
  WhatsApp: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Web Chat': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Email:     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  SMS:       'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function Conversations() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: apiConvs = [], isLoading } = useListConversations(
    statusFilter ? { status: statusFilter } : undefined
  );
  const updateConversation = useUpdateConversation();
  const queryClient = useQueryClient();

  const conversations = apiConvs.length ? apiConvs : MOCK_CONVERSATIONS;

  const filtered = conversations.filter(c => {
    const q = search.toLowerCase();
    return (
      c.clientName?.toLowerCase().includes(q) ||
      c.agentName?.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  });

  const statusFiltered = statusFilter
    ? filtered.filter(c => c.status === statusFilter)
    : filtered;

  const handleStatusChange = (id: string, status: string) => {
    updateConversation.mutate(
      { id, data: { status } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() }) },
    );
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Conversas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{statusFiltered.length} conversa(s)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar conversas…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-conversations"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Todos status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="open">Aberta</SelectItem>
            <SelectItem value="closed">Fechada</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Cliente', 'Agente', 'Canal', 'Status', 'Última mensagem', 'Não lidas', 'Atualizada', 'Ação'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {statusFiltered.map(conv => (
                <tr
                  key={conv.id}
                  className="hover:bg-accent/30 transition-colors"
                  data-testid={`conversation-${conv.id}`}
                >
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                    {conv.clientName || 'Desconhecido'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {conv.agentName || 'Sem agente'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      CHANNEL_COLORS[conv.channel] ?? 'bg-muted text-muted-foreground',
                    )}>
                      {conv.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={conv.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[220px] truncate">
                    {conv.lastMessage}
                  </td>
                  <td className="px-4 py-3">
                    {conv.unreadCount && conv.unreadCount > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-primary text-primary-foreground text-xs font-bold px-1.5">
                        {conv.unreadCount}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                    {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true, locale: ptBR })}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={conv.status}
                      onValueChange={s => handleStatusChange(conv.id, s)}
                    >
                      <SelectTrigger className="h-7 text-xs w-28 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Aberta</SelectItem>
                        <SelectItem value="closed">Fechada</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {statusFiltered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-2 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
