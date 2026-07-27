import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  // Conversation statuses
  'open': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'closed': 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400',
  'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  
  // Agent/User statuses
  'online': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'offline': 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400',
  'busy': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'active': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400',
  
  // Transaction statuses
  'paid': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'overdue': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  
  // Transaction types
  'income': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  'expense': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400';
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        colorClass,
        className
      )}
      data-testid={`badge-${status.toLowerCase()}`}
    >
      {status}
    </span>
  );
}
