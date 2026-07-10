import SettingsSectionPage from '../settings-section-page';

export default function FeaturesSettingsPage() {
  return (
    <SettingsSectionPage
      group="features"
      title="Feature Flag Settings"
      description="เปิด/ปิดฟีเจอร์ฝั่งสมาชิกโดยไม่ต้อง deploy ใหม่ เมนูและ route จะตอบสนองตามค่าที่บันทึก"
      fields={[
        { key: 'registration_enabled', label: 'เปิดสมัครสมาชิก', type: 'checkbox' },
        { key: 'login_enabled', label: 'เปิดเข้าสู่ระบบ', type: 'checkbox' },
        { key: 'deposit_enabled', label: 'เปิดฝาก', type: 'checkbox' },
        { key: 'withdraw_enabled', label: 'เปิดถอนเงิน', type: 'checkbox' },
        { key: 'promotion_enabled', label: 'เปิดโปรโมชัน', type: 'checkbox' },
        { key: 'bonus_enabled', label: 'เปิดโบนัส', type: 'checkbox' },
        { key: 'affiliate_enabled', label: 'เปิดตัวแทน / Affiliate', type: 'checkbox' },
        { key: 'support_enabled', label: 'เปิดช่วยเหลือ / Support', type: 'checkbox' },
        { key: 'kyc_enabled', label: 'เปิด KYC / บัญชีธนาคาร', type: 'checkbox' },
        { key: 'game_lobby_enabled', label: 'เปิด Game Lobby', type: 'checkbox' },
        { key: 'profile_enabled', label: 'เปิดโปรไฟล์', type: 'checkbox' },
        { key: 'notification_enabled', label: 'เปิดศูนย์แจ้งเตือน', type: 'checkbox' },
        { key: 'event_enabled', label: 'เปิดกิจกรรม', type: 'checkbox' },
        { key: 'vip_enabled', label: 'เปิด VIP', type: 'checkbox' },
        { key: 'referral_enabled', label: 'เปิด Referral', type: 'checkbox' },
        { key: 'coupon_enabled', label: 'เปิด Coupon', type: 'checkbox' },
        { key: 'provider_enabled', label: 'เปิด Provider', type: 'checkbox' },
        { key: 'articles_enabled', label: 'เปิด SEO / Articles', type: 'checkbox' },
      ]}
    />
  );
}
