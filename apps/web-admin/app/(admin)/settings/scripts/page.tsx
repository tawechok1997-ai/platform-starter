import SettingsSectionPage from '../settings-section-page';

export default function ScriptsSettingsPage() {
  return (
    <SettingsSectionPage
      group="scripts"
      title="Tracking และ Custom Scripts"
      description="จัดการ analytics, pixels และ custom code สำหรับ Owner หรือ Super Admin โดยมี confirmation ก่อนบันทึก"
      preview="scripts"
      risk="critical"
      fields={[
        { key: 'google_analytics_id', label: 'Google Analytics ID', section: 'Analytics IDs', maxLength: 120, placeholder: 'G-XXXXXXXXXX' },
        { key: 'google_tag_manager_id', label: 'Google Tag Manager ID', section: 'Analytics IDs', maxLength: 120, placeholder: 'GTM-XXXXXXX' },
        { key: 'facebook_pixel_id', label: 'Facebook Pixel ID', section: 'Marketing Pixels', maxLength: 120 },
        { key: 'tiktok_pixel_id', label: 'TikTok Pixel ID', section: 'Marketing Pixels', maxLength: 120 },
        { key: 'line_tag_id', label: 'LINE Tag ID', section: 'Marketing Pixels', maxLength: 120 },
        { key: 'custom_header_script', label: 'Custom Header Script', type: 'textarea', section: 'Custom Code', maxLength: 20000, helper: 'แทรกในส่วน head ตรวจสอบ syntax และ CSP ก่อนเปิดใช้งาน' },
        { key: 'custom_body_script', label: 'Custom Body Script', type: 'textarea', section: 'Custom Code', maxLength: 20000, helper: 'แทรกหลังเปิด body ห้ามใส่ข้อมูลลับหรือ token แบบ hard-code' },
        { key: 'custom_footer_script', label: 'Custom Footer Script', type: 'textarea', section: 'Custom Code', maxLength: 20000, helper: 'แทรกก่อนปิด body ควรทดสอบผลต่อ performance และ consent' },
      ]}
    />
  );
}
