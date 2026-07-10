import SettingsSectionPage from '../settings-section-page';

export default function LegalSettingsPage() {
  return (
    <SettingsSectionPage
      group="legal"
      title="Legal / Policy Settings"
      description="จัดการ Terms, Privacy, Cookie และนโยบายต่าง ๆ ที่แสดงในหน้า register, footer และ profile"
      fields={[
        { key: 'terms', label: 'Terms and Conditions', type: 'textarea' },
        { key: 'privacy', label: 'Privacy Policy', type: 'textarea' },
        { key: 'cookie', label: 'Cookie Policy', type: 'textarea' },
        { key: 'responsible_use', label: 'Responsible Use Policy', type: 'textarea' },
        { key: 'about_us', label: 'About Us', type: 'textarea' },
        { key: 'contact_policy', label: 'Contact Policy', type: 'textarea' },
      ]}
    />
  );
}
