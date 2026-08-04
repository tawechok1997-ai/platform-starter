-- Restore the CMS/settings persistence required during API bootstrap.
-- This migration is intentionally idempotent because older environments may
-- already contain part of the site-settings schema outside Prisma history.

DO $$
BEGIN
  CREATE TYPE "SiteSettingGroup" AS ENUM (
    'WEBSITE',
    'BRANDING',
    'THEME',
    'SEO',
    'CONTACT',
    'MAINTENANCE',
    'SCRIPTS',
    'FEATURES',
    'LEGAL'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "SiteSettingType" AS ENUM (
    'STRING',
    'NUMBER',
    'BOOLEAN',
    'JSON',
    'URL',
    'COLOR',
    'RICH_TEXT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "site_settings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "key" VARCHAR(160) NOT NULL,
  "value_json" JSONB NOT NULL,
  "group" "SiteSettingGroup" NOT NULL,
  "type" "SiteSettingType" NOT NULL DEFAULT 'JSON',
  "is_public" BOOLEAN NOT NULL DEFAULT false,
  "is_sensitive" BOOLEAN NOT NULL DEFAULT false,
  "updated_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "site_settings_key_key"
  ON "site_settings"("key");
CREATE INDEX IF NOT EXISTS "site_settings_group_idx"
  ON "site_settings"("group");
CREATE INDEX IF NOT EXISTS "site_settings_is_public_idx"
  ON "site_settings"("is_public");

CREATE TABLE IF NOT EXISTS "site_setting_histories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "setting_key" VARCHAR(160) NOT NULL,
  "old_value_json" JSONB,
  "new_value_json" JSONB,
  "changed_by" UUID,
  "ip_address" VARCHAR(64),
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "site_setting_histories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "site_setting_histories_setting_key_idx"
  ON "site_setting_histories"("setting_key");
CREATE INDEX IF NOT EXISTS "site_setting_histories_changed_by_idx"
  ON "site_setting_histories"("changed_by");
