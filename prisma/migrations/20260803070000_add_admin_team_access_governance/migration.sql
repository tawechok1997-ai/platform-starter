CREATE TABLE "admin_teams" (
  "id" UUID NOT NULL,
  "code" VARCHAR(80) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "description" TEXT,
  "parent_team_id" UUID,
  "manager_admin_id" UUID,
  "created_by_admin_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_teams_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admin_teams_code_key" UNIQUE ("code"),
  CONSTRAINT "admin_teams_parent_not_self" CHECK ("parent_team_id" IS NULL OR "parent_team_id" <> "id"),
  CONSTRAINT "admin_teams_parent_team_id_fkey"
    FOREIGN KEY ("parent_team_id") REFERENCES "admin_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "admin_teams_manager_admin_id_fkey"
    FOREIGN KEY ("manager_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "admin_teams_created_by_admin_id_fkey"
    FOREIGN KEY ("created_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "admin_teams_parent_team_id_idx" ON "admin_teams"("parent_team_id");
CREATE INDEX "admin_teams_manager_admin_id_idx" ON "admin_teams"("manager_admin_id");

CREATE TABLE "admin_team_members" (
  "team_id" UUID NOT NULL,
  "admin_user_id" UUID NOT NULL,
  "is_lead" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_by_admin_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_team_members_pkey" PRIMARY KEY ("team_id", "admin_user_id"),
  CONSTRAINT "admin_team_members_team_id_fkey"
    FOREIGN KEY ("team_id") REFERENCES "admin_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "admin_team_members_admin_user_id_fkey"
    FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "admin_team_members_created_by_admin_id_fkey"
    FOREIGN KEY ("created_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "admin_team_members_admin_user_id_idx" ON "admin_team_members"("admin_user_id");

CREATE TABLE "admin_reporting_lines" (
  "manager_admin_id" UUID NOT NULL,
  "subordinate_admin_id" UUID NOT NULL,
  "created_by_admin_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_reporting_lines_pkey" PRIMARY KEY ("manager_admin_id", "subordinate_admin_id"),
  CONSTRAINT "admin_reporting_lines_subordinate_admin_id_key" UNIQUE ("subordinate_admin_id"),
  CONSTRAINT "admin_reporting_lines_not_self" CHECK ("manager_admin_id" <> "subordinate_admin_id"),
  CONSTRAINT "admin_reporting_lines_manager_admin_id_fkey"
    FOREIGN KEY ("manager_admin_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "admin_reporting_lines_subordinate_admin_id_fkey"
    FOREIGN KEY ("subordinate_admin_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "admin_reporting_lines_created_by_admin_id_fkey"
    FOREIGN KEY ("created_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "admin_reporting_lines_manager_admin_id_idx" ON "admin_reporting_lines"("manager_admin_id");

CREATE TABLE "admin_permission_overrides" (
  "id" UUID NOT NULL,
  "admin_user_id" UUID NOT NULL,
  "permission_code" VARCHAR(120) NOT NULL,
  "effect" VARCHAR(10) NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "expires_at" TIMESTAMPTZ,
  "created_by_admin_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_permission_overrides_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admin_permission_overrides_admin_permission_key" UNIQUE ("admin_user_id", "permission_code"),
  CONSTRAINT "admin_permission_overrides_effect_check" CHECK ("effect" IN ('ALLOW', 'DENY')),
  CONSTRAINT "admin_permission_overrides_admin_user_id_fkey"
    FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "admin_permission_overrides_permission_code_fkey"
    FOREIGN KEY ("permission_code") REFERENCES "permissions"("code") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "admin_permission_overrides_created_by_admin_id_fkey"
    FOREIGN KEY ("created_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "admin_permission_overrides_admin_user_expiry_idx"
  ON "admin_permission_overrides"("admin_user_id", "expires_at");

CREATE TABLE "admin_access_profiles" (
  "admin_user_id" UUID NOT NULL,
  "scope" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "approval_limits" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "updated_by_admin_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_access_profiles_pkey" PRIMARY KEY ("admin_user_id"),
  CONSTRAINT "admin_access_profiles_admin_user_id_fkey"
    FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "admin_access_profiles_updated_by_admin_id_fkey"
    FOREIGN KEY ("updated_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "admin_access_profiles_scope_object_check" CHECK (jsonb_typeof("scope") = 'object'),
  CONSTRAINT "admin_access_profiles_limits_object_check" CHECK (jsonb_typeof("approval_limits") = 'object')
);
