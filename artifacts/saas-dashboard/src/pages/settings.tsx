/**
 * Settings — configurações da conta em 4 abas:
 * Geral | Notificações | Segurança | WhatsApp
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Save, Shield, Bell, Settings2, MessageSquare } from 'lucide-react';

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
      {children}
    </div>
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

function NotifRow({ title, description, defaultChecked = true }: { title: string; description: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} className="shrink-0" />
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const handleSave = (section: string) => toast({ title: `${section} salvo com sucesso` });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie as preferências da sua conta</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="general"       data-testid="tab-general">Geral</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security"      data-testid="tab-security">Segurança</TabsTrigger>
          <TabsTrigger value="whatsapp"      data-testid="tab-whatsapp">WhatsApp</TabsTrigger>
        </TabsList>

        {/* ── General ──────────────────────────────────────────────────── */}
        <TabsContent value="general" className="mt-4 space-y-4">
          <SectionCard>
            <SectionTitle icon={Settings2} title="Informações da Empresa" description="Dados básicos da organização" />
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="companyName">Nome da Empresa</Label>
                <Input id="companyName" defaultValue="AI Agent Hub" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="website">Website</Label>
                <Input id="website" type="url" defaultValue="https://aiagent.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supportEmail">E-mail de Suporte</Label>
                <Input id="supportEmail" type="email" defaultValue="suporte@aiagent.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" defaultValue="+55 (11) 99999-0000" />
              </div>
            </div>
            <Button onClick={() => handleSave('Geral')} data-testid="button-save-general">
              <Save className="w-4 h-4 mr-2" /> Salvar Alterações
            </Button>
          </SectionCard>

          <SectionCard>
            <SectionTitle icon={Settings2} title="Localização e Idioma" />
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="timezone">Fuso Horário</Label>
                <Select defaultValue="brt">
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
                <Select defaultValue="pt">
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
                <Select defaultValue="dmy">
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
                <Select defaultValue="24">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 horas</SelectItem>
                    <SelectItem value="12">12 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => handleSave('Localização')} data-testid="button-save-appearance">
              <Save className="w-4 h-4 mr-2" /> Salvar
            </Button>
          </SectionCard>
        </TabsContent>

        {/* ── Notifications ────────────────────────────────────────────── */}
        <TabsContent value="notifications" className="mt-4">
          <SectionCard>
            <SectionTitle icon={Bell} title="Notificações por E-mail" description="Escolha quais eventos disparam alertas" />
            <Separator />
            <div className="space-y-3 divide-y divide-border">
              <NotifRow title="Nova Conversa"        description="Quando uma nova conversa é iniciada" defaultChecked />
              <NotifRow title="Atribuição de Agente" description="Quando um agente é atribuído a uma conversa" defaultChecked />
              <NotifRow title="Conversa Escalada"    description="Quando um bot escala para atendimento humano" defaultChecked />
              <NotifRow title="Atualização de Pagamento" description="Status de cobranças e vencimentos" defaultChecked />
              <NotifRow title="Agente Offline"       description="Quando um agente fica indisponível" defaultChecked={false} />
              <NotifRow title="Relatório Semanal"    description="Resumo de performance toda segunda-feira" defaultChecked={false} />
              <NotifRow title="Limite de Conversas"  description="Alerta quando atingir 80% do plano" defaultChecked />
            </div>
            <Button onClick={() => handleSave('Notificações')} data-testid="button-save-notifications">
              <Save className="w-4 h-4 mr-2" /> Salvar
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
                <Input id="confirmPassword" type="password" placeholder="••••••••" />
              </div>
            </div>
            <Button onClick={() => handleSave('Senha')} data-testid="button-save-security">
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
              <Switch id="2fa" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Notificação de Novo Login</p>
                <p className="text-xs text-muted-foreground mt-0.5">E-mail ao detectar acesso de novo dispositivo</p>
              </div>
              <Switch id="loginNotif" defaultChecked />
            </div>
          </SectionCard>
        </TabsContent>

        {/* ── WhatsApp ──────────────────────────────────────────────────── */}
        <TabsContent value="whatsapp" className="mt-4 space-y-4">
          <SectionCard>
            <SectionTitle icon={MessageSquare} title="Evolution API" description="Configurações do gateway WhatsApp" />
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="evolutionUrl">URL da Evolution API</Label>
                <Input id="evolutionUrl" defaultValue="https://evolution.aiagent.com" placeholder="https://…" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="evolutionKey">Chave de API</Label>
                <Input id="evolutionKey" type="password" placeholder="evolution_api_key_…" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="webhookSecret">Webhook Secret (HMAC)</Label>
                <Input id="webhookSecret" type="password" placeholder="min. 16 caracteres" />
              </div>
            </div>
            <Button onClick={() => handleSave('WhatsApp')} data-testid="button-save-whatsapp">
              <Save className="w-4 h-4 mr-2" /> Salvar Configurações
            </Button>
          </SectionCard>

          <SectionCard>
            <SectionTitle icon={MessageSquare} title="Comportamento do Bot" />
            <Separator />
            <div className="space-y-3 divide-y divide-border">
              <NotifRow title="Reconectar automaticamente" description="Tenta reconectar instâncias desconectadas" defaultChecked />
              <NotifRow title="Escalar após silêncio do bot" description="Encaminha para humano se bot não responder em 60s" defaultChecked />
              <NotifRow title="Registrar todas as mensagens" description="Salva histórico completo de conversas" defaultChecked />
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
