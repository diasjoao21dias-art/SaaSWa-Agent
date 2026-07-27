/**
 * StatCard — cartão de KPI do dashboard.
 *
 * Exibe: ícone colorido, valor grande monoespaçado, rótulo, badge de tendência
 * (↑/↓ + %) e sparkline de 7 pontos usando Recharts ResponsiveContainer.
 */
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  sparkline?: number[];
  colorClass?: string;   // tailwind bg-* for icon ring, e.g. "bg-blue-500/10"
  iconClass?: string;    // tailwind text-* for icon, e.g. "text-blue-500"
  className?: string;
}

export function StatCard({
  title, value, icon: Icon, trend, sparkline,
  colorClass = 'bg-primary/10', iconClass = 'text-primary',
  className,
}: StatCardProps) {
  const sparkData = sparkline?.map(v => ({ v }));

  return (
    <div
      className={cn(
        'bg-card border border-card-border rounded-xl p-4 flex flex-col gap-3',
        'hover:shadow-md transition-shadow duration-200',
        className,
      )}
      data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-semibold font-mono-tabular text-foreground mt-1.5 leading-none">
            {value}
          </p>
          {trend && (
            <span className={cn(
              'inline-flex items-center gap-0.5 mt-2 text-xs font-semibold font-mono-tabular',
              trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
          <Icon className={cn('w-5 h-5', iconClass)} />
        </div>
      </div>

      {/* Sparkline */}
      {sparkData && sparkData.length > 1 && (
        <div className="h-10 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke="currentColor"
                className={iconClass}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
