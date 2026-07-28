-- =============================================================================
-- Migration: Add is_super_admin flag to users table
--
-- Purpose: Introduces platform-level superadmin privileges that are completely
-- separate from the tenant-scoped UserRole hierarchy.
--
-- Design notes:
--   - A boolean column is simpler and safer than adding a new enum value to
--     UserRole, which would affect tenant RBAC throughout the codebase.
--   - Defaults to FALSE — all existing users remain unaffected.
--   - The column is NOT exposed in any registration, invitation or profile
--     update endpoint; it can only be set via the seed-superadmin CLI script
--     or a direct DB operation by a DBA.
-- =============================================================================

ALTER TABLE "users"
  ADD COLUMN "is_super_admin" BOOLEAN NOT NULL DEFAULT false;

-- Partial index: the vast majority of users will have is_super_admin = false,
-- so this index stays tiny and lookups by JWT validation are essentially free.
CREATE INDEX "users_is_super_admin_idx"
  ON "users" ("is_super_admin")
  WHERE "is_super_admin" = true;

COMMENT ON COLUMN "users"."is_super_admin"
  IS 'Platform-level superadmin flag. Independent of tenant UserRole. '
     'Grants access to cross-tenant administrative routes (list all tenants, '
     'manage global plans). Set only via seed-superadmin CLI script.';
