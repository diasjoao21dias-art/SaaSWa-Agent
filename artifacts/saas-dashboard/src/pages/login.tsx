/**
 * Login — página de autenticação (SaaS split-screen layout).
 */
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bot, Eye, EyeOff, Loader2, MessageSquare, Zap, ShieldCheck, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  { icon: MessageSquare, title: 'Atendimento omnichannel', desc: 'WhatsApp, Instagram e webchat em um só lugar' },
  { icon: Zap, title: 'IA automatizada', desc: 'Respostas instantâneas e escalonamento inteligente' },
  { icon: BarChart3, title: 'Métricas em tempo real', desc: 'Dashboard completo com performance e SLA' },
  { icon: ShieldCheck, title: 'Segurança enterprise', desc: 'Dados criptografados, compliance LGPD' },
];

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left: Branding panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-cyan-600 via-teal-700 to-cyan-900">
        {/* Decorative grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Glow accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
              <Bot className="w-6 h-6" />
            </div>
            <span className="text-xl font-semibold tracking-tight">AI Agent Hub</span>
          </div>

          {/* Hero copy */}
          <div className="max-w-md">
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight">
              A plataforma de atendimento inteligente para o seu negócio
            </h2>
            <p className="mt-4 text-cyan-100/80 text-lg leading-relaxed">
              Centralize conversas, automatize respostas com IA e acompanhe métricas em tempo real.
            </p>
          </div>

          {/* Feature list */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 max-w-lg">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/15">
                  <Icon className="w-4.5 h-4.5 text-cyan-100" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-cyan-100/60 leading-snug mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="text-xs text-cyan-200/50">
            © {new Date().getFullYear()} AI Agent Hub. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* ── Right: Login form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-foreground">AI Agent Hub</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Faça login para continuar</p>
            </div>
          </div>

          {/* Form header */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Bem-vindo de volta</h1>
            <p className="text-sm text-muted-foreground mt-1.5">Acesse sua conta para continuar</p>
          </div>

          {/* Card */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-lg shadow-foreground/5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground">
                  <input type="checkbox" className="w-4 h-4 rounded border-border accent-primary" />
                  Lembrar-me
                </label>
                <button type="button" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Esqueceu a senha?
                </button>
              </div>

              {error && (
                <p className={cn(
                  'text-xs text-destructive bg-destructive/10 border border-destructive/20',
                  'rounded-lg px-3 py-2',
                )}>
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando…
                  </>
                ) : 'Entrar'}
              </Button>
            </form>
          </div>

          {/* Sign up hint */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Ainda não tem conta?{' '}
            <button onClick={() => navigate('/register')} className="text-primary hover:text-primary/80 font-semibold transition-colors">
              Criar conta
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
