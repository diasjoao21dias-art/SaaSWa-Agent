import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import { Sidebar, SidebarProvider, MobileSidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/topbar';
import { RepositoryProvider } from '@/infrastructure/di/repository.provider';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import NotFound from '@/pages/not-found';
import Home from '@/pages/home';
import Conversations from '@/pages/conversations';
import Clients from '@/pages/clients';
import Attendances from '@/pages/attendances';
import Agents from '@/pages/agents';
import Users from '@/pages/users';
import Plans from '@/pages/plans';
import Financial from '@/pages/financial';
import Integrations from '@/pages/integrations';
import Reports from '@/pages/reports';
import Settings from '@/pages/settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

function AppRoutes() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-background">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/conversations" component={Conversations} />
            <Route path="/clients" component={Clients} />
            <Route path="/attendances" component={Attendances} />
            <Route path="/agents" component={Agents} />
            <Route path="/users" component={Users} />
            <Route path="/plans" component={Plans} />
            <Route path="/financial" component={Financial} />
            <Route path="/integrations" component={Integrations} />
            <Route path="/reports" component={Reports} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RepositoryProvider>
          <SidebarProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                <AppRoutes />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </SidebarProvider>
        </RepositoryProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
