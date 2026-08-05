-- Keep one live lottery-prediction round available for the Member Activity UI.
-- The Activity service reads public `features.*` settings and validates every
-- submitted number against this round before persisting it.

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
    md5(random()::text || clock_timestamp()::text || 'activity-system')::uuid,
    'features.activity_system_enabled',
    'true'::jsonb,
    'FEATURES'::"SiteSettingGroup",
    'BOOLEAN'::"SiteSettingType",
    true,
    false,
    now(),
    now()
  ),
  (
    md5(random()::text || clock_timestamp()::text || 'lottery-enabled')::uuid,
    'features.lottery_prediction_enabled',
    'true'::jsonb,
    'FEATURES'::"SiteSettingGroup",
    'BOOLEAN'::"SiteSettingType",
    true,
    false,
    now(),
    now()
  ),
  (
    md5(random()::text || clock_timestamp()::text || 'lottery-rounds')::uuid,
    'features.lottery_prediction_rounds_json',
    jsonb_build_array(
      jsonb_build_object(
        'code', 'lottery-2026-q4',
        'title', 'กิจกรรมทายผลหวย',
        'bannerUrl', 'https://cdn.zabbet.com/event/predict/1784904660399-a6cb7821-1abb-4422-bbc2-27606ba0e7b4.jpeg',
        'enabled', true,
        'opensAt', '2026-08-01T00:00:00+07:00',
        'closesAt', '2026-12-31T15:00:00+07:00',
        'resultAt', '2026-12-31T16:30:00+07:00',
        'topDigits', 3,
        'bottomDigits', 2,
        'topReward', 5000,
        'bottomReward', 2000,
        'bothReward', 10000,
        'conditions', jsonb_build_array(
          'สมาชิกหนึ่งคนส่งคำทายได้หนึ่งครั้งต่อรอบ',
          'ต้องกรอกเลข 3 ตัวบนและ 2 ตัวล่างให้ครบก่อนหมดเวลา',
          'ระบบยึดเวลาของเซิร์ฟเวอร์ Asia/Bangkok เป็นหลัก',
          'รางวัลจะเข้ากระเป๋าหลักหลังประกาศผลและตรวจสอบรายการแล้ว'
        )
      )
    ),
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
