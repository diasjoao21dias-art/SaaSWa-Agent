-- =============================================================================
-- dashboard-seed.sql — Demo data for the dashboard_* tables
-- Run after dashboard-tables.sql to populate the dashboard with realistic data.
-- =============================================================================

-- ─── Agents ──────────────────────────────────────────────────────────────────
INSERT INTO dashboard_agents (id, name, email, role, status, active_conversations, total_attendances, satisfaction_score, created_at) VALUES
  ('ag-001', 'Ana Silva', 'ana.silva@demo.com', 'agent', 'online',  5, 142, 96, NOW() - INTERVAL '60 days'),
  ('ag-002', 'Bruno Costa', 'bruno.costa@demo.com', 'agent', 'online', 3, 98, 90, NOW() - INTERVAL '55 days'),
  ('ag-003', 'Carla Mendes', 'carla.mendes@demo.com', 'supervisor', 'online', 2, 210, 98, NOW() - INTERVAL '90 days'),
  ('ag-004', 'Diego Santos', 'diego.santos@demo.com', 'agent', 'offline', 0, 67, 84, NOW() - INTERVAL '40 days'),
  ('ag-005', 'Eva Oliveira', 'eva.oliveira@demo.com', 'agent', 'offline', 0, 45, 80, NOW() - INTERVAL '30 days'),
  ('ag-006', 'Felipe Souza', 'felipe.souza@demo.com', 'admin', 'online', 1, 30, 94, NOW() - INTERVAL '20 days')
ON CONFLICT DO NOTHING;

-- ─── Clients ─────────────────────────────────────────────────────────────────
INSERT INTO dashboard_clients (id, name, email, phone, company, status, total_conversations, created_at) VALUES
  ('cl-001', 'Mercado Central', 'contato@mercadocentral.com', '+55 11 98765-4321', 'Mercado Central LTDA', 'active', 24, NOW() - INTERVAL '45 days'),
  ('cl-002', 'João Pereira', 'joao.pereira@email.com', '+55 11 91234-5678', 'Pereira Importados', 'active', 18, NOW() - INTERVAL '40 days'),
  ('cl-003', 'Farmácia Saúde', 'admin@farmaciasaude.com', '+55 21 99876-5432', 'Farmácia Saúde SA', 'active', 31, NOW() - INTERVAL '35 days'),
  ('cl-004', 'Maria Fernandes', 'maria.fern@email.com', '+55 21 98765-1234', NULL, 'active', 7, NOW() - INTERVAL '25 days'),
  ('cl-005', 'Tech Solutions', 'suporte@techsolutions.com', '+55 11 95555-4444', 'Tech Solutions Ltda', 'active', 42, NOW() - INTERVAL '50 days'),
  ('cl-006', 'Restaurante Bom Sabor', 'contato@bomsabor.com', '+55 31 98456-7890', 'Bom Savor ME', 'inactive', 3, NOW() - INTERVAL '60 days'),
  ('cl-007', 'Carlos Eduardo', 'carloseduardo@email.com', '+55 31 97777-8888', NULL, 'active', 12, NOW() - INTERVAL '15 days'),
  ('cl-008', 'Loja Fashion', 'vendas@lojafashion.com', '+55 11 93333-2222', 'Fashion Retail SA', 'active', 19, NOW() - INTERVAL '20 days'),
  ('cl-009', 'Pedro Almeida', 'pedro.almeida@email.com', '+55 47 98123-4567', NULL, 'inactive', 1, NOW() - INTERVAL '70 days'),
  ('cl-010', 'Construtora Horizonte', 'obras@horizonte.com', '+55 11 94444-5555', 'Horizonte Construções', 'active', 28, NOW() - INTERVAL '10 days')
ON CONFLICT DO NOTHING;

-- ─── Conversations (last 30 days) ─────────────────────────────────────────────
-- Generate conversations spread across 30 days using a CTE series
DO $$
DECLARE
  statuses TEXT[] := ARRAY['open', 'open', 'open', 'pending', 'pending', 'closed', 'closed', 'closed'];
  channels TEXT[] := ARRAY['WhatsApp', 'WhatsApp', 'WhatsApp', 'Web Chat', 'Email', 'SMS'];
  clients TEXT[] := ARRAY['cl-001','cl-002','cl-003','cl-004','cl-005','cl-006','cl-007','cl-008','cl-009','cl-010'];
  client_names TEXT[] := ARRAY['Mercado Central','João Pereira','Farmácia Saúde','Maria Fernandes','Tech Solutions','Restaurante Bom Sabor','Carlos Eduardo','Loja Fashion','Pedro Almeida','Construtora Horizonte'];
  agents TEXT[] := ARRAY['ag-001','ag-002','ag-003','ag-004','ag-005','ag-006'];
  agent_names TEXT[] := ARRAY['Ana Silva','Bruno Costa','Carla Mendes','Diego Santos','Eva Oliveira','Felipe Souza'];
  messages TEXT[] := ARRAY[
    'Olá, preciso de ajuda com meu pedido',
    'Qual o status do meu atendimento?',
    'Obrigado pelo suporte!',
    'Gostaria de falar com um atendente',
    'Quando será entregue?',
    'Preciso cancelar minha assinatura',
    'Podemos agendar uma reunião?',
    'Estou com problemas no pagamento',
    'Como faço para upgrade do plano?',
    'Perfeito, muito obrigado!'
  ];
  i INT;
  days_ago INT;
  conv_id TEXT;
BEGIN
  FOR i IN 1..28 LOOP
    days_ago := FLOOR(RANDOM() * 30);
    conv_id := 'conv-' || lpad(i::text, 3, '0');
    INSERT INTO dashboard_conversations (id, client_id, client_name, agent_id, agent_name, status, channel, last_message, unread_count, created_at, updated_at)
    VALUES (
      conv_id,
      clients[1 + FLOOR(RANDOM() * 10)],
      client_names[1 + FLOOR(RANDOM() * 10)],
      agents[1 + FLOOR(RANDOM() * 6)],
      agent_names[1 + FLOOR(RANDOM() * 6)],
      statuses[1 + FLOOR(RANDOM() * 8)],
      channels[1 + FLOOR(RANDOM() * 6)],
      messages[1 + FLOOR(RANDOM() * 10)],
      CASE WHEN RANDOM() > 0.7 THEN FLOOR(RANDOM() * 3 + 1)::int ELSE 0 END,
      NOW() - (days_ago || ' days')::interval - (FLOOR(RANDOM() * 24) || ' hours')::interval,
      NOW() - (days_ago || ' days')::interval - (FLOOR(RANDOM() * 24) || ' hours')::interval + (FLOOR(RANDOM() * 60) || ' minutes')::interval
    );
  END LOOP;
END $$;

-- ─── Attendances ─────────────────────────────────────────────────────────────
INSERT INTO dashboard_attendances (id, conversation_id, client_id, client_name, agent_id, agent_name, status, channel, started_at, ended_at, duration_seconds, notes, created_at) VALUES
  ('att-001', 'conv-001', 'cl-001', 'Mercado Central', 'ag-001', 'Ana Silva', 'resolved', 'WhatsApp', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '12 minutes', 720, 'Cliente satisfeito com a resolução', NOW() - INTERVAL '5 days'),
  ('att-002', 'conv-002', 'cl-003', 'Farmácia Saúde', 'ag-003', 'Carla Mendes', 'resolved', 'WhatsApp', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days' + INTERVAL '8 minutes', 480, 'Dúvida sobre faturamento esclarecida', NOW() - INTERVAL '4 days'),
  ('att-003', 'conv-003', 'cl-005', 'Tech Solutions', 'ag-002', 'Bruno Costa', 'open', 'Web Chat', NOW() - INTERVAL '10 minutes', NULL, NULL, 'Em atendimento', NOW() - INTERVAL '10 minutes'),
  ('att-004', 'conv-004', 'cl-002', 'João Pereira', 'ag-006', 'Felipe Souza', 'escalated', 'WhatsApp', NULL, NULL, NULL, 'Aguardando atribuição', NOW() - INTERVAL '30 minutes'),
  ('att-005', 'conv-005', 'cl-008', 'Loja Fashion', 'ag-001', 'Ana Silva', 'resolved', 'WhatsApp', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '15 minutes', 900, 'Upgrade de plano realizado', NOW() - INTERVAL '3 days'),
  ('att-006', 'conv-006', 'cl-007', 'Carlos Eduardo', 'ag-004', 'Diego Santos', 'resolved', 'WhatsApp', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '5 minutes', 300, 'Problema técnico resolvido', NOW() - INTERVAL '2 days'),
  ('att-007', 'conv-007', 'cl-010', 'Construtora Horizonte', 'ag-003', 'Carla Mendes', 'resolved', 'WhatsApp', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '20 minutes', 1200, 'Reunião agendada para próxima semana', NOW() - INTERVAL '1 day'),
  ('att-008', 'conv-008', 'cl-001', 'Mercado Central', 'ag-002', 'Bruno Costa', 'open', 'WhatsApp', NOW() - INTERVAL '5 minutes', NULL, NULL, 'Cliente relatando problema com integração', NOW() - INTERVAL '5 minutes'),
  ('att-009', 'conv-009', 'cl-004', 'Maria Fernandes', 'ag-005', 'Eva Oliveira', 'escalated', 'WhatsApp', NULL, NULL, NULL, 'Solicita contato', NOW() - INTERVAL '2 hours'),
  ('att-010', 'conv-010', 'cl-006', 'Restaurante Bom Sabor', 'ag-001', 'Ana Silva', 'resolved', 'WhatsApp', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '3 minutes', 180, 'Cliente inativo, tentativa de reativamento', NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- ─── Users ───────────────────────────────────────────────────────────────────
INSERT INTO dashboard_users (id, name, email, role, status, last_login, created_at) VALUES
  ('usr-001', 'Administrador', 'admin@demo.com', 'admin', 'active', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '60 days'),
  ('usr-002', 'Gerente de operações', 'gerente@demo.com', 'admin', 'active', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '45 days'),
  ('usr-003', 'Supervisor Silva', 'supervisor@demo.com', 'member', 'active', NOW() - INTERVAL '1 day', NOW() - INTERVAL '30 days'),
  ('usr-004', 'Analista JR', 'analista@demo.com', 'viewer', 'active', NOW() - INTERVAL '3 days', NOW() - INTERVAL '15 days'),
  ('usr-005', 'Guest User', 'guest@demo.com', 'viewer', 'inactive', NULL, NOW() - INTERVAL '10 days')
ON CONFLICT DO NOTHING;

-- ─── Plans ────────────────────────────────────────────────────────────────────
INSERT INTO dashboard_plans (id, name, description, price, interval, max_agents, max_conversations, features, is_active, subscriber_count, created_at) VALUES
  ('pln-001', 'Starter', 'Ideal para pequenas empresas', 99.00, 'month', 3, 500, ARRAY['3 agentes', '500 conversas/mês', 'WhatsApp + Web Chat', 'Relatórios básicos'], true, 42, NOW() - INTERVAL '90 days'),
  ('pln-002', 'Professional', 'Para empresas em crescimento', 299.00, 'month', 10, 2000, ARRAY['10 agentes', '2.000 conversas/mês', 'Todos os canais', 'Relatórios avançados', 'Integrações premium', 'Suporte prioritário'], true, 87, NOW() - INTERVAL '90 days'),
  ('pln-003', 'Enterprise', 'Para grandes operações', 799.00, 'month', 999, 10000, ARRAY['Agentes ilimitados', 'Conversas ilimitadas', 'API completa', 'White label', 'Gerente dedicado', 'SLA 99.9%'], true, 23, NOW() - INTERVAL '90 days'),
  ('pln-004', 'Annual Pro', 'Plano anual com desconto', 2990.00, 'year', 10, 2000, ARRAY['Mesmos recursos do Professional', '2 meses grátis', 'Suporte prioritário'], true, 15, NOW() - INTERVAL '90 days')
ON CONFLICT DO NOTHING;

-- ─── Transactions (last 12 months) ───────────────────────────────────────────
DO $$
DECLARE
  i INT;
  months_ago INT;
  tx_id TEXT;
  descriptions_income TEXT[] := ARRAY['Assinatura Plano Professional', 'Assinatura Plano Starter', 'Assinatura Plano Enterprise', 'Upgrade de plano', 'Taxa de setup', 'Assinatura anual', 'Receita adicional'];
  descriptions_expense TEXT[] := ARRAY['Pagamento API Evolution', 'Servidor AWS', 'Licença OpenAI', 'Manutenção infra', 'Custos de SMS', 'Custos de email'];
  client_names TEXT[] := ARRAY['Mercado Central','João Pereira','Farmácia Saúde','Tech Solutions','Loja Fashion','Construtora Horizonte','Carlos Eduardo','Restaurante Bom Sabor'];
  plan_names TEXT[] := ARRAY['Starter','Professional','Enterprise','Annual Pro'];
  tx_type TEXT;
  tx_status TEXT;
  tx_amount REAL;
BEGIN
  FOR i IN 1..40 LOOP
    months_ago := FLOOR(RANDOM() * 12);
    tx_id := 'txn-' || lpad(i::text, 3, '0');
    IF RANDOM() > 0.25 THEN
      tx_type := 'income';
      tx_status := CASE WHEN RANDOM() > 0.15 THEN 'paid' ELSE 'pending' END;
      tx_amount := CASE FLOOR(RANDOM() * 4)
        WHEN 0 THEN 99.00
        WHEN 1 THEN 299.00
        WHEN 2 THEN 799.00
        ELSE 2990.00
      END;
      INSERT INTO dashboard_transactions (id, description, amount, type, status, client_name, plan_name, paid_at, created_at)
      VALUES (
        tx_id,
        descriptions_income[1 + FLOOR(RANDOM() * 7)],
        tx_amount,
        tx_type,
        tx_status,
        client_names[1 + FLOOR(RANDOM() * 8)],
        plan_names[1 + FLOOR(RANDOM() * 4)],
        CASE WHEN tx_status = 'paid' THEN NOW() - (months_ago || ' months')::interval ELSE NULL END,
        NOW() - (months_ago || ' months')::interval - (FLOOR(RANDOM() * 30) || ' days')::interval
      );
    ELSE
      tx_type := 'expense';
      tx_status := 'paid';
      tx_amount := ROUND((RANDOM() * 500 + 50)::numeric, 2);
      INSERT INTO dashboard_transactions (id, description, amount, type, status, created_at)
      VALUES (
        tx_id,
        descriptions_expense[1 + FLOOR(RANDOM() * 6)],
        tx_amount,
        tx_type,
        tx_status,
        NOW() - (months_ago || ' months')::interval - (FLOOR(RANDOM() * 30) || ' days')::interval
      );
    END IF;
  END LOOP;
END $$;

-- ─── Integrations ────────────────────────────────────────────────────────────
INSERT INTO dashboard_integrations (id, name, type, description, is_active, status, icon, connected_at, created_at) VALUES
  ('int-001', 'Evolution API', 'whatsapp', 'Conexão WhatsApp via Evolution API', true, 'connected', 'whatsapp', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  ('int-002', 'OpenAI', 'openai', 'GPT-4 para respostas automáticas', true, 'connected', 'openai', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
  ('int-003', 'SendGrid', 'slack', 'Servidor de e-mail transacional', false, 'disconnected', 'slack', NULL, NOW() - INTERVAL '20 days'),
  ('int-004', 'Stripe', 'stripe', 'Processamento de pagamentos', true, 'connected', 'stripe', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  ('int-005', 'Twilio SMS', 'webhook', 'Envio de SMS automatizado', false, 'disconnected', 'webhook', NULL, NOW() - INTERVAL '10 days')
ON CONFLICT DO NOTHING;
