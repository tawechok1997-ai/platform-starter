CREATE TABLE IF NOT EXISTS admin_ui_preferences (
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  preference_key TEXT NOT NULL,
  value JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (admin_user_id, preference_key),
  CONSTRAINT admin_ui_preferences_key_check
    CHECK (char_length(preference_key) BETWEEN 1 AND 120),
  CONSTRAINT admin_ui_preferences_value_size_check
    CHECK (octet_length(value::text) <= 50000)
);

CREATE INDEX IF NOT EXISTS admin_ui_preferences_updated_at_idx
  ON admin_ui_preferences (updated_at DESC);
