import { Link, useLocation } from 'wouter';
import { 
  Home, 
  MessageSquare, 
  Users, 
  Clock, 
  Bot, 
  Settings, 
  UserCog, 
  CreditCard, 
  DollarSign, 
  Plug, 
  BarChart3 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Overview', icon: Home },
  { path: '/conversations', label: 'Conversations', icon: MessageSquare },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/attendances', label: 'Attendances', icon: Clock },
  { path: '/agents', label: 'Agents', icon: Bot },
  { path: '/users', label: 'Users', icon: UserCog },
  { path: '/plans', label: 'Plans', icon: CreditCard },
  { path: '/financial', label: 'Financial', icon: DollarSign },
  { path: '/integrations', label: 'Integrations', icon: Plug },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-56 border-r border-sidebar-border bg-sidebar flex flex-col">
      <div className="h-14 border-b border-sidebar-border flex items-center px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm text-sidebar-foreground">AI Agent Hub</span>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                  data-testid={`nav-${item.path.slice(1) || 'home'}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
