import { useIntegrations, useToggleIntegration } from '@/application/use-cases/use-integrations';
import type { Integration, IntegrationType } from '@/domain/entities/integration.entity';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Bot, CreditCard, Slack, Webhook, Building2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const TYPE_ICONS: Record<IntegrationType, LucideIcon> = {
  whatsapp: MessageSquare,
  openai: Bot,
  stripe: CreditCard,
  slack: Slack,
  webhook: Webhook,
  crm: Building2,
};

const TYPE_COLORS: Record<IntegrationType, string> = {
  whatsapp: 'bg-emerald-500/10 text-emerald-600',
  openai: 'bg-violet-500/10 text-violet-600',
  stripe: 'bg-blue-500/10 text-blue-600',
  slack: 'bg-amber-500/10 text-amber-600',
  webhook: 'bg-slate-500/10 text-slate-600',
  crm: 'bg-sky-500/10 text-sky-600',
};

function IntegrationCard({
  integration,
  onToggle,
  isLoading,
}: {
  integration: Integration;
  onToggle: (id: Integration['id'], isActive: boolean) => void;
  isLoading: boolean;
}) {
  const Icon = TYPE_ICONS[integration.type];
  const colorClass = TYPE_COLORS[integration.type];

  return (
    <div className="bg-card border border-card-border rounded-xl p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">{integration.name}</h3>
          <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'} className="text-[10px]">
            {integration.status === 'connected' ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{integration.description}</p>
        {integration.connectedAt && (
          <p className="text-[11px] text-muted-foreground/60 mt-1">
            Conectado em {integration.connectedAt.toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>
      <Switch
        checked={integration.isActive}
        disabled={isLoading}
        onCheckedChange={(checked) => onToggle(integration.id, checked)}
        className="shrink-0 mt-0.5"
      />
    </div>
  );
}

export default function Integrations() {
  const { data: integrations = [], isLoading } = useIntegrations();
  const toggleIntegration = useToggleIntegration();
  const { toast } = useToast();

  const handleToggle = (id: Integration['id'], isActive: boolean) => {
    toggleIntegration.mutate(
      { id, isActive },
      { onSuccess: () => toast({ title: isActive ? 'Integração ativada' : 'Integração desativada' }) },
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-card border border-card-border rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const active = integrations.filter((i) => i.isActive);
  const inactive = integrations.filter((i) => !i.isActive);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Integrações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{active.length} ativa(s) · {inactive.length} disponível(is)</p>
      </div>

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Ativas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map((i) => <IntegrationCard key={i.id} integration={i} onToggle={handleToggle} isLoading={toggleIntegration.isPending} />)}
          </div>
        </section>
      )}

      {inactive.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Disponíveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inactive.map((i) => <IntegrationCard key={i.id} integration={i} onToggle={handleToggle} isLoading={toggleIntegration.isPending} />)}
          </div>
        </section>
      )}
    </div>
  );
}
