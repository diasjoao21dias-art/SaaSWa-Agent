-- =============================================================================
-- Migration: Add Attendance and FinancialTransaction models
--
-- Purpose: Introduce the two entity tables required for dashboard reporting
-- (attendances) and billing/financial visibility (financial_transactions).
--
-- Design notes:
--   - Both tables are fully multi-tenant: every row carries tenant_id with a
--     CASCADE foreign key to tenants, consistent with all other models.
--   - Denormalized snapshot columns (client_name, agent_name, plan_name) are
--     intentional: they preserve historical labels even after the source rows
--     are renamed or soft-deleted.
--   - amount uses DECIMAL(12,2) — never FLOAT/REAL for financial data.
--   - All tables follow the project's soft-delete convention (deleted_at).
--   - New enums are created with IF NOT EXISTS-equivalent via DO blocks to
--     make the migration safely re-runnable in CI environments.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "AttendanceStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELED',
    'TRANSFERRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FinancialTransactionType" AS ENUM (
    'INCOME',
    'EXPENSE',
    'REFUND'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FinancialTransactionStatus" AS ENUM (
    'PENDING',
    'PAID',
    'OVERDUE',
    'CANCELED',
    'REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- TABLE: attendances
-- ---------------------------------------------------------------------------

CREATE TABLE "attendances" (
  "id"               UUID        NOT NULL DEFAULT uuid_generate_v4(),
  "tenant_id"        UUID        NOT NULL,
  "conversation_id"  UUID,
  "customer_id"      UUID,
  "ai_agent_id"      UUID,
  "operator_id"      UUID,

  -- Denormalized historical snapshots
  "client_name"      VARCHAR(255),
  "agent_name"       VARCHAR(255),

  "status"           "AttendanceStatus"    NOT NULL DEFAULT 'PENDING',
  "channel"          "ConversationChannel",

  "started_at"       TIMESTAMPTZ(6),
  "ended_at"         TIMESTAMPTZ(6),
  "duration_seconds" INTEGER,
  "notes"            TEXT,
  "rating"           INTEGER,   -- 1–5 stars
  "metadata"         JSONB       NOT NULL DEFAULT '{}',

  "created_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "deleted_at"       TIMESTAMPTZ(6),

  CONSTRAINT "attendances_pkey"            PRIMARY KEY ("id"),
  CONSTRAINT "attendances_tenant_fk"       FOREIGN KEY ("tenant_id")       REFERENCES "tenants"("id")        ON DELETE CASCADE,
  CONSTRAINT "attendances_conversation_fk" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id"),
  CONSTRAINT "attendances_customer_fk"     FOREIGN KEY ("customer_id")     REFERENCES "customers"("id"),
  CONSTRAINT "attendances_ai_agent_fk"     FOREIGN KEY ("ai_agent_id")     REFERENCES "ai_agents"("id"),
  CONSTRAINT "attendances_operator_fk"     FOREIGN KEY ("operator_id")     REFERENCES "users"("id"),
  CONSTRAINT "attendances_rating_check"    CHECK ("rating" IS NULL OR ("rating" >= 1 AND "rating" <= 5))
);

-- Indices
CREATE INDEX "attendances_tenant_id_idx"          ON "attendances"("tenant_id");
CREATE INDEX "attendances_tenant_status_idx"       ON "attendances"("tenant_id", "status");
CREATE INDEX "attendances_tenant_created_at_idx"   ON "attendances"("tenant_id", "created_at");
CREATE INDEX "attendances_conversation_id_idx"     ON "attendances"("conversation_id");
CREATE INDEX "attendances_customer_id_idx"         ON "attendances"("customer_id");
CREATE INDEX "attendances_operator_id_idx"         ON "attendances"("operator_id");
CREATE INDEX "attendances_deleted_at_idx"          ON "attendances"("deleted_at");

-- ---------------------------------------------------------------------------
-- TABLE: financial_transactions
-- ---------------------------------------------------------------------------

CREATE TABLE "financial_transactions" (
  "id"              UUID          NOT NULL DEFAULT uuid_generate_v4(),
  "tenant_id"       UUID          NOT NULL,
  "customer_id"     UUID,
  "plan_id"         UUID,
  "subscription_id" UUID,

  "description"     VARCHAR(500)  NOT NULL,
  "amount"          DECIMAL(12,2) NOT NULL,
  "currency"        VARCHAR(3)    NOT NULL DEFAULT 'BRL',
  "type"            "FinancialTransactionType"   NOT NULL DEFAULT 'INCOME',
  "status"          "FinancialTransactionStatus" NOT NULL DEFAULT 'PENDING',

  -- Denormalized historical snapshots
  "client_name"     VARCHAR(255),
  "plan_name"       VARCHAR(100),

  -- Payment gateway reference
  "external_id"     VARCHAR(255),
  "payment_method"  JSONB         NOT NULL DEFAULT '{}',

  "due_date"        TIMESTAMPTZ(6),
  "paid_at"         TIMESTAMPTZ(6),
  "metadata"        JSONB         NOT NULL DEFAULT '{}',

  "created_at"      TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "deleted_at"      TIMESTAMPTZ(6),

  CONSTRAINT "financial_transactions_pkey"            PRIMARY KEY ("id"),
  CONSTRAINT "financial_transactions_tenant_fk"       FOREIGN KEY ("tenant_id")       REFERENCES "tenants"("id")        ON DELETE CASCADE,
  CONSTRAINT "financial_transactions_customer_fk"     FOREIGN KEY ("customer_id")     REFERENCES "customers"("id"),
  CONSTRAINT "financial_transactions_plan_fk"         FOREIGN KEY ("plan_id")         REFERENCES "plans"("id"),
  CONSTRAINT "financial_transactions_subscription_fk" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id"),
  CONSTRAINT "financial_transactions_amount_check"    CHECK ("amount" >= 0)
);

-- Indices
CREATE INDEX "financial_transactions_tenant_id_idx"         ON "financial_transactions"("tenant_id");
CREATE INDEX "financial_transactions_tenant_status_idx"     ON "financial_transactions"("tenant_id", "status");
CREATE INDEX "financial_transactions_tenant_type_idx"       ON "financial_transactions"("tenant_id", "type");
CREATE INDEX "financial_transactions_tenant_created_at_idx" ON "financial_transactions"("tenant_id", "created_at");
CREATE INDEX "financial_transactions_customer_id_idx"       ON "financial_transactions"("customer_id");
CREATE INDEX "financial_transactions_plan_id_idx"           ON "financial_transactions"("plan_id");
CREATE INDEX "financial_transactions_subscription_id_idx"   ON "financial_transactions"("subscription_id");
CREATE INDEX "financial_transactions_external_id_idx"       ON "financial_transactions"("external_id");
CREATE INDEX "financial_transactions_due_date_idx"          ON "financial_transactions"("due_date");
CREATE INDEX "financial_transactions_deleted_at_idx"        ON "financial_transactions"("deleted_at");
