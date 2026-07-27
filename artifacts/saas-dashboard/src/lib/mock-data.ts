// ─── Mock Data ────────────────────────────────────────────────────────────────
// Used as fallback when the API server is offline.
// All pages use: const items = apiData?.length ? apiData : MOCK_X;

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();

// ── Dashboard stats ──────────────────────────────────────────────────────────
export const MOCK_STATS = {
  totalConversations: 4_821,
  openConversations: 142,
  totalClients: 1_307,
  onlineAgents: 8,
  totalAgents: 14,
  mrr: 28_450,
  mrrGrowth: 12.4,
  avgResponseTime: 47,
  satisfactionScore: 94,
  totalAttendances: 3_659,
};

// ── Sparklines (7-day) ───────────────────────────────────────────────────────
export const SPARKLINES: Record<string, number[]> = {
  conversations: [312, 298, 341, 387, 402, 378, 421],
  clients: [85, 91, 88, 102, 97, 110, 118],
  mrr: [24100, 24800, 25600, 26200, 27100, 27800, 28450],
  response: [52, 49, 55, 48, 44, 47, 43],
};

// ── Conversation volume (30-day) ─────────────────────────────────────────────
export const MOCK_CONV_TREND = Array.from({ length: 30 }, (_, i) => ({
  label: new Date(now.getTime() - (29 - i) * 86_400_000).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }),
  value: Math.floor(200 + Math.random() * 250 + i * 3),
}));

// ── Channel breakdown ────────────────────────────────────────────────────────
export const MOCK_CHANNELS = [
  { channel: 'WhatsApp', count: 3140, percentage: 65 },
  { channel: 'Web Chat', count: 968,  percentage: 20 },
  { channel: 'Email',    count: 483,  percentage: 10 },
  { channel: 'SMS',      count: 242,  percentage: 5  },
];

// ── Recent activity ──────────────────────────────────────────────────────────
export const MOCK_ACTIVITY = [
  { id: '1', title: 'Nova conversa iniciada', description: 'Cliente João Silva via WhatsApp', actor: 'Bot IA', createdAt: daysAgo(0) },
  { id: '2', title: 'Atendimento encerrado', description: 'Problema de cobrança resolvido', actor: 'Ana Costa', createdAt: daysAgo(0) },
  { id: '3', title: 'Novo cliente cadastrado', description: 'Empresa TechCorp adicionada', actor: 'admin', createdAt: daysAgo(0) },
  { id: '4', title: 'Pagamento recebido', description: 'Plano Pro — R$ 297,00', actor: 'sistema', createdAt: daysAgo(1) },
  { id: '5', title: 'Agente ficou offline', description: 'Carlos Mendes desconectado', actor: 'sistema', createdAt: daysAgo(1) },
  { id: '6', title: 'Conversa transferida', description: 'Escalado para suporte humano', actor: 'Bot IA', createdAt: daysAgo(1) },
  { id: '7', title: 'Integração reativada', description: 'WhatsApp reconectado com sucesso', actor: 'sistema', createdAt: daysAgo(2) },
  { id: '8', title: 'Relatório semanal gerado', description: '94% de satisfação esta semana', actor: 'sistema', createdAt: daysAgo(2) },
];

// ── Conversations ─────────────────────────────────────────────────────────────
export const MOCK_CONVERSATIONS = [
  { id: 'c1', clientName: 'João Silva',       agentName: 'Ana Costa',    channel: 'WhatsApp', status: 'open',    lastMessage: 'Preciso de ajuda com minha conta',     unreadCount: 3, updatedAt: daysAgo(0) },
  { id: 'c2', clientName: 'Maria Oliveira',   agentName: 'Bot IA',       channel: 'Web Chat', status: 'open',    lastMessage: 'Qual o prazo de entrega?',              unreadCount: 1, updatedAt: daysAgo(0) },
  { id: 'c3', clientName: 'Carlos Ferreira',  agentName: 'Pedro Lima',   channel: 'WhatsApp', status: 'pending', lastMessage: 'Aguardando retorno do supervisor',      unreadCount: 0, updatedAt: daysAgo(0) },
  { id: 'c4', clientName: 'Fernanda Rocha',   agentName: 'Ana Costa',    channel: 'WhatsApp', status: 'closed',  lastMessage: 'Obrigada pelo atendimento!',            unreadCount: 0, updatedAt: daysAgo(1) },
  { id: 'c5', clientName: 'Roberto Alves',    agentName: 'Bot IA',       channel: 'Email',    status: 'open',    lastMessage: 'Preciso cancelar minha assinatura',     unreadCount: 2, updatedAt: daysAgo(0) },
  { id: 'c6', clientName: 'Juliana Mendes',   agentName: 'Pedro Lima',   channel: 'WhatsApp', status: 'closed',  lastMessage: 'Problema resolvido, muito obrigada',    unreadCount: 0, updatedAt: daysAgo(2) },
  { id: 'c7', clientName: 'André Santos',     agentName: 'Bot IA',       channel: 'Web Chat', status: 'open',    lastMessage: 'Como funciona o plano Enterprise?',    unreadCount: 5, updatedAt: daysAgo(0) },
  { id: 'c8', clientName: 'Patrícia Lima',    agentName: 'Luiza Torres', channel: 'WhatsApp', status: 'pending', lastMessage: 'Aguardando documentação do cliente',    unreadCount: 0, updatedAt: daysAgo(1) },
  { id: 'c9', clientName: 'Marcos Vieira',    agentName: 'Ana Costa',    channel: 'SMS',      status: 'closed',  lastMessage: 'Ok, vou verificar meu e-mail',          unreadCount: 0, updatedAt: daysAgo(3) },
  { id: 'c10',clientName: 'Camila Barbosa',   agentName: 'Bot IA',       channel: 'WhatsApp', status: 'open',    lastMessage: 'Quando vocês ficam disponíveis?',       unreadCount: 1, updatedAt: daysAgo(0) },
];

// ── Clients ───────────────────────────────────────────────────────────────────
export const MOCK_CLIENTS = [
  { id: 'cl1', name: 'João Silva',       email: 'joao@email.com',      phone: '(11) 99999-1111', company: 'JoveTech',    status: 'active',   totalConversations: 14, createdAt: daysAgo(90)  },
  { id: 'cl2', name: 'Maria Oliveira',   email: 'maria@empresa.com',   phone: '(21) 98888-2222', company: 'MarCorp',     status: 'active',   totalConversations: 8,  createdAt: daysAgo(120) },
  { id: 'cl3', name: 'Carlos Ferreira',  email: 'carlos@gmail.com',    phone: '(31) 97777-3333', company: null,          status: 'active',   totalConversations: 3,  createdAt: daysAgo(30)  },
  { id: 'cl4', name: 'Fernanda Rocha',   email: 'fernanda@rocha.com',  phone: '(41) 96666-4444', company: 'RochaLtda',   status: 'inactive', totalConversations: 21, createdAt: daysAgo(200) },
  { id: 'cl5', name: 'Roberto Alves',    email: 'roberto@alves.net',   phone: '(51) 95555-5555', company: 'AlvesGroup',  status: 'active',   totalConversations: 6,  createdAt: daysAgo(60)  },
  { id: 'cl6', name: 'Juliana Mendes',   email: 'juliana@m.com',       phone: '(61) 94444-6666', company: 'MendesSA',    status: 'active',   totalConversations: 11, createdAt: daysAgo(45)  },
  { id: 'cl7', name: 'André Santos',     email: 'andre@santos.io',     phone: '(71) 93333-7777', company: 'SantosTech',  status: 'active',   totalConversations: 2,  createdAt: daysAgo(10)  },
  { id: 'cl8', name: 'Patrícia Lima',    email: 'patricia@lima.com',   phone: '(81) 92222-8888', company: 'LimaInc',     status: 'inactive', totalConversations: 17, createdAt: daysAgo(300) },
];

// ── Agents ───────────────────────────────────────────────────────────────────
export const MOCK_AGENTS = [
  { id: 'a1', name: 'Ana Costa',      email: 'ana@aiagent.com',     role: 'Senior Agent',   status: 'online',  activeConversations: 4,  totalAttendances: 842, satisfactionScore: 97 },
  { id: 'a2', name: 'Pedro Lima',     email: 'pedro@aiagent.com',   role: 'Agent',          status: 'online',  activeConversations: 3,  totalAttendances: 531, satisfactionScore: 93 },
  { id: 'a3', name: 'Luiza Torres',   email: 'luiza@aiagent.com',   role: 'Agent',          status: 'busy',    activeConversations: 5,  totalAttendances: 401, satisfactionScore: 91 },
  { id: 'a4', name: 'Carlos Mendes',  email: 'carlos@aiagent.com',  role: 'Agent',          status: 'offline', activeConversations: 0,  totalAttendances: 298, satisfactionScore: 88 },
  { id: 'a5', name: 'Bot IA — João',  email: 'bot1@aiagent.com',    role: 'AI Agent',       status: 'online',  activeConversations: 12, totalAttendances: 2341,satisfactionScore: 89 },
  { id: 'a6', name: 'Bot IA — Maria', email: 'bot2@aiagent.com',    role: 'AI Agent',       status: 'online',  activeConversations: 9,  totalAttendances: 1876,satisfactionScore: 87 },
];

// ── Attendances ───────────────────────────────────────────────────────────────
export const MOCK_ATTENDANCES = [
  { id: 'at1', clientName: 'João Silva',     agentName: 'Ana Costa',    channel: 'WhatsApp', status: 'resolved', startedAt: daysAgo(0),  endedAt: daysAgo(0), durationSeconds: 423,  notes: 'Problema de login resolvido' },
  { id: 'at2', clientName: 'Maria Oliveira', agentName: 'Pedro Lima',   channel: 'Web Chat', status: 'resolved', startedAt: daysAgo(0),  endedAt: daysAgo(0), durationSeconds: 187,  notes: 'Dúvida sobre prazo' },
  { id: 'at3', clientName: 'Carlos Ferreira',agentName: 'Bot IA — João',channel: 'WhatsApp', status: 'escalated',startedAt: daysAgo(1),  endedAt: daysAgo(1), durationSeconds: 654,  notes: 'Escalado para equipe financeira' },
  { id: 'at4', clientName: 'Fernanda Rocha', agentName: 'Ana Costa',    channel: 'Email',    status: 'resolved', startedAt: daysAgo(1),  endedAt: daysAgo(1), durationSeconds: 312,  notes: null },
  { id: 'at5', clientName: 'Roberto Alves',  agentName: 'Luiza Torres', channel: 'WhatsApp', status: 'open',     startedAt: daysAgo(1),  endedAt: null,       durationSeconds: null, notes: 'Em andamento' },
  { id: 'at6', clientName: 'Juliana Mendes', agentName: 'Bot IA — Maria',channel:'WhatsApp', status: 'resolved', startedAt: daysAgo(2),  endedAt: daysAgo(2), durationSeconds: 89,   notes: null },
  { id: 'at7', clientName: 'André Santos',   agentName: 'Pedro Lima',   channel: 'Web Chat', status: 'resolved', startedAt: daysAgo(2),  endedAt: daysAgo(2), durationSeconds: 543,  notes: 'Migração de plano concluída' },
  { id: 'at8', clientName: 'Patrícia Lima',  agentName: 'Ana Costa',    channel: 'WhatsApp', status: 'resolved', startedAt: daysAgo(3),  endedAt: daysAgo(3), durationSeconds: 231,  notes: null },
];

// ── Users ─────────────────────────────────────────────────────────────────────
export const MOCK_USERS = [
  { id: 'u1', name: 'Operador Admin', email: 'admin@aiagent.com',   role: 'admin',  status: 'active',   lastLogin: daysAgo(0) },
  { id: 'u2', name: 'Ana Costa',     email: 'ana@aiagent.com',     role: 'member', status: 'active',   lastLogin: daysAgo(0) },
  { id: 'u3', name: 'Pedro Lima',    email: 'pedro@aiagent.com',   role: 'member', status: 'active',   lastLogin: daysAgo(1) },
  { id: 'u4', name: 'Luiza Torres',  email: 'luiza@aiagent.com',   role: 'member', status: 'active',   lastLogin: daysAgo(0) },
  { id: 'u5', name: 'Carlos Mendes', email: 'carlos@aiagent.com',  role: 'member', status: 'inactive', lastLogin: daysAgo(14) },
  { id: 'u6', name: 'Financeiro',    email: 'finance@aiagent.com', role: 'viewer', status: 'active',   lastLogin: daysAgo(3) },
];

// ── Plans ─────────────────────────────────────────────────────────────────────
export const MOCK_PLANS = [
  {
    id: 'p1', name: 'Starter', description: 'Ideal para pequenas equipes começando com IA',
    price: 97, interval: 'month', isActive: true, subscriberCount: 48,
    maxAgents: 3, maxConversations: 500,
    features: ['3 agentes IA', '500 conversas/mês', 'Suporte por e-mail', 'Dashboard básico', 'Integração WhatsApp'],
  },
  {
    id: 'p2', name: 'Pro', description: 'Para equipes em crescimento com alto volume',
    price: 297, interval: 'month', isActive: true, subscriberCount: 31,
    maxAgents: 10, maxConversations: 2000,
    features: ['10 agentes IA', '2.000 conversas/mês', 'Suporte prioritário', 'Relatórios avançados', 'Todas as integrações', 'API access'],
  },
  {
    id: 'p3', name: 'Enterprise', description: 'Escala ilimitada com suporte dedicado',
    price: 897, interval: 'month', isActive: true, subscriberCount: 7,
    maxAgents: null, maxConversations: null,
    features: ['Agentes ilimitados', 'Conversas ilimitadas', 'Gerente de conta dedicado', 'SLA 99.9%', 'SSO & controles avançados', 'Onboarding personalizado'],
  },
];

// ── Financial ─────────────────────────────────────────────────────────────────
export const MOCK_TRANSACTIONS = [
  { id: 'tx1', description: 'Plano Pro — Acme Corp',      amount: 297,  type: 'income',  status: 'paid',    clientName: 'Acme Corp',    planName: 'Pro',       dueDate: daysAgo(5) },
  { id: 'tx2', description: 'Plano Starter — JoveTech',   amount: 97,   type: 'income',  status: 'paid',    clientName: 'JoveTech',     planName: 'Starter',   dueDate: daysAgo(3) },
  { id: 'tx3', description: 'Plano Enterprise — MarCorp', amount: 897,  type: 'income',  status: 'paid',    clientName: 'MarCorp',      planName: 'Enterprise',dueDate: daysAgo(1) },
  { id: 'tx4', description: 'Plano Pro — RochaLtda',      amount: 297,  type: 'income',  status: 'pending', clientName: 'RochaLtda',    planName: 'Pro',       dueDate: daysAgo(-5) },
  { id: 'tx5', description: 'Plano Starter — AlvesGroup', amount: 97,   type: 'income',  status: 'overdue', clientName: 'AlvesGroup',   planName: 'Starter',   dueDate: daysAgo(10) },
  { id: 'tx6', description: 'Infraestrutura AWS',         amount: 1240, type: 'expense', status: 'paid',    clientName: null,           planName: null,        dueDate: daysAgo(1) },
  { id: 'tx7', description: 'Licença OpenAI',             amount: 380,  type: 'expense', status: 'paid',    clientName: null,           planName: null,        dueDate: daysAgo(2) },
  { id: 'tx8', description: 'Plano Pro — SantosTech',     amount: 297,  type: 'income',  status: 'paid',    clientName: 'SantosTech',   planName: 'Pro',       dueDate: daysAgo(7) },
];

export const MOCK_FINANCIAL_TREND = Array.from({ length: 12 }, (_, i) => ({
  label: new Date(2025, i, 1).toLocaleDateString('pt-BR', { month: 'short' }),
  value: Math.floor(14000 + i * 1300 + Math.random() * 800),
}));

// ── Integrations ──────────────────────────────────────────────────────────────
export const MOCK_INTEGRATIONS = [
  { id: 'i1', name: 'WhatsApp Business', type: 'whatsapp', description: 'Conecte números WhatsApp via Evolution API para enviar e receber mensagens.',     isActive: true,  status: 'connected', connectedAt: daysAgo(60) },
  { id: 'i2', name: 'OpenAI GPT-4o',    type: 'openai',   description: 'Motor de IA para processamento de linguagem natural e geração de respostas.',      isActive: true,  status: 'connected', connectedAt: daysAgo(60) },
  { id: 'i3', name: 'Stripe Payments',  type: 'stripe',   description: 'Processe pagamentos e gerencie assinaturas de forma automática.',                  isActive: true,  status: 'connected', connectedAt: daysAgo(30) },
  { id: 'i4', name: 'Slack',            type: 'slack',    description: 'Receba notificações de novos atendimentos e alertas no Slack da sua equipe.',       isActive: false, status: 'disconnected', connectedAt: null },
  { id: 'i5', name: 'Webhook genérico', type: 'webhook',  description: 'Envie eventos para sistemas externos via HTTP POST configurável.',                  isActive: false, status: 'disconnected', connectedAt: null },
  { id: 'i6', name: 'Salesforce CRM',  type: 'crm',      description: 'Sincronize contatos e conversas com o Salesforce automaticamente.',                 isActive: false, status: 'disconnected', connectedAt: null },
];

// ── Reports ───────────────────────────────────────────────────────────────────
export const MOCK_AGENT_REPORT = [
  { agentId: 'a1', name: 'Ana Costa',       attendances: 842,  avgDuration: 312, satisfaction: 97, resolutionRate: 96 },
  { agentId: 'a2', name: 'Pedro Lima',      attendances: 531,  avgDuration: 287, satisfaction: 93, resolutionRate: 91 },
  { agentId: 'a3', name: 'Luiza Torres',    attendances: 401,  avgDuration: 345, satisfaction: 91, resolutionRate: 89 },
  { agentId: 'a4', name: 'Carlos Mendes',   attendances: 298,  avgDuration: 401, satisfaction: 88, resolutionRate: 85 },
  { agentId: 'a5', name: 'Bot IA — João',   attendances: 2341, avgDuration: 89,  satisfaction: 89, resolutionRate: 78 },
  { agentId: 'a6', name: 'Bot IA — Maria',  attendances: 1876, avgDuration: 94,  satisfaction: 87, resolutionRate: 76 },
];
