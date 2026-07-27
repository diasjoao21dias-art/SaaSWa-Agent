/**
 * Agents — grid de cards de agentes (IA + humanos).
 * Cada card mostra avatar, status, métricas e ações de editar/deletar.
 */
import { useState } from 'react';
import {
  useListAgents, useCreateAgent, useUpdateAgent,
  useDeleteAgent, getListAgentsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Search, Pencil, Trash2, MessageSquare, CheckCircle, Star, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MOCK_AGENTS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const STATUS_DOT: Record<string, string> = {
  online:  'bg-emerald-500',
  offline: 'bg-gray-400',
  busy:    'bg-amber-500',
};

export default function Agents() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);

  const { data: apiAgents = [], isLoading } = useListAgents();
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const agents = apiAgents.length ? apiAgents : MOCK_AGENTS;

  const filtered = agents.filter(a => {
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      role: fd.get('role') as string,
      status: fd.get('status') as string,
    };
    if (editingAgent) {
      updateAgent.mutate({ id: editingAgent.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAgentsQueryKey() });
          setDialogOpen(false); setEditingAgent(null);
          toast({ title: 'Agente atualizado' });
        },
      });
    } else {
      createAgent.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAgentsQueryKey() });
          setDialogOpen(false);
          toast({ title: 'Agente criado' });
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remover este agente?')) return;
    deleteAgent.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAgentsQueryKey() });
        toast({ title: 'Agente removido' });
      },
    });
  };

  if (isLoading) return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 bg-card border border-card-border rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Agentes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} agente(s)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) setEditingAgent(null); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-agent">
              <Plus className="w-4 h-4 mr-2" /> Novo Agente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAgent ? 'Editar Agente' : 'Novo Agente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Nome *</Label><Input name="name" defaultValue={editingAgent?.name} required /></div>
              <div><Label>E-mail *</Label><Input name="email" type="email" defaultValue={editingAgent?.email} required /></div>
              <div><Label>Função</Label><Input name="role" defaultValue={editingAgent?.role} placeholder="Agent, Senior Agent, AI Agent…" /></div>
              <div>
                <Label>Status</Label>
                <Select name="status" defaultValue={editingAgent?.status || 'offline'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="busy">Ocupado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createAgent.isPending || updateAgent.isPending}>
                {editingAgent ? 'Atualizar' : 'Criar'} Agente
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search" placeholder="Buscar agentes…" value={search}
          onChange={e => setSearch(e.target.value)} className="pl-9"
          data-testid="input-search-agents"
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(agent => {
          const initials = agent.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
          const isBot = agent.role?.toLowerCase().includes('bot') || agent.role?.toLowerCase().includes('ia') || agent.role?.toLowerCase().includes('ai');

          return (
            <div
              key={agent.id}
              className="bg-card border border-card-border rounded-xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
              data-testid={`agent-${agent.id}`}
            >
              {/* Top */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-11 h-11">
                      <AvatarFallback className={cn('text-sm font-bold', isBot ? 'bg-primary/15 text-primary' : 'bg-secondary')}>
                        {isBot ? <Bot className="w-5 h-5" /> : initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className={cn(
                      'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card',
                      STATUS_DOT[agent.status] ?? 'bg-gray-400',
                    )} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground leading-tight">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{agent.role}</p>
                  </div>
                </div>
                <StatusBadge status={agent.status} />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/40">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-bold font-mono-tabular text-foreground">{agent.activeConversations || 0}</span>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">Ativas</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/40">
                  <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-bold font-mono-tabular text-foreground">
                    {(agent.totalAttendances || 0).toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">Atend.</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/40">
                  <Star className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-bold font-mono-tabular text-foreground">
                    {agent.satisfactionScore != null ? `${agent.satisfactionScore}%` : '—'}
                  </span>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">Satisf.</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1.5"
                  onClick={() => { setEditingAgent(agent); setDialogOpen(true); }}
                  data-testid={`button-edit-${agent.id}`}>
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(agent.id)}
                  data-testid={`button-delete-${agent.id}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 bg-card border border-card-border rounded-xl gap-2">
          <Bot className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhum agente encontrado</p>
        </div>
      )}
    </div>
  );
}
