import { Sun, Moon, Bell } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function TopBar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold text-foreground">Dashboard</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          data-testid="button-theme-toggle"
          className="w-9 h-9"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-notifications"
          className="w-9 h-9"
        >
          <Bell className="w-4 h-4" />
        </Button>
        
        <Avatar className="w-8 h-8 ml-2">
          <AvatarFallback className="text-xs">OP</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
