import SettingsSectionPage from '../settings-section-page';

export default function SeoSettingsPage() {
  return (
    <SettingsSectionPage
      group="seo"
      title="SEO และการแชร์"
      description="จัดการข้อมูลค้นหา canonical, robots, verification และตัวอย่างเวลาแชร์บนโซเชียล"
      preview="seo"
      fields={[
        { key: 'default_title', label: 'ชื่อหน้าเริ่มต้น', section: 'ข้อมูลค้นหาหลัก', required: true, maxLength: 70, helper: 'แนะนำไม่เกิน 60–70 ตัวอักษร' },
        { key: 'default_description', label: 'คำอธิบายเริ่มต้น', type: 'textarea', section: 'ข้อมูลค้นหาหลัก', required: true, maxLength: 180, helper: 'แนะนำประมาณ 120–160 ตัวอักษร' },
        { key: 'default_keywords', label: 'Keywords เริ่มต้น', section: 'ข้อมูลค้นหาหลัก', maxLength: 500, helper: 'คั่นแต่ละคำด้วยเครื่องหมายจุลภาค' },
        { key: 'canonical_url', label: 'Canonical URL', type: 'url', section: 'ข้อมูลค้นหาหลัก', required: true, placeholder: 'https://example.com' },
        { key: 'og_title', label: 'ชื่อเวลาแชร์', section: 'Social Preview', maxLength: 95 },
        { key: 'og_description', label: 'คำอธิบายเวลาแชร์', type: 'textarea', section: 'Social Preview', maxLength: 220 },
        { key: 'og_image', label: 'รูปเวลาแชร์', section: 'Social Preview', asset: true, helper: 'แนะนำอัตราส่วน 1.91:1 เช่น 1200×630 px' },
        { key: 'twitter_card', label: 'Twitter Card', type: 'select', section: 'Social Preview', options: [{ value: 'summary', label: 'Summary' }, { value: 'summary_large_image', label: 'Summary Large Image' }], helper: 'เลือกรูปแบบการ์ดสำหรับ X / Twitter' },
        { key: 'robots_index', label: 'อนุญาตให้ Index', type: 'checkbox', section: 'Robots และ Sitemap' },
        { key: 'robots_follow', label: 'อนุญาตให้ Follow Links', type: 'checkbox', section: 'Robots และ Sitemap' },
        { key: 'google_site_verification', label: 'Google Site Verification', section: 'การยืนยันเจ้าของเว็บไซต์', maxLength: 300 },
        { key: 'bing_verification', label: 'Bing Verification', section: 'การยืนยันเจ้าของเว็บไซต์', maxLength: 300 },
      ]}
    />
  );
}
