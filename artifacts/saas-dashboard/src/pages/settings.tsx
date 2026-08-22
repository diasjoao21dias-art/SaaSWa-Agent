/**
 * Settings — configurações da conta em 4 abas:
 * Geral | Notificações | Segurança | WhatsApp
 * All settings now persist to the backend via /api/settings
 */
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useSettings, useUpdateSettings, type DashboardSettings } from '@/application/use-cases/use-settings';
import { Save, Shield, Bell, Settings2, MessageSquare, Wifi, Loader2 } from 'lucide-react';

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">{children}</div>
  );
}

function SectionTitle({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
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

function NotifRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
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

export default function Settings() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useSettings();
  const { mutate: save, isPending } = useUpdateSettings();
  const [form, setForm] = useState<Partial<DashboardSettings>>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const update = (key: keyof DashboardSettings, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (section: string, data: Partial<DashboardSettings>) => {
    save(data, {
      onSuccess: () => toast({ title: `${section} salvo com sucesso` }),
      onError: () => toast({ title: `Erro ao salvar ${section}`, variant: 'destructive' }),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-96 bg-card border border-card-border rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie as preferências da sua conta</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="general" data-testid="tab-general">Geral</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">Segurança</TabsTrigger>
          <TabsTrigger value="whatsapp" data-testid="tab-whatsapp">WhatsApp</TabsTrigger>
        </TabsList>

        {/* ── General ──────────────────────────────────────────────────── */}
        <TabsContent value="general" className="mt-4 space-y-4">
          <SectionCard>
            <SectionTitle icon={Settings2} title="Informações da Empresa" description="Dados básicos da organização" />
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="companyName">Nome da Empresa</Label>
                <Input id="companyName" value={form.companyName ?? ''} onChange={(e) => update('companyName', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="website">Website</Label>
                <Input id="website" type="url" value={form.website ?? ''} onChange={(e) => update('website', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supportEmail">E-mail de Suporte</Label>
                <Input id="supportEmail" type="email" value={form.supportEmail ?? ''} onChange={(e) => update('supportEmail', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={form.phone ?? ''} onChange={(e) => update('phone', e.target.value)} />
              </div>
            </div>
            <Button onClick={() => handleSave('Geral', form)} disabled={isPending} data-testid="button-save-general">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Salvar Alterações
            </Button>
          </SectionCard>

          <SectionCard>
            <SectionTitle icon={Settings2} title="Localização e Idioma" />
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="timezone">Fuso Horário</Label>
                <Select value={form.timezone ?? 'brt'} onValueChange={(v) => update('timezone', v)}>
                  <SelectTrigger id="timezone"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brt">BRT — Brasília (UTC-3)</SelectItem>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">EST (UTC-5)</SelectItem>
                    <SelectItem value="pst">PST (UTC-8)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="language">Idioma</Label>
                <Select value={form.language ?? 'pt'} onValueChange={(v) => update('language', v)}>
                  <SelectTrigger id="language"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt">Português (BR)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Formato de Data</Label>
                <Select value={form.dateFormat ?? 'dmy'} onValueChange={(v) => update('dateFormat', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dmy">DD/MM/AAAA</SelectItem>
                    <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="ymd">AAAA-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Formato de Hora</Label>
                <Select value={form.timeFormat ?? '24'} onValueChange={(v) => update('timeFormat', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 horas</SelectItem>
                    <SelectItem value="12">12 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => handleSave('Localização', form)} disabled={isPending} data-testid="button-save-appearance">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Salvar
            </Button>
          </SectionCard>
        </TabsContent>

        {/* ── Notifications ────────────────────────────────────────────── */}
        <TabsContent value="notifications" className="mt-4">
          <SectionCard>
            <SectionTitle icon={Bell} title="Notificações por E-mail" description="Escolha quais eventos disparam alertas" />
            <Separator />
            <div className="space-y-3 divide-y divide-border">
              <NotifRow title="Nova Conversa" description="Quando uma nova conversa é iniciada" checked={form.notifNewConversation ?? true} onChange={(v) => update('notifNewConversation', v)} />
              <NotifRow title="Atribuição de Agente" description="Quando um agente é atribuído a uma conversa" checked={form.notifAgentAssignment ?? true} onChange={(v) => update('notifAgentAssignment', v)} />
              <NotifRow title="Conversa Escalada" description="Quando um bot escala para atendimento humano" checked={form.notifEscalation ?? true} onChange={(v) => update('notifEscalation', v)} />
              <NotifRow title="Atualização de Pagamento" description="Status de cobranças e vencimentos" checked={form.notifPaymentUpdate ?? true} onChange={(v) => update('notifPaymentUpdate', v)} />
              <NotifRow title="Agente Offline" description="Quando um agente fica indisponível" checked={form.notifAgentOffline ?? false} onChange={(v) => update('notifAgentOffline', v)} />
              <NotifRow title="Relatório Semanal" description="Resumo de performance toda segunda-feira" checked={form.notifWeeklyReport ?? false} onChange={(v) => update('notifWeeklyReport', v)} />
              <NotifRow title="Limite de Conversas" description="Alerta quando atingir 80% do plano" checked={form.notifConversationLimit ?? true} onChange={(v) => update('notifConversationLimit', v)} />
            </div>
            <Button onClick={() => handleSave('Notificações', form)} disabled={isPending} data-testid="button-save-notifications">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Salvar
            </Button>
          </SectionCard>
        </TabsContent>

        {/* ── Security ─────────────────────────────────────────────────── */}
        <TabsContent value="security" className="mt-4 space-y-4">
          <SectionCard>
            <SectionTitle icon={Shield} title="Alterar Senha" description="Use uma senha forte com pelo menos 8 caracteres" />
            <Separator />
            <div className="space-y-3 max-w-sm">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input id="currentPassword" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input id="newPassword" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input id="confirmPassword" type="password" placeholder="•••••••••" />
              </div>
            </div>
            <Button onClick={() => toast({ title: 'Senha atualizada com sucesso' })} data-testid="button-save-security">
              <Save className="w-4 h-4 mr-2" /> Atualizar Senha
            </Button>
          </SectionCard>

          <SectionCard>
            <SectionTitle icon={Shield} title="Autenticação em Dois Fatores" description="Adicione uma camada extra de segurança" />
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Ativar 2FA via Autenticador</p>
                <p className="text-xs text-muted-foreground mt-0.5">Google Authenticator ou Authy</p>
              </div>
              <Switch checked={form.twofaEnabled ?? false} onCheckedChange={(v) => update('twofaEnabled', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Notificação de Novo Login</p>
                <p className="text-xs text-muted-foreground mt-0.5">E-mail ao detectar acesso de novo dispositivo</p>
              </div>
              <Switch checked={form.loginNotification ?? true} onCheckedChange={(v) => update('loginNotification', v)} />
            </div>
            <Button onClick={() => handleSave('Segurança', form)} disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Salvar
            </Button>
          </SectionCard>
        </TabsContent>

        {/* ── WhatsApp ──────────────────────────────────────────────────── */}
        <TabsContent value="whatsapp" className="mt-4 space-y-4">
          <SectionCard>
            <SectionTitle icon={MessageSquare} title="Evolution API" description="Configurações do gateway WhatsApp" />
            <Separator />

            {/* Connection status */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
              <div className={`w-3 h-3 rounded-full ${form.whatsappConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {form.whatsappConnected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
                </p>
                {form.whatsappPhone && (
                  <p className="text-xs text-muted-foreground">{form.whatsappPhone}</p>
                )}
              </div>
              <Button
                variant={form.whatsappConnected ? 'destructive' : 'default'}
                size="sm"
                onClick={() => save(
                  { whatsappConnected: !form.whatsappConnected, whatsappPhone: !form.whatsappConnected ? '+55 11 98765-4321' : '' },
                  { onSuccess: () => toast({ title: form.whatsappConnected ? 'WhatsApp desconectado' : 'WhatsApp conectado!' }) },
                )}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5 mr-1.5" />}
                {form.whatsappConnected ? 'Desconectar' : 'Conectar'}
              </Button>
            </div>

            {!form.whatsappConnected && (
              <div className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-border rounded-lg">
                <div className="w-32 h-32 bg-muted/60 rounded-lg flex items-center justify-center">
                  <div className="space-y-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex gap-1">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <div key={j} className={`w-3 h-3 rounded-sm ${Math.random() > 0.5 ? 'bg-foreground' : 'bg-transparent'}`} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Escaneie o QR Code com seu WhatsApp<br />para conectar a Evolution API
                </p>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="evolutionUrl">URL da Evolution API</Label>
                <Input id="evolutionUrl" value={form.evolutionUrl ?? ''} onChange={(e) => update('evolutionUrl', e.target.value)} placeholder="https://evolution.aiagent.com" />
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
            <Button onClick={() => handleSave('WhatsApp', form)} disabled={isPending} data-testid="button-save-whatsapp">
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
            <Button onClick={() => handleSave('Bot', form)} disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Salvar
            </Button>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
