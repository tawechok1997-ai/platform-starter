-- Keep the public Desktop Activity and News popups populated through the CMS
-- setting. The merge is idempotent and preserves every unrelated announcement.

WITH source_content AS (
  SELECT jsonb_build_array(
    jsonb_build_object(
      'id', 'source-activity-predict-lottery',
      'kind', 'event',
      'title', 'ทายผลหวย',
      'message', 'ร่วมทายผลเลขท้าย 3 ตัวบน และ 2 ตัวล่างเพื่อรับรางวัลตามเงื่อนไขกิจกรรม',
      'href', '',
      'enabled', true,
      'lifecycle', 'published',
      'imageUrl', 'https://cdn.zabbet.com/event/predict/1784904726144-c10c3ca6-cf70-41d3-a763-aa33c8917b2d.jpeg',
      'desktopImageUrl', 'https://cdn.zabbet.com/event/predict/1784904726144-c10c3ca6-cf70-41d3-a763-aa33c8917b2d.jpeg',
      'mobileImageUrl', 'https://cdn.zabbet.com/event/predict/1784904726144-c10c3ca6-cf70-41d3-a763-aa33c8917b2d.jpeg',
      'thumbnailImageUrl', 'https://cdn.zabbet.com/event/predict/1784904726144-c10c3ca6-cf70-41d3-a763-aa33c8917b2d.jpeg',
      'bannerImageUrl', 'https://cdn.zabbet.com/event/predict/1784904660399-a6cb7821-1abb-4422-bbc2-27606ba0e7b4.jpeg',
      'endsAt', '2026-12-31T16:59:59.000Z',
      'statusLabel', 'เปิดรับคำทาย',
      'activityType', 'lottery',
      'numberPrediction', true,
      'terms', jsonb_build_array(
        'กรุณาทายผลให้ครบทั้ง 3 ตัวบน และ 2 ตัวล่าง',
        'สมาชิกหนึ่งบัญชีส่งคำทายได้ตามจำนวนครั้งที่ระบบกำหนด',
        'ตรวจสอบเวลาปิดรับคำทายก่อนยืนยันข้อมูล'
      )
    ),
    jsonb_build_object(
      'id', 'source-activity-turnover-reward',
      'kind', 'event',
      'title', 'ทำยอด Turn รับรางวัลจุใจ',
      'message', 'สะสมยอดเล่นตามเงื่อนไขเพื่อรับรางวัลจากกิจกรรม',
      'href', '/promotions',
      'enabled', true,
      'lifecycle', 'published',
      'imageUrl', 'https://cdn.zabbet.com/event/predict/1719130004352-5323a6c4-0ad4-4cda-8475-dd0f5701b61b.png',
      'desktopImageUrl', 'https://cdn.zabbet.com/event/predict/1719130004352-5323a6c4-0ad4-4cda-8475-dd0f5701b61b.png',
      'mobileImageUrl', 'https://cdn.zabbet.com/event/predict/1719130004352-5323a6c4-0ad4-4cda-8475-dd0f5701b61b.png',
      'thumbnailImageUrl', 'https://cdn.zabbet.com/event/predict/1719130004352-5323a6c4-0ad4-4cda-8475-dd0f5701b61b.png',
      'bannerImageUrl', 'https://cdn.zabbet.com/event/predict/1719130004352-5323a6c4-0ad4-4cda-8475-dd0f5701b61b.png',
      'endsAt', '2026-12-31T16:59:59.000Z',
      'statusLabel', 'กำลังดำเนินกิจกรรม',
      'activityType', 'turnover',
      'numberPrediction', false,
      'terms', jsonb_build_array(
        'ยอด Turn และรางวัลเป็นไปตามประกาศของกิจกรรม',
        'ระบบจะคำนวณยอดจากรายการที่สำเร็จเท่านั้น'
      )
    ),
    jsonb_build_object(
      'id', 'source-news-member-system-ready',
      'kind', 'news',
      'title', 'ระบบสมาชิกพร้อมให้บริการ',
      'message', 'สมาชิกสามารถใช้งานหน้าหลัก โปรโมชั่น กิจกรรม ข่าวสาร และเมนูบัญชีได้ตามปกติ',
      'href', '/status',
      'enabled', true,
      'lifecycle', 'published',
      'imageUrl', '',
      'desktopImageUrl', '',
      'mobileImageUrl', ''
    ),
    jsonb_build_object(
      'id', 'source-news-account-security',
      'kind', 'news',
      'title', 'คำแนะนำด้านความปลอดภัยของบัญชี',
      'message', 'โปรดเก็บรหัสผ่านเป็นความลับและตรวจสอบข้อมูลปลายทางก่อนยืนยันรายการทุกครั้ง',
      'href', '/profile',
      'enabled', true,
      'lifecycle', 'published',
      'imageUrl', '',
      'desktopImageUrl', '',
      'mobileImageUrl', ''
    )
  ) AS announcements
), existing_setting AS (
  SELECT "value_json"
  FROM "site_settings"
  WHERE "key" = 'features.cms_content'
), merged_content AS (
  SELECT jsonb_set(
    COALESCE((SELECT "value_json" FROM existing_setting), jsonb_build_object(
      'assets', jsonb_build_array(),
      'banners', jsonb_build_array(),
      'popup', jsonb_build_object('enabled', false, 'lifecycle', 'draft'),
      'announcements', jsonb_build_array(),
      'faqs', jsonb_build_array()
    )),
    '{announcements}',
    source_content.announcements || COALESCE((
      SELECT jsonb_agg(entry)
      FROM jsonb_array_elements(
        CASE
          WHEN jsonb_typeof((SELECT "value_json" FROM existing_setting)->'announcements') = 'array'
            THEN (SELECT "value_json" FROM existing_setting)->'announcements'
          ELSE '[]'::jsonb
        END
      ) AS entries(entry)
      WHERE entry->>'id' NOT IN (
        'source-activity-predict-lottery',
        'source-activity-turnover-reward',
        'source-news-member-system-ready',
        'source-news-account-security'
      )
    ), '[]'::jsonb),
    true
  ) AS value_json
  FROM source_content
)
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
SELECT
  md5(random()::text || clock_timestamp()::text)::uuid,
  'features.cms_content',
  merged_content.value_json,
  'FEATURES'::"SiteSettingGroup",
  'JSON'::"SiteSettingType",
  true,
  false,
  now(),
  now()
FROM merged_content
ON CONFLICT ("key") DO UPDATE
SET
  "value_json" = EXCLUDED."value_json",
  "group" = EXCLUDED."group",
  "type" = EXCLUDED."type",
  "is_public" = EXCLUDED."is_public",
  "is_sensitive" = EXCLUDED."is_sensitive",
  "updated_at" = now();
