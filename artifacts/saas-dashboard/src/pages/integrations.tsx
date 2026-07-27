import { useState } from 'react';
import { useListIntegrations, useUpdateIntegration, getListIntegrationsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { SiWhatsapp, SiOpenai, SiStripe, SiSlack, SiSalesforce } from 'react-icons/si';
import { Webhook, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const iconMap: Record<string, any> = {
  whatsapp: SiWhatsapp,
  openai: SiOpenai,
  stripe: SiStripe,
  slack: SiSlack,
  webhook: Webhook,
  crm: SiSalesforce,
};

export default function Integrations() {
  const { data: integrations = [], isLoading } = useListIntegrations();
  const updateIntegration = useUpdateIntegration();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleToggle = (id: string, isActive: boolean) => {
    updateIntegration.mutate(
      { id, data: { isActive: !isActive } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListIntegrationsQueryKey() });
          toast({ title: `Integration ${!isActive ? 'activated' : 'deactivated'}` });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-card border border-card-border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Integrations</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => {
          const Icon = iconMap[integration.type.toLowerCase()] || Settings;
          
          return (
            <div
              key={integration.id}
              className="bg-card border border-card-border rounded-lg p-5 hover:shadow-md transition-shadow"
              data-testid={`integration-${integration.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    integration.isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted/50 text-muted-foreground'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{integration.name}</h3>
                    <p className="text-xs text-muted-foreground">{integration.type}</p>
                  </div>
                </div>
                {integration.status && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    integration.status === 'connected' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400'
                  }`}>
                    {integration.status}
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-4 min-h-[2.5rem]">
                {integration.description || 'No description available'}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={integration.isActive}
                    onCheckedChange={() => handleToggle(integration.id, integration.isActive)}
                    data-testid={`switch-${integration.id}`}
                  />
                  <span className="text-sm text-muted-foreground">
                    {integration.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid={`button-configure-${integration.id}`}
                >
                  <Settings className="w-3.5 h-3.5 mr-1.5" />
                  Configure
                </Button>
              </div>

              {integration.connectedAt && (
                <p className="text-xs text-muted-foreground mt-3">
                  Connected {new Date(integration.connectedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {integrations.length === 0 && (
        <div className="text-center py-12 bg-card border border-card-border rounded-lg">
          <p className="text-muted-foreground">No integrations found</p>
        </div>
      )}
    </div>
  );
}
