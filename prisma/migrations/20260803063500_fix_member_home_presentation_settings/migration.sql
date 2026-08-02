-- Keep member-home presentation data authoritative in Site Settings.
-- The member runtime consumes these public keys for both Desktop and Mobile.

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
  (md5(random()::text || clock_timestamp()::text)::uuid, 'features.quick_promotion_title', to_jsonb('โปรโมชั่นพิเศษ'::text), 'FEATURES'::"SiteSettingGroup", 'STRING'::"SiteSettingType", true, false, now(), now()),
  (md5(random()::text || clock_timestamp()::text)::uuid, 'features.quick_promotion_summary', to_jsonb('โปรโมชั่นพิเศษเฉพาะคุณ'::text), 'FEATURES'::"SiteSettingGroup", 'STRING'::"SiteSettingType", true, false, now(), now()),
  (md5(random()::text || clock_timestamp()::text)::uuid, 'features.quick_activity_title', to_jsonb('กิจกรรม'::text), 'FEATURES'::"SiteSettingGroup", 'STRING'::"SiteSettingType", true, false, now(), now()),
  (md5(random()::text || clock_timestamp()::text)::uuid, 'features.quick_activity_summary', to_jsonb('กิจกรรมตลอด 24 ชั่วโมง'::text), 'FEATURES'::"SiteSettingGroup", 'STRING'::"SiteSettingType", true, false, now(), now()),
  (md5(random()::text || clock_timestamp()::text)::uuid, 'features.quick_news_title', to_jsonb('ข่าวสาร'::text), 'FEATURES'::"SiteSettingGroup", 'STRING'::"SiteSettingType", true, false, now(), now()),
  (md5(random()::text || clock_timestamp()::text)::uuid, 'features.quick_news_summary', to_jsonb('ข่าวสารที่คุณไม่ควรพลาด'::text), 'FEATURES'::"SiteSettingGroup", 'STRING'::"SiteSettingType", true, false, now(), now()),
  (md5(random()::text || clock_timestamp()::text)::uuid, 'features.jackpot_title', to_jsonb('Jackpot'::text), 'FEATURES'::"SiteSettingGroup", 'STRING'::"SiteSettingType", true, false, now(), now()),
  (md5(random()::text || clock_timestamp()::text)::uuid, 'features.jackpot_subtitle', to_jsonb('Epic of the day'::text), 'FEATURES'::"SiteSettingGroup", 'STRING'::"SiteSettingType", true, false, now(), now()),
  (md5(random()::text || clock_timestamp()::text)::uuid, 'features.jackpot_image_url', to_jsonb('/assets/asset-pc/images/FEZX/highlight/1725948738165-4cb4f1ec-44ed-4b21-99ed-398fbb6d7b25.gif'::text), 'FEATURES'::"SiteSettingGroup", 'URL'::"SiteSettingType", true, false, now(), now()),
  (md5(random()::text || clock_timestamp()::text)::uuid, 'features.leaderboard_title', to_jsonb('Leaderboard'::text), 'FEATURES'::"SiteSettingGroup", 'STRING'::"SiteSettingType", true, false, now(), now()),
  (md5(random()::text || clock_timestamp()::text)::uuid, 'features.leaderboard_limit', to_jsonb(5), 'FEATURES'::"SiteSettingGroup", 'NUMBER'::"SiteSettingType", true, false, now(), now()),
  (
    md5(random()::text || clock_timestamp()::text)::uuid,
    'features.leaderboard_items',
    '[
      {"rank":1,"name":"Golden Empire","user":"092XXXX986","amount":"฿1,995","image":"/assets/asset-pc/images/games/1670596360948-8b1915ee-c2d6-4fb0-b22c-0c7fb32b0117.png"},
      {"rank":2,"name":"Maya Golden City","user":"093XXXX510","amount":"฿1,200","image":"/assets/asset-pc/images/games/1667928508204-7c69c936-becb-4ed3-9371-6ddb13bf9202.png"},
      {"rank":3,"name":"Fortune Rabbit","user":"064XXXX667","amount":"฿809","image":"/assets/asset-pc/images/games/1671503437258-6858b67e-74b0-4f92-a2c1-0baa9b8ce8a5.png"},
      {"rank":4,"name":"Fortune Gems","user":"081XXXX589","amount":"฿640","image":"/assets/asset-pc/images/games/1670762884919-364a6e35-5fe4-41f9-8ce7-892e9e2ac9b6.png"},
      {"rank":5,"name":"Caishen Wins","user":"096XXXX449","amount":"฿560","image":"/assets/asset-pc/images/games/1667451216350-67ca671b-fac7-444c-9dff-c09d9524ee0e.png"}
    ]'::jsonb,
    'FEATURES'::"SiteSettingGroup",
    'JSON'::"SiteSettingType",
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
