-- Store the source mobile leaderboard in public Site Settings.
-- Desktop and Mobile both consume features.leaderboard_items through the
-- shared MemberRuntimeProvider, so there is one backend-owned data set.

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
VALUES
  (
    md5(random()::text || clock_timestamp()::text)::uuid,
    'features.leaderboard_items',
    '[
      {"rank":1,"name":"EVOLUTION","user":"084XXXX728","amount":"8,400","image":"https://cdn.zabbet.com/providers/set/1_1_v/evt.png"},
      {"rank":2,"name":"Fortune Tiger","user":"061XXXX493","amount":"5,600","image":"https://cdn.zabbet.com/games/pgslot/vertical/fortune_tiger.jpg"},
      {"rank":3,"name":"ไฮโลไทย 2","user":"091XXXX339","amount":"5,000","image":"https://cdn.zabbet.com/games/KM/TH/Thai_Hi_Lo_2.jpg"},
      {"rank":4,"name":"Lalika","user":"093XXXX507","amount":"4,600","image":"https://cdn.zabbet.com/providers/set/1_1_v/lali.png"},
      {"rank":5,"name":"SBO","user":"095XXXX955","amount":"3,277","image":"https://cdn.zabbet.com/providers/set/1_1_v/sbo.png"}
    ]'::jsonb,
    'FEATURES'::"SiteSettingGroup",
    'JSON'::"SiteSettingType",
    true,
    false,
    now(),
    now()
  ),
  (
    md5(random()::text || clock_timestamp()::text)::uuid,
    'features.leaderboard_limit',
    to_jsonb(5),
    'FEATURES'::"SiteSettingGroup",
    'NUMBER'::"SiteSettingType",
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
