import SettingsSectionPage from '../settings-section-page';

export default function LegalSettingsPage() {
  return (
    <SettingsSectionPage
      group="legal"
      title="ข้อกำหนดและนโยบาย"
      description="จัดการเอกสารที่แสดงในหน้าสมัครสมาชิก ส่วนท้ายเว็บไซต์ โปรไฟล์ และหน้ากฎหมายของ Member"
      preview="legal"
      risk="sensitive"
      fields={[
        { key: 'version', label: 'เวอร์ชันเอกสาร', section: 'การเผยแพร่', required: true, maxLength: 80, placeholder: 'เช่น v2026.07' },
        { key: 'effective_date', label: 'วันที่เริ่มมีผล', type: 'date', section: 'การเผยแพร่', required: true },
        { key: 'terms', label: 'ข้อกำหนดและเงื่อนไขการใช้งาน', type: 'textarea', section: 'เอกสารหลัก', required: true, maxLength: 50000 },
        { key: 'privacy', label: 'นโยบายความเป็นส่วนตัว', type: 'textarea', section: 'เอกสารหลัก', required: true, maxLength: 50000 },
        { key: 'cookie', label: 'นโยบายคุกกี้', type: 'textarea', section: 'เอกสารหลัก', maxLength: 50000 },
        { key: 'responsible_use', label: 'นโยบายการใช้งานอย่างรับผิดชอบ', type: 'textarea', section: 'นโยบายเพิ่มเติม', maxLength: 50000 },
        { key: 'about_us', label: 'เกี่ยวกับเรา', type: 'textarea', section: 'นโยบายเพิ่มเติม', maxLength: 20000 },
        { key: 'contact_policy', label: 'นโยบายการติดต่อและช่วยเหลือ', type: 'textarea', section: 'นโยบายเพิ่มเติม', maxLength: 20000 },
      ]}
    />
  );
}
