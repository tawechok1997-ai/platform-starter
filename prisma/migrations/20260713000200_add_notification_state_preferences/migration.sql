CREATE TABLE "notification_states" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "notification_key" VARCHAR(220) NOT NULL,
  "read_at" TIMESTAMP(3),
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_states_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_preferences" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "finance" BOOLEAN NOT NULL DEFAULT true,
  "security" BOOLEAN NOT NULL DEFAULT true,
  "promotion" BOOLEAN NOT NULL DEFAULT true,
  "system" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_states_user_id_notification_key_key" ON "notification_states"("user_id", "notification_key");
CREATE INDEX "notification_states_user_id_read_at_idx" ON "notification_states"("user_id", "read_at");
CREATE INDEX "notification_states_user_id_archived_at_idx" ON "notification_states"("user_id", "archived_at");
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

ALTER TABLE "notification_states" ADD CONSTRAINT "notification_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
