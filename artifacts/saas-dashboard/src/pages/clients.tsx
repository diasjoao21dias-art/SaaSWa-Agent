/**
 * Clients — tabela de clientes com busca, add e edit.
 */
import { useState } from 'react';
import {
  useListClients, useCreateClient, useUpdateClient,
  useDeleteClient, getListClientsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { MOCK_CLIENTS } from '@/lib/mock-data';

export default function Clients() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  const { data: apiClients = [], isLoading } = useListClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const clients = apiClients.length ? apiClients : MOCK_CLIENTS;

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q)
    );
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      phone: fd.get('phone') as string,
      company: fd.get('company') as string,
      status: fd.get('status') as string,
    };
    if (editingClient) {
      updateClient.mutate({ id: editingClient.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
          setDialogOpen(false); setEditingClient(null);
          toast({ title: 'Cliente atualizado' });
        },
      });
    } else {
      createClient.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
          setDialogOpen(false);
          toast({ title: 'Cliente criado' });
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remover este cliente?')) return;
    deleteClient.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        toast({ title: 'Cliente removido' });
      },
    });
  };

  if (isLoading) return (
    <div className="p-6"><div className="h-96 bg-card border border-card-border rounded-xl animate-pulse" /></div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} cliente(s)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) setEditingClient(null); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-client">
              <Plus className="w-4 h-4 mr-2" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Nome *</Label><Input name="name" defaultValue={editingClient?.name} required /></div>
              <div><Label>E-mail</Label><Input name="email" type="email" defaultValue={editingClient?.email} /></div>
              <div><Label>Telefone</Label><Input name="phone" defaultValue={editingClient?.phone} /></div>
              <div><Label>Empresa</Label><Input name="company" defaultValue={editingClient?.company} /></div>
              <div>
                <Label>Status</Label>
                <Select name="status" defaultValue={editingClient?.status || 'active'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createClient.isPending || updateClient.isPending}>
                {editingClient ? 'Atualizar' : 'Criar'} Cliente
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search" placeholder="Buscar clientes…" value={search}
          onChange={e => setSearch(e.target.value)} className="pl-9"
          data-testid="input-search-clients"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Cliente', 'E-mail', 'Telefone', 'Empresa', 'Status', 'Conversas', 'Cadastro', 'Ações'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(client => {
                const initials = client.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <tr key={client.id} className="hover:bg-accent/30 transition-colors" data-testid={`client-${client.id}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-7 h-7 shrink-0">
                          <AvatarFallback className="text-[10px] font-semibold">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground whitespace-nowrap">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{client.email || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{client.phone || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{client.company || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={client.status} /></td>
                    <td className="px-4 py-3 font-mono-tabular text-muted-foreground">{client.totalConversations || 0}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {format(new Date(client.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => { setEditingClient(client); setDialogOpen(true); }}
                          data-testid={`button-edit-${client.id}`}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => handleDelete(client.id)}
                          data-testid={`button-delete-${client.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <Users className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
