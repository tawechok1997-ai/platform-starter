ALTER TABLE "game_sessions"
  ADD COLUMN IF NOT EXISTS "launch_token_hash" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "launch_token_expires_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "launch_token_revoked_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "last_heartbeat_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "closed_reason" VARCHAR(240);

CREATE INDEX IF NOT EXISTS "game_sessions_launch_token_expires_at_idx"
  ON "game_sessions"("launch_token_expires_at");

CREATE INDEX IF NOT EXISTS "game_sessions_last_heartbeat_at_idx"
  ON "game_sessions"("last_heartbeat_at");

CREATE INDEX IF NOT EXISTS "game_sessions_user_id_status_idx"
  ON "game_sessions"("user_id", "status");
