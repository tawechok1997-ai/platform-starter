-- Point the public member-home Jackpot setting at the canonical local artwork.
-- Both Desktop and Mobile consume this Site Setting through MemberRuntimeProvider.

INSERT INTO "site_settings" (
  "id",
  "key",
  "value_json",
  "group",
  "type",
  "is_public",
  "is_sensitive",
  "created_at",
  "updated_at"
)
VALUES (
  md5(random()::text || clock_timestamp()::text)::uuid,
  'features.jackpot_image_url',
  to_jsonb('/assets/asset-pc/images/FEZX/highlight/1725948738165-4cb4f1ec-44ed-4b21-99ed-398fbb6d7b25_220.gif'::text),
  'FEATURES'::"SiteSettingGroup",
  'URL'::"SiteSettingType",
  true,
  false,
  now(),
  now()
)
ON CONFLICT ("key") DO UPDATE
SET
  "value_json" = EXCLUDED."value_json",
  "group" = EXCLUDED."group",
  "type" = EXCLUDED."type",
  "is_public" = EXCLUDED."is_public",
  "is_sensitive" = EXCLUDED."is_sensitive",
  "updated_at" = now();
