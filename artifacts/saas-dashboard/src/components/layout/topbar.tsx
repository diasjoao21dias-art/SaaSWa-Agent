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
import { Sun, Moon, LogOut, User, ChevronRight } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MobileMenuButton } from '@/components/layout/sidebar';
import { NotificationDropdown } from '@/components/layout/notification-dropdown';

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

export function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const meta = ROUTE_META[location] ?? { label: 'Dashboard' };

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

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
        <NotificationDropdown />

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
                <AvatarFallback className="text-[11px] font-semibold bg-primary/15 text-primary">
                  {user?.initials ?? 'OP'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-xs font-medium text-foreground">
                {user?.name?.split(' ')[0] ?? 'Operador'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{user?.name ?? 'Operador Admin'}</span>
                <span className="text-xs text-muted-foreground">{user?.email ?? ''}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
              <User className="w-4 h-4 mr-2 text-muted-foreground" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
