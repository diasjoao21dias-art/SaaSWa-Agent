import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/application/use-cases/use-clients';
import { CreateClientFormSchema, type CreateClientFormValues } from '@/application/dtos/client.dto';
import type { Client, ClientId } from '@/domain/entities/client.entity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

function useFilteredClients(clients: readonly Client[], search: string) {
  return useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q) ||
        (c.company ?? '').toLowerCase().includes(q),
    );
  }, [clients, search]);
}

function ClientForm({
  defaultValues,
  onSubmit,
  isLoading,
}: {
  defaultValues?: Partial<CreateClientFormValues>;
  onSubmit: (data: CreateClientFormValues) => void;
  isLoading: boolean;
}) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateClientFormValues>({
    resolver: zodResolver(CreateClientFormSchema),
    defaultValues: { status: 'active', ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Nome *</Label>
          <Input {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>E-mail *</Label>
          <Input type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Telefone</Label>
          <Input {...register('phone')} />
        </div>
        <div className="space-y-1.5">
          <Label>Empresa</Label>
          <Input {...register('company')} />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select defaultValue={defaultValues?.status ?? 'active'} onValueChange={(v) => setValue('status', v as 'active' | 'inactive')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  );
}

function ClientRow({
  client,
  onEdit,
  onDelete,
}: {
  client: Client;
  onEdit: (c: Client) => void;
  onDelete: (id: ClientId) => void;
}) {
  const initials = client.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <tr className="border-b border-border hover:bg-accent/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8"><AvatarFallback className="text-xs">{initials}</AvatarFallback></Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">{client.name}</p>
            <p className="text-xs text-muted-foreground">{client.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{client.phone ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{client.company ?? '—'}</td>
      <td className="px-4 py-3"><StatusBadge status={client.status} /></td>
      <td className="px-4 py-3 text-xs text-muted-foreground hidden xl:table-cell font-mono-tabular">{client.totalConversations}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground hidden xl:table-cell">{format(client.createdAt, 'dd/MM/yyyy', { locale: ptBR })}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => onEdit(client)}><Pencil className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => onDelete(client.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </td>
    </tr>
  );
}

export default function Clients() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const filtered = useFilteredClients(clients, search);

  const handleSubmit = (data: CreateClientFormValues) => {
    if (editing) {
      updateClient.mutate(
        { id: editing.id, input: data },
        { onSuccess: () => { setDialogOpen(false); setEditing(null); toast({ title: 'Cliente atualizado' }); } },
      );
    } else {
      createClient.mutate(data, {
        onSuccess: () => { setDialogOpen(false); toast({ title: 'Cliente criado' }); },
      });
    }
  };

  const handleDelete = (id: ClientId) => {
    if (!confirm('Remover este cliente?')) return;
    deleteClient.mutate(id, { onSuccess: () => toast({ title: 'Cliente removido' }) });
  };

  const handleEdit = (client: Client) => { setEditing(client); setDialogOpen(true); };
  const handleOpenChange = (open: boolean) => { setDialogOpen(open); if (!open) setEditing(null); };

  if (isLoading) return <div className="p-6"><div className="h-96 bg-card border border-card-border rounded-xl animate-pulse" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} cliente(s)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <ClientForm
              defaultValues={editing ? { name: editing.name, email: editing.email, phone: editing.phone ?? undefined, company: editing.company ?? undefined, status: editing.status } : undefined}
              onSubmit={handleSubmit}
              isLoading={createClient.isPending || updateClient.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar clientes…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Cliente', 'Telefone', 'Empresa', 'Status', 'Conversas', 'Cadastro', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-sm text-muted-foreground py-12">Nenhum cliente encontrado.</td></tr>
              ) : (
                filtered.map((c) => <ClientRow key={c.id} client={c} onEdit={handleEdit} onDelete={handleDelete} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
