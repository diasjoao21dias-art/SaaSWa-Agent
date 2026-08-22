/**
 * Register — cadastro de novo cliente (empresa) com escolha de plano.
 * Multi-step: 1) Dados da empresa + administrador  2) Escolher plano
 */
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Bot, Eye, EyeOff, Loader2, Check, ArrowLeft, ArrowRight, Building2, User, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  isActive: boolean;
  maxAgents: number;
  maxConversations: number;
  features: string[];
}

export default function Register() {
  const { login } = useAuth();
  const [, navigate] = useLocation();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Step 1 fields
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/plans`);
      if (!res.ok) throw new Error('Falha ao carregar planos');
      return res.json();
    },
  });

  function slugify(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
  }

  function validateStep1(): string | null {
    if (companyName.trim().length < 2) return 'Informe o nome da empresa';
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(companyEmail)) return 'E-mail da empresa inválido';
    if (ownerName.trim().length < 2) return 'Informe seu nome';
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(ownerEmail)) return 'E-mail inválido';
    if (ownerPassword.length < 8) return 'A senha deve ter no mínimo 8 caracteres';
    return null;
  }

  function handleNextStep() {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError(null);
    setStep(2);
  }

  async function handleRegister() {
    if (!selectedPlan) { setError('Selecione um plano'); return; }
    setError(null);
    setLoading(true);

    try {
      // 1. Register tenant
      const res = await fetch(`${BASE}/api/v1/tenants/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName.trim(),
          slug: slugify(companyName) || `tenant-${Date.now()}`,
          email: companyEmail.trim().toLowerCase(),
          phone: companyPhone.trim() || undefined,
          ownerName: ownerName.trim(),
          ownerEmail: ownerEmail.trim().toLowerCase(),
          ownerPassword: ownerPassword,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? 'Erro ao criar conta');
      }

      // 2. Auto-login
      await login(ownerEmail.trim(), ownerPassword);

      // 3. If Stripe is configured, redirect to checkout for the selected plan
      const plan = plans.find(p => p.id === selectedPlan);
      const configRes = await fetch(`${BASE}/api/stripe/config`);
      const config = await configRes.json().catch(() => ({}));

      if (config.configured && plan) {
        const checkoutRes = await fetch(`${BASE}/api/stripe/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: plan.id,
            planName: plan.name,
            amount: plan.price,
            interval: plan.interval,
          }),
        });
        const checkout = await checkoutRes.json().catch(() => ({}));
        if (checkout.url) {
          window.location.href = checkout.url;
          return;
        }
      }

      // No Stripe — go to dashboard
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
      setStep(1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left: Branding panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-cyan-600 via-teal-700 to-cyan-900">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white">
          <button onClick={() => navigate('/login')} className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20 group-hover:bg-white/20 transition-colors">
              <Bot className="w-6 h-6" />
            </div>
            <span className="text-xl font-semibold tracking-tight">AI Agent Hub</span>
          </button>

          <div className="max-w-md">
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight">
              Comece gratuitamente em poucos minutos
            </h2>
            <p className="mt-4 text-cyan-100/80 text-lg leading-relaxed">
              Crie sua conta, escolha seu plano e comece a atender seus clientes com IA.
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-3">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all',
                  step >= s ? 'bg-white/20 text-white' : 'bg-white/5 text-cyan-100/40',
                )}>
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                    step > s ? 'bg-white text-teal-700' : step === s ? 'bg-white/30' : 'bg-white/10',
                  )}>
                    {step > s ? <Check className="w-3 h-3" /> : s}
                  </div>
                  {s === 1 ? 'Sua conta' : 'Plano'}
                </div>
                {s === 1 && <div className={cn('w-8 h-px', step > 1 ? 'bg-white/30' : 'bg-white/10')} />}
              </div>
            ))}
          </div>

          <p className="text-xs text-cyan-200/50">
            © {new Date().getFullYear()} AI Agent Hub. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* ── Right: Form area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-2xl">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">AI Agent Hub</span>
          </div>

          {/* Step header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              {step === 1 ? <Building2 className="w-5 h-5 text-primary" /> : <CreditCard className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                {step === 1 ? 'Criar sua conta' : 'Escolha seu plano'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {step === 1 ? 'Passo 1 de 2 — Dados da empresa' : 'Passo 2 de 2 — Selecione o plano ideal'}
              </p>
            </div>
          </div>

          {/* ── Step 1: Company + Owner ────────────────────────────────── */}
          {step === 1 && (
            <Card className="border-border rounded-2xl p-6 sm:p-8 shadow-lg shadow-foreground/5">
              <div className="space-y-5">
                {/* Company section */}
                <div>
                  <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    <Building2 className="w-4 h-4" /> Empresa
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nome da empresa *</Label>
                      <Input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Corporation" autoFocus className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">E-mail da empresa *</Label>
                      <Input id="companyEmail" type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} placeholder="contato@acme.com" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">Telefone</Label>
                      <Input id="companyPhone" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} placeholder="+55 11 99999-9999" className="h-11" />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Owner section */}
                <div>
                  <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    <User className="w-4 h-4" /> Administrador
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Seu nome *</Label>
                      <Input id="ownerName" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="João Silva" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ownerEmail">Seu e-mail *</Label>
                      <Input id="ownerEmail" type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} placeholder="joao@acme.com" className="h-11" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="ownerPassword">Senha *</Label>
                      <div className="relative">
                        <Input id="ownerPassword" type={showPass ? 'text' : 'password'} value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="h-11 pr-10" />
                        <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <Button onClick={handleNextStep} className="w-full h-11 text-sm font-semibold">
                  Continuar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Já tem conta?{' '}
                  <button onClick={() => navigate('/login')} className="text-primary hover:text-primary/80 font-semibold transition-colors">
                    Entrar
                  </button>
                </p>
              </div>
            </Card>
          )}

          {/* ── Step 2: Plan selection ─────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                {plans.filter(p => p.isActive).map(plan => (
                  <Card
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={cn(
                      'cursor-pointer rounded-2xl p-5 transition-all relative',
                      selectedPlan === plan.id
                        ? 'border-primary ring-2 ring-primary/30 shadow-lg'
                        : 'border-border hover:border-primary/50 hover:shadow-md',
                    )}
                  >
                    {selectedPlan === plan.id && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    )}
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-2xl font-bold text-foreground">R$ {plan.price}</span>
                      <span className="text-sm text-muted-foreground">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-primary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="h-11 px-6" disabled={loading}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
                <Button onClick={handleRegister} className="flex-1 h-11 text-sm font-semibold" disabled={loading || !selectedPlan}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando conta…
                    </>
                  ) : 'Criar conta e começar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
