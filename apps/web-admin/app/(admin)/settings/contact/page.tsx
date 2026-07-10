import SettingsSectionPage from '../settings-section-page';

export default function ContactSettingsPage() {
  return (
    <SettingsSectionPage
      group="contact"
      title="Contact / Social Settings"
      description="ตั้งค่าช่องทางติดต่อและ social ที่ใช้ใน footer, contact page และ floating contact"
      fields={[
        { key: 'line_oa', label: 'Line OA' },
        { key: 'telegram', label: 'Telegram' },
        { key: 'facebook', label: 'Facebook' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'live_chat_url', label: 'Live Chat URL' },
        { key: 'support_hours', label: 'Support Hours' },
        { key: 'company_name', label: 'Company Name' },
        { key: 'address', label: 'Address', type: 'textarea' },
        { key: 'facebook_url', label: 'Facebook URL' },
        { key: 'line_url', label: 'LINE URL' },
        { key: 'telegram_url', label: 'Telegram URL' },
        { key: 'youtube_url', label: 'YouTube URL' },
        { key: 'tiktok_url', label: 'TikTok URL' },
        { key: 'twitter_url', label: 'X / Twitter URL' },
      ]}
    />
  );
}
