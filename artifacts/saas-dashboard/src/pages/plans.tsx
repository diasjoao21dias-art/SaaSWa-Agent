import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan } from '@/application/use-cases/use-plans';
import { CreatePlanFormSchema, type CreatePlanFormValues } from '@/application/dtos/plan.dto';
import type { Plan, PlanId } from '@/domain/entities/plan.entity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Check, Users, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function PlanForm({
  defaultValues,
  onSubmit,
  isLoading,
}: {
  defaultValues?: Partial<CreatePlanFormValues>;
  onSubmit: (data: CreatePlanFormValues) => void;
  isLoading: boolean;
}) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreatePlanFormValues>({
    resolver: zodResolver(CreatePlanFormSchema),
    defaultValues: { interval: 'month', isActive: true, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="space-y-1.5">
        <Label>Nome *</Label>
        <Input {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Descrição</Label>
        <Textarea rows={2} {...register('description')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Preço (R$) *</Label>
          <Input type="number" step="0.01" {...register('price')} />
          {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Intervalo</Label>
          <Select defaultValue={defaultValues?.interval ?? 'month'} onValueChange={(v) => setValue('interval', v as 'month' | 'year')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mensal</SelectItem>
              <SelectItem value="year">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Máx. Agentes</Label>
          <Input type="number" placeholder="Ilimitado" {...register('maxAgents')} />
        </div>
        <div className="space-y-1.5">
          <Label>Máx. Conversas</Label>
          <Input type="number" placeholder="Ilimitado" {...register('maxConversations')} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Features (uma por linha)</Label>
        <Textarea rows={4} placeholder="Feature 1&#10;Feature 2" {...register('features')} />
      </div>
      <div className="flex items-center gap-2">
        <Switch id="isActive" defaultChecked={defaultValues?.isActive ?? true} onCheckedChange={(v) => setValue('isActive', v)} />
        <Label htmlFor="isActive">Ativo</Label>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">{isLoading ? 'Salvando…' : 'Salvar'}</Button>
    </form>
  );
}

function PlanCard({ plan, onEdit, onDelete }: { plan: Plan; onEdit: (p: Plan) => void; onDelete: (id: PlanId) => void }) {
  return (
    <div className={cn('bg-card border rounded-xl p-5 space-y-4 relative', plan.isActive ? 'border-card-border' : 'border-border opacity-60')}>
      {!plan.isActive && <Badge variant="secondary" className="absolute top-3 right-3 text-[10px]">Inativo</Badge>}
      <div>
        <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground">R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
        <span className="text-xs text-muted-foreground">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{plan.maxAgents ?? '∞'} agentes</span>
        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{plan.maxConversations?.toLocaleString('pt-BR') ?? '∞'} conv.</span>
      </div>
      <ul className="space-y-1.5">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="w-3 h-3 text-emerald-500 shrink-0" />{f}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">{plan.subscriberCount} assinante(s)</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => onEdit(plan)}><Pencil className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => onDelete(plan.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
    </div>
  );
}

export default function Plans() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const { toast } = useToast();

  const { data: plans = [], isLoading } = usePlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  const handleSubmit = (data: CreatePlanFormValues) => {
    const features = data.features?.split('\n').filter(Boolean) ?? [];
    const input = { ...data, features };
    if (editing) {
      updatePlan.mutate({ id: editing.id, input }, {
        onSuccess: () => { setDialogOpen(false); setEditing(null); toast({ title: 'Plano atualizado' }); },
      });
    } else {
      createPlan.mutate(input, { onSuccess: () => { setDialogOpen(false); toast({ title: 'Plano criado' }); } });
    }
  };

  const handleDelete = (id: PlanId) => {
    if (!confirm('Remover este plano?')) return;
    deletePlan.mutate(id, { onSuccess: () => toast({ title: 'Plano removido' }) });
  };

  if (isLoading) return <div className="p-6"><div className="h-96 bg-card border border-card-border rounded-xl animate-pulse" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Planos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie os planos de assinatura</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Novo Plano</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Editar Plano' : 'Novo Plano'}</DialogTitle></DialogHeader>
            <PlanForm
              defaultValues={editing ? { name: editing.name, description: editing.description, price: editing.price, interval: editing.interval, maxAgents: editing.maxAgents ?? undefined, maxConversations: editing.maxConversations ?? undefined, features: editing.features.join('\n'), isActive: editing.isActive } : undefined}
              onSubmit={handleSubmit}
              isLoading={createPlan.isPending || updatePlan.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => <PlanCard key={p.id} plan={p} onEdit={(plan) => { setEditing(plan); setDialogOpen(true); }} onDelete={handleDelete} />)}
      </div>
    </div>
  );
}
