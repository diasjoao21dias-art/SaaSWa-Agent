/**
 * Plans — pricing cards com lista de features, contagem de assinantes e CRUD.
 */
import { useState } from 'react';
import {
  useListPlans, useCreatePlan, useUpdatePlan, getListPlansQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Check, Users, CreditCard, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MOCK_PLANS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const PLAN_ACCENT: Record<string, string> = {
  Starter:    'border-sky-200 dark:border-sky-800',
  Pro:        'border-primary ring-1 ring-primary/30',
  Enterprise: 'border-violet-200 dark:border-violet-800',
};
const PLAN_BADGE: Record<string, string> = {
  Pro: 'bg-primary text-primary-foreground',
};

export default function Plans() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const { data: apiPlans = [], isLoading } = useListPlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const plans = apiPlans.length ? apiPlans : MOCK_PLANS;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const features = (fd.get('features') as string).split('\n').filter(f => f.trim());
    const data = {
      name: fd.get('name') as string,
      description: fd.get('description') as string,
      price: Number(fd.get('price')),
      interval: fd.get('interval') as string,
      maxAgents: Number(fd.get('maxAgents')) || undefined,
      maxConversations: Number(fd.get('maxConversations')) || undefined,
      features,
      isActive: fd.get('isActive') === 'on',
    };
    if (editingPlan) {
      updatePlan.mutate({ id: editingPlan.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPlansQueryKey() });
          setDialogOpen(false); setEditingPlan(null);
          toast({ title: 'Plano atualizado' });
        },
      });
    } else {
      createPlan.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPlansQueryKey() });
          setDialogOpen(false);
          toast({ title: 'Plano criado' });
        },
      });
    }
  };

  if (isLoading) return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1,2,3].map(i => <div key={i} className="h-96 bg-card border border-card-border rounded-xl animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Planos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie os planos de assinatura</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) setEditingPlan(null); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-plan">
              <Plus className="w-4 h-4 mr-2" /> Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div><Label>Nome *</Label><Input name="name" defaultValue={editingPlan?.name} required /></div>
              <div><Label>Descrição</Label><Textarea name="description" rows={2} defaultValue={editingPlan?.description} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Preço (R$) *</Label><Input name="price" type="number" step="0.01" defaultValue={editingPlan?.price} required /></div>
                <div>
                  <Label>Intervalo</Label>
                  <Select name="interval" defaultValue={editingPlan?.interval || 'month'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Mensal</SelectItem>
                      <SelectItem value="year">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Máx. Agentes</Label><Input name="maxAgents" type="number" defaultValue={editingPlan?.maxAgents} /></div>
                <div><Label>Máx. Conversas</Label><Input name="maxConversations" type="number" defaultValue={editingPlan?.maxConversations} /></div>
              </div>
              <div>
                <Label>Features (uma por linha)</Label>
                <Textarea name="features" rows={4} defaultValue={editingPlan?.features?.join('\n')} placeholder="Feature 1&#10;Feature 2" />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="isActive" name="isActive" defaultChecked={editingPlan?.isActive ?? true} />
                <Label htmlFor="isActive">Ativo</Label>
              </div>
              <Button type="submit" className="w-full" disabled={createPlan.isPending || updatePlan.isPending}>
                {editingPlan ? 'Salvar' : 'Criar'} Plano
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={cn(
              'relative bg-card border-2 rounded-xl p-6 flex flex-col hover:shadow-lg transition-shadow',
              PLAN_ACCENT[plan.name] ?? 'border-card-border',
            )}
            data-testid={`plan-${plan.id}`}
          >
            {/* Popular badge */}
            {PLAN_BADGE[plan.name] && (
              <span className={cn('absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold', PLAN_BADGE[plan.name])}>
                <Star className="w-3 h-3" /> Popular
              </span>
            )}

            {/* Header */}
            <div className="mb-5">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                {!plan.isActive && (
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Inativo</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 leading-snug">{plan.description}</p>
            </div>

            {/* Price */}
            <div className="mb-5">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold font-mono-tabular text-foreground">
                  R${plan.price.toLocaleString('pt-BR')}
                </span>
                <span className="text-sm text-muted-foreground">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
              </div>
              {plan.subscriberCount !== undefined && (
                <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{plan.subscriberCount} assinante(s)</span>
                </div>
              )}
            </div>

            {/* Features */}
            <ul className="flex-1 space-y-2 mb-6">
              {plan.maxAgents != null && (
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Até {plan.maxAgents} agentes</span>
                </li>
              )}
              {plan.maxConversations != null && (
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Até {plan.maxConversations.toLocaleString('pt-BR')} conversas/mês</span>
                </li>
              )}
              {plan.maxAgents == null && plan.maxConversations == null && (
                <>
                  <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /><span>Agentes ilimitados</span></li>
                  <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /><span>Conversas ilimitadas</span></li>
                </>
              )}
              {plan.features?.map((f: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>

            <Button
              variant={PLAN_BADGE[plan.name] ? 'default' : 'outline'}
              className="w-full"
              onClick={() => { setEditingPlan(plan); setDialogOpen(true); }}
              data-testid={`button-edit-${plan.id}`}
            >
              <CreditCard className="w-4 h-4 mr-2" /> Editar Plano
            </Button>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 bg-card border border-card-border rounded-xl gap-2">
          <CreditCard className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhum plano encontrado</p>
        </div>
      )}
    </div>
  );
}
