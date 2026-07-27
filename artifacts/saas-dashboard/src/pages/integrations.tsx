/**
 * Integrations — cards de serviços com toggle ativar/desativar.
 */
import { useState } from 'react';
import {
  useListIntegrations, useUpdateIntegration, getListIntegrationsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { SiWhatsapp, SiStripe } from 'react-icons/si';
import { Webhook, Settings, Plug, BrainCircuit, MessageSquare, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MOCK_INTEGRATIONS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  whatsapp: SiWhatsapp,
  openai:   BrainCircuit,
  stripe:   SiStripe,
  slack:    MessageSquare,
  webhook:  Webhook,
  crm:      Users,
};

const ICON_COLORS: Record<string, string> = {
  whatsapp: 'text-emerald-500',
  openai:   'text-violet-500',
  stripe:   'text-violet-600',
  slack:    'text-amber-500',
  webhook:  'text-blue-500',
  crm:      'text-sky-600',
};

export default function Integrations() {
  const { data: apiInts = [], isLoading } = useListIntegrations();
  const updateIntegration = useUpdateIntegration();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const integrations = apiInts.length ? apiInts : MOCK_INTEGRATIONS;

  // local optimistic state so toggle feels instant
  const [localState, setLocalState] = useState<Record<string, boolean>>({});

  const handleToggle = (id: string, currentActive: boolean) => {
    setLocalState(prev => ({ ...prev, [id]: !currentActive }));
    updateIntegration.mutate(
      { id, data: { isActive: !currentActive } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListIntegrationsQueryKey() });
          toast({ title: `Integração ${!currentActive ? 'ativada' : 'desativada'}` });
        },
        onError: () => {
          setLocalState(prev => ({ ...prev, [id]: currentActive }));
          toast({ title: 'Erro ao atualizar integração', variant: 'destructive' });
        },
      }
    );
  };

  if (isLoading) return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 bg-card border border-card-border rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  const connected    = integrations.filter(i => i.isActive || i.status === 'connected');
  const disconnected = integrations.filter(i => !i.isActive && i.status !== 'connected');

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Integrações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {connected.length} conectada(s) · {disconnected.length} disponível(eis)
          </p>
        </div>
      </div>

      {/* Active */}
      {connected.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Conectadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connected.map(int => <IntegrationCard key={int.id} integration={int} localState={localState} onToggle={handleToggle} />)}
          </div>
        </section>
      )}

      {/* Disconnected */}
      {disconnected.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Disponíveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {disconnected.map(int => <IntegrationCard key={int.id} integration={int} localState={localState} onToggle={handleToggle} />)}
          </div>
        </section>
      )}

      {integrations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 bg-card border border-card-border rounded-xl gap-2">
          <Plug className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhuma integração encontrada</p>
        </div>
      )}
    </div>
  );
}

function IntegrationCard({
  integration, localState, onToggle,
}: {
  integration: any;
  localState: Record<string, boolean>;
  onToggle: (id: string, current: boolean) => void;
}) {
  const isActive = localState[integration.id] ?? integration.isActive;
  const Icon = ICON_MAP[integration.type?.toLowerCase()] ?? Settings;
  const iconColor = ICON_COLORS[integration.type?.toLowerCase()] ?? 'text-muted-foreground';

  return (
    <div
      className={cn(
        'bg-card border rounded-xl p-5 hover:shadow-md transition-all',
        isActive ? 'border-primary/30' : 'border-card-border',
      )}
      data-testid={`integration-${integration.id}`}
    >
      {/* Top */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-colors',
            isActive ? 'bg-primary/10' : 'bg-muted/50',
          )}>
            <Icon className={cn('w-6 h-6', isActive ? iconColor : 'text-muted-foreground/50')} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">{integration.name}</h3>
            <p className="text-xs text-muted-foreground capitalize">{integration.type}</p>
          </div>
        </div>
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
          isActive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-muted text-muted-foreground',
        )}>
          <span className={cn('w-1.5 h-1.5 rounded-full', isActive ? 'bg-emerald-500' : 'bg-gray-400')} />
          {isActive ? 'Ativa' : 'Inativa'}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-4 leading-relaxed min-h-[2.5rem]">
        {integration.description || 'Sem descrição'}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Switch
            checked={isActive}
            onCheckedChange={() => onToggle(integration.id, isActive)}
            data-testid={`switch-${integration.id}`}
          />
          <span className="text-xs text-muted-foreground">{isActive ? 'Ativada' : 'Desativada'}</span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" data-testid={`button-configure-${integration.id}`}>
          <Settings className="w-3.5 h-3.5" /> Config.
        </Button>
      </div>

      {integration.connectedAt && (
        <p className="text-[11px] text-muted-foreground/60 mt-3">
          Conectada em {new Date(integration.connectedAt).toLocaleDateString('pt-BR')}
        </p>
      )}
    </div>
  );
}
