/**
 * NotificationDropdown — popover that shows recent activity as notifications.
 * Fetches from /api/dashboard/activity and displays the latest items.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  actor: string | null;
  createdAt: string;
}

const TYPE_EMOJI: Record<string, string> = {
  conversation: '💬',
  client: '👤',
  attendance: '🎧',
};

const TYPE_ROUTE: Record<string, string> = {
  conversation: '/conversations',
  client: '/clients',
  attendance: '/attendances',
};

export function NotificationDropdown() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const { data: notifications = [], isLoading } = useQuery<ActivityItem[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/dashboard/activity`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 30000,
  });

  const unread = Math.min(notifications.length, 4);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-9 h-9"
          data-testid="button-notifications"
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className={cn(
              'absolute top-1.5 right-1.5 min-w-[14px] h-[14px] rounded-full',
              'bg-primary text-primary-foreground text-[9px] font-bold',
              'flex items-center justify-center leading-none px-[3px]',
            )}>
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Notificações</span>
          {unread > 0 && (
            <span className="text-xs text-primary font-medium">{unread} não lidas</span>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">Carregando…</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhuma notificação</div>
          ) : (
            notifications.slice(0, 8).map((n) => {
              const route = TYPE_ROUTE[n.type];
              return (
                <button
                  key={n.id}
                  onClick={() => { if (route) { navigate(route); setOpen(false); } }}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-3 hover:bg-accent/40 transition-colors border-b border-border last:border-0 text-left',
                    route && 'cursor-pointer',
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs">{TYPE_EMOJI[n.type] ?? '🔔'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-tight truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {n.actor && <span className="text-[11px] text-muted-foreground/70">por {n.actor}</span>}
                      <span className="text-[11px] text-muted-foreground/70">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  {route && <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-1.5" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
