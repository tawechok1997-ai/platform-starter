import SettingsSectionPage from '../settings-section-page';

export default function ContactSettingsPage() {
  return (
    <SettingsSectionPage
      group="contact"
      title="ช่องทางติดต่อ"
      description="จัดการข้อมูลบริษัท ฝ่ายช่วยเหลือ และลิงก์โซเชียลที่หน้า Member นำไปแสดงจริง"
      preview="contact"
      fields={[
        { key: 'company_name', label: 'ชื่อบริษัทหรือผู้ให้บริการ', section: 'ข้อมูลผู้ให้บริการ', required: true, maxLength: 160 },
        { key: 'address', label: 'ที่อยู่', type: 'textarea', section: 'ข้อมูลผู้ให้บริการ', maxLength: 1000 },
        { key: 'support_hours', label: 'เวลาทำการฝ่ายช่วยเหลือ', section: 'ฝ่ายช่วยเหลือ', required: true, maxLength: 160, placeholder: 'เช่น ทุกวัน 24 ชั่วโมง' },
        { key: 'email', label: 'อีเมลติดต่อ', type: 'email', section: 'ฝ่ายช่วยเหลือ', required: true },
        { key: 'phone', label: 'หมายเลขโทรศัพท์', section: 'ฝ่ายช่วยเหลือ', maxLength: 40 },
        { key: 'live_chat_url', label: 'ลิงก์แชตสด', type: 'url', section: 'ฝ่ายช่วยเหลือ', helper: 'รองรับ https:// หรือ path ภายในเว็บไซต์' },
        { key: 'line_oa', label: 'บัญชี LINE Official', section: 'บัญชีโซเชียล', maxLength: 120 },
        { key: 'telegram', label: 'ชื่อผู้ใช้ Telegram', section: 'บัญชีโซเชียล', maxLength: 120 },
        { key: 'facebook', label: 'ชื่อเพจ Facebook', section: 'บัญชีโซเชียล', maxLength: 160 },
        { key: 'line_url', label: 'ลิงก์ LINE', type: 'url', section: 'ลิงก์โซเชียล' },
        { key: 'telegram_url', label: 'ลิงก์ Telegram', type: 'url', section: 'ลิงก์โซเชียล' },
        { key: 'facebook_url', label: 'ลิงก์ Facebook', type: 'url', section: 'ลิงก์โซเชียล' },
        { key: 'youtube_url', label: 'ลิงก์ YouTube', type: 'url', section: 'ลิงก์โซเชียล' },
        { key: 'tiktok_url', label: 'ลิงก์ TikTok', type: 'url', section: 'ลิงก์โซเชียล' },
        { key: 'twitter_url', label: 'ลิงก์ X / Twitter', type: 'url', section: 'ลิงก์โซเชียล' },
      ]}
    />
  );
}
