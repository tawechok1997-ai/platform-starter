import SettingsSectionPage from '../settings-section-page';

export default function BrandingSettingsPage() {
  return (
    <SettingsSectionPage
      group="branding"
      title="Branding Settings"
      description="ตั้งค่าโลโก้ สี ไอคอน และตัวอย่างหน้าตาแบรนด์"
      preview="branding"
      fields={[
        { key: 'brand_mark', label: 'Brand Mark', placeholder: 'เช่น P, K, ★ หรือชื่อย่อ' },
        { key: 'logo_url', label: 'Logo URL' },
        { key: 'logo_dark_url', label: 'Logo Dark URL' },
        { key: 'logo_light_url', label: 'Logo Light URL' },
        { key: 'favicon_url', label: 'Favicon URL' },
        { key: 'app_icon_url', label: 'App Icon URL' },
        { key: 'footer_logo_url', label: 'Footer Logo URL' },
        { key: 'loading_logo_url', label: 'Loading Logo URL' },
        { key: 'watermark_logo_url', label: 'Watermark Logo URL' },
        { key: 'primary_color', label: 'Primary Color', type: 'color' },
        { key: 'secondary_color', label: 'Secondary Color', type: 'color' },
        { key: 'accent_color', label: 'Accent Color', type: 'color' },
        { key: 'background_color', label: 'Background Color', type: 'color' },
        { key: 'card_color', label: 'Card Color', type: 'color' },
        { key: 'button_color', label: 'Button Color', type: 'color' },
        { key: 'text_color', label: 'Text Color', type: 'color' },
        { key: 'success_color', label: 'Success Color', type: 'color' },
        { key: 'danger_color', label: 'Danger Color', type: 'color' },
        { key: 'warning_color', label: 'Warning Color', type: 'color' },
      ]}
    />
  );
}
