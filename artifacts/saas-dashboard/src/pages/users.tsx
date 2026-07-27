import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/application/use-cases/use-users';
import { CreateUserFormSchema, type CreateUserFormValues } from '@/application/dtos/user.dto';
import type { User, UserId } from '@/domain/entities/user.entity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', member: 'Membro', viewer: 'Visualizador' };

function UserForm({
  defaultValues,
  onSubmit,
  isLoading,
}: {
  defaultValues?: Partial<CreateUserFormValues>;
  onSubmit: (data: CreateUserFormValues) => void;
  isLoading: boolean;
}) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateUserFormValues>({
    resolver: zodResolver(CreateUserFormSchema),
    defaultValues: { status: 'active', role: 'member', ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Papel</Label>
          <Select defaultValue={defaultValues?.role ?? 'member'} onValueChange={(v) => setValue('role', v as CreateUserFormValues['role'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Membro</SelectItem>
              <SelectItem value="viewer">Visualizador</SelectItem>
            </SelectContent>
          </Select>
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
      <Button type="submit" disabled={isLoading} className="w-full">{isLoading ? 'Salvando…' : 'Salvar'}</Button>
    </form>
  );
}

export default function Users() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const { toast } = useToast();

  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const handleSubmit = (data: CreateUserFormValues) => {
    if (editing) {
      updateUser.mutate({ id: editing.id, input: data }, {
        onSuccess: () => { setDialogOpen(false); setEditing(null); toast({ title: 'Usuário atualizado' }); },
      });
    } else {
      createUser.mutate(data, { onSuccess: () => { setDialogOpen(false); toast({ title: 'Usuário criado' }); } });
    }
  };

  const handleDelete = (id: UserId) => {
    if (!confirm('Remover este usuário?')) return;
    deleteUser.mutate(id, { onSuccess: () => toast({ title: 'Usuário removido' }) });
  };

  if (isLoading) return <div className="p-6"><div className="h-96 bg-card border border-card-border rounded-xl animate-pulse" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Usuários</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{users.length} usuário(s)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Novo Usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle></DialogHeader>
            <UserForm
              defaultValues={editing ? { name: editing.name, email: editing.email, role: editing.role, status: editing.status } : undefined}
              onSubmit={handleSubmit}
              isLoading={createUser.isPending || updateUser.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Usuário', 'Papel', 'Status', 'Último Login', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const initials = u.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <tr key={u.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8"><AvatarFallback className="text-xs">{initials}</AvatarFallback></Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-muted-foreground">{ROLE_LABELS[u.role] ?? u.role}</td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDistanceToNow(u.lastLogin, { addSuffix: true, locale: ptBR })}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setEditing(u); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => handleDelete(u.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
