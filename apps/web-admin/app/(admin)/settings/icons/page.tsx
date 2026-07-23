import SettingsSectionPage from '../settings-section-page';
import { ICON_SETTINGS_DEFAULTS, ICON_SETTINGS_FIELDS } from './icon-settings-config';

export default function IconSettingsPage() {
  return (
    <SettingsSectionPage
      group="icons"
      title="ตั้งค่าไอคอน"
      description="เปลี่ยนไอคอนเมนูหลักและหมวดเกมของสมาชิก ค่าเริ่มต้นนำมาจากไฟล์ต้นแบบภาษาไทยและเก็บในโปรเจกต์ด้วยชื่ออังกฤษ"
      fields={ICON_SETTINGS_FIELDS}
      defaults={ICON_SETTINGS_DEFAULTS}
      preview="icons"
    />
  );
}
