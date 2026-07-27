/**
 * Users — tabela de usuários da plataforma com convite e edição.
 */
import { useState } from 'react';
import {
  useListUsers, useCreateUser, useUpdateUser, getListUsersQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Search, Pencil, UserCog } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { MOCK_USERS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const ROLE_STYLES: Record<string, string> = {
  admin:  'bg-primary/10 text-primary',
  member: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  viewer: 'bg-muted text-muted-foreground',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin', member: 'Membro', viewer: 'Visualizador',
};

export default function Users() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data: apiUsers = [], isLoading } = useListUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const users = apiUsers.length ? apiUsers : MOCK_USERS;

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      role: fd.get('role') as string,
      status: fd.get('status') as string,
      password: fd.get('password') as string,
    };
    if (editingUser) {
      const { password, ...updateData } = data;
      updateUser.mutate({ id: editingUser.id, data: updateData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          setDialogOpen(false); setEditingUser(null);
          toast({ title: 'Usuário atualizado' });
        },
      });
    } else {
      createUser.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          setDialogOpen(false);
          toast({ title: 'Usuário convidado' });
        },
      });
    }
  };

  if (isLoading) return (
    <div className="p-6"><div className="h-96 bg-card border border-card-border rounded-xl animate-pulse" /></div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Usuários</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} usuário(s)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) setEditingUser(null); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-invite-user">
              <Plus className="w-4 h-4 mr-2" /> Convidar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Editar Usuário' : 'Convidar Usuário'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Nome *</Label><Input name="name" defaultValue={editingUser?.name} required /></div>
              <div><Label>E-mail *</Label><Input name="email" type="email" defaultValue={editingUser?.email} required /></div>
              <div>
                <Label>Função</Label>
                <Select name="role" defaultValue={editingUser?.role || 'member'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select name="status" defaultValue={editingUser?.status || 'active'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!editingUser && (
                <div><Label>Senha *</Label><Input name="password" type="password" required /></div>
              )}
              <Button type="submit" className="w-full" disabled={createUser.isPending || updateUser.isPending}>
                {editingUser ? 'Salvar' : 'Convidar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search" placeholder="Buscar usuários…" value={search}
          onChange={e => setSearch(e.target.value)} className="pl-9"
          data-testid="input-search-users"
        />
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Usuário', 'E-mail', 'Função', 'Status', 'Último acesso', 'Ações'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(user => {
                const initials = user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <tr key={user.id} className="hover:bg-accent/30 transition-colors" data-testid={`user-${user.id}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground whitespace-nowrap">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
                        ROLE_STYLES[user.role] ?? 'bg-muted text-muted-foreground',
                      )}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {user.lastLogin ? format(new Date(user.lastLogin), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Nunca'}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs"
                        onClick={() => { setEditingUser(user); setDialogOpen(true); }}
                        data-testid={`button-edit-${user.id}`}>
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <UserCog className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
