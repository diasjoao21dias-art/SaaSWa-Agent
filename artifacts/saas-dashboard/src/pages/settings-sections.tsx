/**
 * settings-sections.tsx — shared section components for the Settings page.
 * Contains SectionCard, SectionTitle, NotifRow, and WhatsappTab.
 */
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { DashboardSettings } from '@/application/use-cases/use-settings';
import { useWhatsappStatus, useConnectWhatsapp, useDisconnectWhatsapp } from '@/application/use-cases/use-whatsapp';
import { Save, MessageSquare, Loader2, QrCode, Wifi, AlertCircle } from 'lucide-react';

export function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">{children}</div>
  );
}

export function SectionTitle({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 pb-2">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

export function NotifRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}

// ─── WhatsappTab ─────────────────────────────────────────────────────────────
interface WhatsappTabProps {
  form: Partial<DashboardSettings>;
  update: (key: keyof DashboardSettings, value: string | boolean) => void;
  onSave: (section: string, data: Partial<DashboardSettings>) => void;
  isPending: boolean;
  toast: ReturnType<typeof useToast>['toast'];
}

export function WhatsappTab({ form, update, onSave, isPending, toast }: WhatsappTabProps) {
  const { data: waStatus, isLoading: statusLoading } = useWhatsappStatus();
  const connectMutation = useConnectWhatsapp();
  const disconnectMutation = useDisconnectWhatsapp();
  const [qrCode, setQrCode] = useState<string>('');
  const [showQr, setShowQr] = useState(false);

  const connected = waStatus?.connected ?? form.whatsappConnected ?? false;

  const handleConnect = () => {
    connectMutation.mutate(undefined, {
      onSuccess: (res) => {
        if (res.error) {
          toast({ title: 'Erro ao conectar', description: res.error, variant: 'destructive' });
        } else if (res.qrCode) {
          setQrCode(res.qrCode);
          setShowQr(true);
          toast({ title: 'QR Code gerado! Escaneie com seu WhatsApp.' });
        }
      },
      onError: () => toast({ title: 'Erro ao conectar', variant: 'destructive' }),
    });
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate(undefined, {
      onSuccess: () => {
        setShowQr(false);
        setQrCode('');
        toast({ title: 'WhatsApp desconectado' });
      },
    });
  };

  return (
    <>
      <SectionCard>
        <SectionTitle icon={MessageSquare} title="Evolution API" description="Conexão WhatsApp em tempo real" />
        <Separator />

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {statusLoading ? 'Verificando…' : connected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
            </p>
            {waStatus?.instance && (
              <p className="text-xs text-muted-foreground">Instância: {waStatus.instance}</p>
            )}
          </div>
          {connected ? (
            <Button variant="destructive" size="sm" onClick={handleDisconnect} disabled={disconnectMutation.isPending}>
              {disconnectMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5 mr-1.5" />}
              Desconectar
            </Button>
          ) : (
            <Button size="sm" onClick={handleConnect} disabled={connectMutation.isPending}>
              {connectMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5 mr-1.5" />}
              Conectar via QR
            </Button>
          )}
        </div>

        {showQr && qrCode && !connected && (
          <div className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-border rounded-lg">
            <img src={qrCode} alt="QR Code WhatsApp" className="w-48 h-48" />
            <p className="text-xs text-muted-foreground text-center">
              Abra o WhatsApp → Configurações → Aparelhos Conectados → Conectar um aparelho<br />
              Escaneie o QR Code acima
            </p>
          </div>
        )}

        {connectMutation.data?.error && !connected && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-600">Evolution API não disponível</p>
              <p className="text-xs text-muted-foreground mt-0.5">{connectMutation.data.error}</p>
            </div>
          </div>
        )}

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="evolutionUrl">URL da Evolution API</Label>
            <Input id="evolutionUrl" value={form.evolutionUrl ?? ''} onChange={(e) => update('evolutionUrl', e.target.value)} placeholder="http://evolution-api:8080" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="evolutionKey">Chave de API</Label>
            <Input id="evolutionKey" type="password" value={form.evolutionKey ?? ''} onChange={(e) => update('evolutionKey', e.target.value)} placeholder="evolution_api_key_…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="webhookSecret">Webhook Secret (HMAC)</Label>
            <Input id="webhookSecret" type="password" value={form.webhookSecret ?? ''} onChange={(e) => update('webhookSecret', e.target.value)} placeholder="min. 16 caracteres" />
          </div>
        </div>
        <Button onClick={() => onSave('WhatsApp', form)} disabled={isPending} data-testid="button-save-whatsapp">
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Salvar Configurações
        </Button>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={MessageSquare} title="Comportamento do Bot" />
        <Separator />
        <div className="space-y-3 divide-y divide-border">
          <NotifRow title="Reconectar automaticamente" description="Tenta reconectar instâncias desconectadas" checked={form.botAutoReconnect ?? true} onChange={(v) => update('botAutoReconnect', v)} />
          <NotifRow title="Escalar após silêncio do bot" description="Encaminha para humano se bot não responder em 60s" checked={form.botEscalateSilence ?? true} onChange={(v) => update('botEscalateSilence', v)} />
          <NotifRow title="Registrar todas as mensagens" description="Salva histórico completo de conversas" checked={form.botLogAll ?? true} onChange={(v) => update('botLogAll', v)} />
        </div>
        <Button onClick={() => onSave('Bot', form)} disabled={isPending}>
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Salvar
        </Button>
      </SectionCard>
    </>
  );
}
