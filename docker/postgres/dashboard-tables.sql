-- =============================================================================
-- dashboard-tables.sql — Creates the dashboard_* tables (Drizzle schema)
-- Used in Base44 setup because drizzle-kit push requires a TTY for interactive
-- prompts which isn't available in non-interactive Docker containers.
-- =============================================================================

CREATE TABLE IF NOT EXISTS dashboard_conversations (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id       TEXT,
  client_name     TEXT,
  agent_id        TEXT,
  agent_name      TEXT,
  status          TEXT NOT NULL DEFAULT 'open',
  channel         TEXT NOT NULL DEFAULT 'whatsapp',
  last_message    TEXT NOT NULL DEFAULT '',
  unread_count    INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_clients (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name                TEXT NOT NULL,
  email               TEXT,
  phone               TEXT,
  company             TEXT,
  status              TEXT NOT NULL DEFAULT 'active',
  total_conversations INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_agents (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name                TEXT NOT NULL,
  email               TEXT NOT NULL,
  role                TEXT NOT NULL DEFAULT 'agent',
  status              TEXT NOT NULL DEFAULT 'offline',
  avatar              TEXT,
  active_conversations INTEGER NOT NULL DEFAULT 0,
  total_attendances    INTEGER NOT NULL DEFAULT 0,
  satisfaction_score   REAL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_attendances (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id  TEXT,
  client_id        TEXT,
  client_name      TEXT,
  agent_id         TEXT,
  agent_name       TEXT,
  status           TEXT NOT NULL DEFAULT 'pending',
  channel          TEXT,
  started_at       TIMESTAMPTZ,
  ended_at         TIMESTAMPTZ,
  duration_seconds INTEGER,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_users (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member',
  status      TEXT NOT NULL DEFAULT 'active',
  avatar      TEXT,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_plans (
  id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name               TEXT NOT NULL,
  description        TEXT,
  price              REAL NOT NULL,
  interval           TEXT NOT NULL DEFAULT 'month',
  max_agents         INTEGER,
  max_conversations  INTEGER,
  features           TEXT[] NOT NULL DEFAULT '{}',
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  subscriber_count   INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_transactions (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  description   TEXT NOT NULL,
  amount        REAL NOT NULL,
  type          TEXT NOT NULL DEFAULT 'income',
  status        TEXT NOT NULL DEFAULT 'pending',
  client_id     TEXT,
  client_name   TEXT,
  plan_id       TEXT,
  plan_name     TEXT,
  due_date      TIMESTAMPTZ,
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_integrations (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL,
  description  TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT FALSE,
  status       TEXT NOT NULL DEFAULT 'disconnected',
  icon         TEXT,
  connected_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_settings (
  id                       TEXT PRIMARY KEY DEFAULT 'default',
  company_name             TEXT,
  website                  TEXT,
  support_email            TEXT,
  phone                    TEXT,
  timezone                 TEXT NOT NULL DEFAULT 'brt',
  language                 TEXT NOT NULL DEFAULT 'pt',
  date_format              TEXT NOT NULL DEFAULT 'dmy',
  time_format              TEXT NOT NULL DEFAULT '24',
  notif_new_conversation   BOOLEAN NOT NULL DEFAULT TRUE,
  notif_agent_assignment   BOOLEAN NOT NULL DEFAULT TRUE,
  notif_escalation         BOOLEAN NOT NULL DEFAULT TRUE,
  notif_payment_update     BOOLEAN NOT NULL DEFAULT TRUE,
  notif_agent_offline      BOOLEAN NOT NULL DEFAULT FALSE,
  notif_weekly_report      BOOLEAN NOT NULL DEFAULT FALSE,
  notif_conversation_limit BOOLEAN NOT NULL DEFAULT TRUE,
  twofa_enabled            BOOLEAN NOT NULL DEFAULT FALSE,
  login_notification       BOOLEAN NOT NULL DEFAULT TRUE,
  evolution_url            TEXT,
  evolution_key            TEXT,
  webhook_secret           TEXT,
  whatsapp_connected       BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_phone           TEXT,
  bot_auto_reconnect       BOOLEAN NOT NULL DEFAULT TRUE,
  bot_escalate_silence     BOOLEAN NOT NULL DEFAULT TRUE,
  bot_log_all              BOOLEAN NOT NULL DEFAULT TRUE,
  subscription_status      TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id       TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_messages (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL,
  sender          TEXT NOT NULL DEFAULT 'agent',
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_messages_conversation ON dashboard_messages (conversation_id, created_at);
