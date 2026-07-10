import SettingsSectionPage from '../settings-section-page';

export default function ScriptsSettingsPage() {
  return (
    <SettingsSectionPage
      group="scripts"
      title="Script / Tracking Settings"
      description="ตั้งค่า analytics, pixels และ custom scripts เฉพาะ Super Admin / Owner เท่านั้น"
      fields={[
        { key: 'google_analytics_id', label: 'Google Analytics ID' },
        { key: 'google_tag_manager_id', label: 'Google Tag Manager ID' },
        { key: 'facebook_pixel_id', label: 'Facebook Pixel ID' },
        { key: 'tiktok_pixel_id', label: 'TikTok Pixel ID' },
        { key: 'line_tag_id', label: 'LINE Tag ID' },
        { key: 'custom_header_script', label: 'Custom Header Script', type: 'textarea' },
        { key: 'custom_body_script', label: 'Custom Body Script', type: 'textarea' },
        { key: 'custom_footer_script', label: 'Custom Footer Script', type: 'textarea' },
      ]}
    />
  );
}
