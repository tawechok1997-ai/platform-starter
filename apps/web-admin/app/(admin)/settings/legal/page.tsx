import SettingsSectionPage from '../settings-section-page';

export default function LegalSettingsPage() {
  return (
    <SettingsSectionPage
      group="legal"
      title="ข้อกำหนดและนโยบาย"
      description="จัดการข้อกำหนดการใช้งาน นโยบายความเป็นส่วนตัว คุกกี้ และข้อมูลที่แสดงในหน้าสมัครสมาชิก ส่วนท้ายเว็บไซต์ และหน้าโปรไฟล์"
      preview="legal"
      fields={[
        { key: 'version', label: 'เวอร์ชันเอกสาร', placeholder: 'เช่น v2026.07' },
        { key: 'effective_date', label: 'วันที่เริ่มมีผล', type: 'date' },
        { key: 'terms', label: 'ข้อกำหนดและเงื่อนไขการใช้งาน', type: 'textarea' },
        { key: 'privacy', label: 'นโยบายความเป็นส่วนตัว', type: 'textarea' },
        { key: 'cookie', label: 'นโยบายคุกกี้', type: 'textarea' },
        { key: 'responsible_use', label: 'นโยบายการใช้งานอย่างรับผิดชอบ', type: 'textarea' },
        { key: 'about_us', label: 'เกี่ยวกับเรา', type: 'textarea' },
        { key: 'contact_policy', label: 'นโยบายการติดต่อและช่วยเหลือ', type: 'textarea' },
      ]}
    />
  );
}
