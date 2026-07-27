/**
 * Sidebar — navegação principal do dashboard.
 *
 * Desktop: visível por padrão; botão no topo colapsa para modo "ícones somente"
 *          (largura 56px) para dar mais espaço à área de conteúdo.
 * Mobile:  oculto; abre como Sheet (drawer) ao clicar no hamburger da TopBar.
 *
 * Estado de colapso fica no SidebarContext para que a TopBar possa acionar o
 * drawer móvel e a App.tsx possa ajustar o layout.
 */
import { createContext, useContext, useState, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Home, MessageSquare, Users, Clock, Bot, Settings,
  UserCog, CreditCard, DollarSign, Plug, BarChart3,
  ChevronLeft, ChevronRight, Menu, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// ─── Context ──────────────────────────────────────────────────────────────────

interface SidebarCtx {
  collapsed: boolean;
  toggleCollapse: () => void;
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarCtx>({
  collapsed: false, toggleCollapse: () => {},
  mobileOpen: false, openMobile: () => {}, closeMobile: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{
      collapsed, toggleCollapse: () => setCollapsed(p => !p),
      mobileOpen, openMobile: () => setMobileOpen(true), closeMobile: () => setMobileOpen(false),
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() { return useContext(SidebarContext); }

// ─── Nav Structure ────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    label: 'Principal',
    items: [
      { path: '/',              label: 'Visão Geral',   icon: Home          },
      { path: '/conversations', label: 'Conversas',     icon: MessageSquare },
      { path: '/clients',       label: 'Clientes',      icon: Users         },
      { path: '/attendances',   label: 'Atendimentos',  icon: Clock         },
      { path: '/agents',        label: 'Agentes',       icon: Bot           },
    ],
  },
  {
    label: 'Administração',
    items: [
      { path: '/users',         label: 'Usuários',      icon: UserCog       },
      { path: '/plans',         label: 'Planos',        icon: CreditCard    },
      { path: '/financial',     label: 'Financeiro',    icon: DollarSign    },
      { path: '/integrations',  label: 'Integrações',   icon: Plug          },
      { path: '/reports',       label: 'Relatórios',    icon: BarChart3     },
    ],
  },
  {
    label: 'Conta',
    items: [
      { path: '/settings',      label: 'Configurações', icon: Settings      },
    ],
  },
];

// ─── Shared nav item ──────────────────────────────────────────────────────────

function NavItem({
  path, label, icon: Icon, isActive, collapsed, onClick,
}: {
  path: string; label: string; icon: React.ElementType;
  isActive: boolean; collapsed: boolean; onClick?: () => void;
}) {
  const item = (
    <Link
      href={path}
      onClick={onClick}
      data-testid={`nav-${path.slice(1) || 'home'}`}
      className={cn(
        'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
        'group',
        isActive
          ? 'bg-sidebar-primary/10 text-sidebar-primary'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        collapsed && 'justify-center px-2',
      )}
    >
      {/* active left border indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-sidebar-primary" />
      )}
      <Icon className={cn('shrink-0', isActive ? 'text-sidebar-primary' : '', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{item}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    );
  }
  return item;
}

// ─── Inner nav (shared between sidebar + sheet) ───────────────────────────────

function NavContent({ collapsed, onItemClick }: { collapsed: boolean; onItemClick?: () => void }) {
  const [location] = useLocation();

  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
      {SECTIONS.map(section => (
        <div key={section.label}>
          {!collapsed && (
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35 select-none">
              {section.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map(item => (
              <li key={item.path}>
                <NavItem
                  {...item}
                  isActive={location === item.path}
                  collapsed={collapsed}
                  onClick={onItemClick}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 h-14 border-b border-sidebar-border px-4 shrink-0',
      collapsed && 'justify-center px-2',
    )}>
      <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0 shadow-sm">
        <MessageSquare className="w-4 h-4 text-white" />
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold text-sidebar-foreground tracking-tight">AI Agent</span>
          <span className="text-[10px] text-sidebar-foreground/50 font-medium">Hub Platform</span>
        </div>
      )}
    </div>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────

export function Sidebar() {
  const { collapsed, toggleCollapse } = useSidebar();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 ease-in-out shrink-0',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      <Logo collapsed={collapsed} />
      <NavContent collapsed={collapsed} />

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className={cn(
            'w-full h-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent',
            collapsed ? 'justify-center px-0' : 'justify-start gap-2 px-3',
          )}
          data-testid="button-collapse-sidebar"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span className="text-xs">Recolher</span></>}
        </Button>
      </div>
    </aside>
  );
}

// ─── Mobile trigger (hamburger) ───────────────────────────────────────────────

export function MobileMenuButton() {
  const { openMobile } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden w-9 h-9"
      onClick={openMobile}
      data-testid="button-mobile-menu"
    >
      <Menu className="w-5 h-5" />
    </Button>
  );
}

// ─── Mobile Sheet Drawer ──────────────────────────────────────────────────────

export function MobileSidebar() {
  const { mobileOpen, closeMobile } = useSidebar();

  return (
    <Sheet open={mobileOpen} onOpenChange={open => !open && closeMobile()}>
      <SheetContent side="left" className="p-0 w-64 bg-sidebar border-r border-sidebar-border">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-14 border-b border-sidebar-border px-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-sidebar-foreground">AI Agent</span>
                <span className="text-[10px] text-sidebar-foreground/50 font-medium">Hub Platform</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={closeMobile}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <NavContent collapsed={false} onItemClick={closeMobile} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
