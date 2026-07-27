/**
 * TopBar — barra superior fixa de cada página.
 *
 * Contém:
 *  - Hamburger (mobile) via MobileMenuButton
 *  - Título da página derivado da rota atual
 *  - Notificações com badge de não lidos
 *  - Toggle de tema claro/escuro
 *  - Avatar com dropdown do usuário
 */
import { useLocation } from 'wouter';
import { Sun, Moon, Bell, LogOut, User, ChevronRight } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MobileMenuButton } from '@/components/layout/sidebar';
import { cn } from '@/lib/utils';

// ─── Route → label map ────────────────────────────────────────────────────────
const ROUTE_META: Record<string, { label: string; description?: string }> = {
  '/':              { label: 'Visão Geral',   description: 'Métricas e atividade recente' },
  '/conversations': { label: 'Conversas',     description: 'Gerencie todas as conversas' },
  '/clients':       { label: 'Clientes',      description: 'Base de clientes' },
  '/attendances':   { label: 'Atendimentos',  description: 'Histórico de atendimentos' },
  '/agents':        { label: 'Agentes',       description: 'Agentes IA e humanos' },
  '/users':         { label: 'Usuários',      description: 'Usuários da plataforma' },
  '/plans':         { label: 'Planos',        description: 'Planos de assinatura' },
  '/financial':     { label: 'Financeiro',    description: 'Receitas e despesas' },
  '/integrations':  { label: 'Integrações',   description: 'Serviços conectados' },
  '/reports':       { label: 'Relatórios',    description: 'Análise e performance' },
  '/settings':      { label: 'Configurações', description: 'Preferências da conta' },
};

const UNREAD_NOTIFICATIONS = 4;

export function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const meta = ROUTE_META[location] ?? { label: 'Dashboard' };

  return (
    <header className="h-14 shrink-0 border-b border-border bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 z-10">
      {/* Left: mobile menu + breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <MobileMenuButton />

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Dashboard</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{meta.label}</span>
        </div>

        {/* Mobile: just the page title */}
        <span className="sm:hidden text-sm font-semibold text-foreground">{meta.label}</span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative w-9 h-9"
          data-testid="button-notifications"
        >
          <Bell className="w-4 h-4" />
          {UNREAD_NOTIFICATIONS > 0 && (
            <span className={cn(
              'absolute top-1.5 right-1.5 min-w-[14px] h-[14px] rounded-full',
              'bg-primary text-primary-foreground text-[9px] font-bold',
              'flex items-center justify-center leading-none px-[3px]',
            )}>
              {UNREAD_NOTIFICATIONS}
            </span>
          )}
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          data-testid="button-theme-toggle"
          className="w-9 h-9"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 gap-2 pl-1.5 pr-2 rounded-full"
              data-testid="button-user-menu"
            >
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-[11px] font-semibold bg-primary/15 text-primary">OP</AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-xs font-medium text-foreground">Operador</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">Operador Admin</span>
                <span className="text-xs text-muted-foreground">admin@aiagent.com</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2 text-muted-foreground" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
