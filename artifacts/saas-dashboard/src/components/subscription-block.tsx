/**
 * SubscriptionBlock — full-screen blocking overlay shown when subscription is not active.
 * Prevents non-paying tenants from using the dashboard.
 */
import { useSubscriptionStatus, useUpdateSubscriptionStatus } from '@/application/use-cases/use-subscription';
import { Button } from '@/components/ui/button';
import { ShieldBan, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export function SubscriptionBlock() {
  const { data: status, isLoading } = useSubscriptionStatus();
  const { mutate: updateStatus, isPending } = useUpdateSubscriptionStatus();
  const { logout } = useAuth();
  const { toast } = useToast();

  if (isLoading || status === 'active') return null;

  const isSuspended = status === 'suspended';
  const isCanceled = status === 'canceled';

  const handleReactivate = () => {
    updateStatus('active', {
      onSuccess: () => toast({ title: 'Assinatura reativada! Bem-vindo de volta.' }),
      onError: () => toast({ title: 'Erro ao reativar. Tente novamente.', variant: 'destructive' }),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-card-border rounded-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
          <ShieldBan className="w-8 h-8 text-amber-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            {isSuspended ? 'Assinatura Suspensa' : isCanceled ? 'Assinatura Cancelada' : 'Pagamento Pendente'}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isSuspended
              ? 'Sua assinatura está suspensa devido a falta de pagamento. Regularize sua cobrança para continuar usando a plataforma.'
              : isCanceled
                ? 'Sua assinatura foi cancelada. Reative para recuperar o acesso ao sistema.'
                : 'Há um pagamento pendente em sua conta. Regularize para continuar.'}
          </p>
        </div>

        <div className="bg-muted/40 rounded-lg p-4 space-y-2 text-left">
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Status atual:</span>
            <span className="font-semibold text-amber-600 capitalize">{status}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Para reativar, confirme o pagamento ou entre em contato com o suporte.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleReactivate} disabled={isPending} className="w-full">
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
            Confirmar Pagamento e Reativar
          </Button>
          <Button variant="ghost" onClick={logout} className="w-full">Sair</Button>
        </div>
      </div>
    </div>
  );
}
