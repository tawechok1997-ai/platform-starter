import SettingsSectionPage from '../settings-section-page';

export default function ContactSettingsPage() {
  return (
    <SettingsSectionPage
      group="contact"
      title="ช่องทางติดต่อและโซเชียล"
      description="ตั้งค่าช่องทางติดต่อที่ใช้ในส่วนท้ายเว็บไซต์ หน้าติดต่อ และปุ่มช่วยเหลือแบบลอย"
      fields={[
        { key: 'line_oa', label: 'บัญชี LINE Official' },
        { key: 'telegram', label: 'ชื่อผู้ใช้ Telegram' },
        { key: 'facebook', label: 'ชื่อเพจ Facebook' },
        { key: 'email', label: 'อีเมลติดต่อ' },
        { key: 'phone', label: 'หมายเลขโทรศัพท์' },
        { key: 'live_chat_url', label: 'ลิงก์แชตสด' },
        { key: 'support_hours', label: 'เวลาทำการฝ่ายช่วยเหลือ' },
        { key: 'company_name', label: 'ชื่อบริษัทหรือผู้ให้บริการ' },
        { key: 'address', label: 'ที่อยู่', type: 'textarea' },
        { key: 'facebook_url', label: 'ลิงก์ Facebook' },
        { key: 'line_url', label: 'ลิงก์ LINE' },
        { key: 'telegram_url', label: 'ลิงก์ Telegram' },
        { key: 'youtube_url', label: 'ลิงก์ YouTube' },
        { key: 'tiktok_url', label: 'ลิงก์ TikTok' },
        { key: 'twitter_url', label: 'ลิงก์ X / Twitter' },
      ]}
    />
  );
}
