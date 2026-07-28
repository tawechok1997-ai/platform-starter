import SettingsSectionPage from '../settings-section-page';

export default function FeaturesSettingsPage() {
  return (
    <SettingsSectionPage
      group="features"
      title="การเปิดปิดฟีเจอร์"
      description="ควบคุมความสามารถฝั่ง Member โดยไม่ต้อง deploy ใหม่ พร้อม confirmation ก่อนเปลี่ยนบริการสำคัญ"
      preview="features"
      risk="sensitive"
      fields={[
        { key: 'registration_enabled', label: 'เปิดสมัครสมาชิก', type: 'checkbox', section: 'บัญชีสมาชิก', helper: 'ปิดแล้วผู้ใช้ใหม่จะสมัครไม่ได้' },
        { key: 'login_enabled', label: 'เปิดเข้าสู่ระบบ', type: 'checkbox', section: 'บัญชีสมาชิก', helper: 'ปิดแล้วสมาชิกจะเข้าสู่ระบบไม่ได้' },
        { key: 'profile_enabled', label: 'เปิดโปรไฟล์', type: 'checkbox', section: 'บัญชีสมาชิก' },
        { key: 'kyc_enabled', label: 'เปิด KYC และบัญชีธนาคาร', type: 'checkbox', section: 'บัญชีสมาชิก' },
        { key: 'deposit_enabled', label: 'เปิดฝากเงิน', type: 'checkbox', section: 'ธุรกรรม', helper: 'กระทบการสร้างรายการฝากใหม่ทันที' },
        { key: 'withdraw_enabled', label: 'เปิดถอนเงิน', type: 'checkbox', section: 'ธุรกรรม', helper: 'กระทบการสร้างรายการถอนใหม่ทันที' },
        { key: 'promotion_enabled', label: 'เปิดโปรโมชัน', type: 'checkbox', section: 'การตลาดและรางวัล' },
        { key: 'bonus_enabled', label: 'เปิดโบนัส', type: 'checkbox', section: 'การตลาดและรางวัล' },
        { key: 'event_enabled', label: 'เปิดกิจกรรม', type: 'checkbox', section: 'การตลาดและรางวัล' },
        { key: 'vip_enabled', label: 'เปิด VIP', type: 'checkbox', section: 'การตลาดและรางวัล' },
        { key: 'referral_enabled', label: 'เปิด Referral', type: 'checkbox', section: 'การตลาดและรางวัล' },
        { key: 'coupon_enabled', label: 'เปิด Coupon', type: 'checkbox', section: 'การตลาดและรางวัล' },
        { key: 'affiliate_enabled', label: 'เปิดตัวแทน / Affiliate', type: 'checkbox', section: 'การตลาดและรางวัล' },
        { key: 'game_lobby_enabled', label: 'เปิด Game Lobby', type: 'checkbox', section: 'เกมและ Provider' },
        { key: 'provider_enabled', label: 'เปิด Provider', type: 'checkbox', section: 'เกมและ Provider' },
        { key: 'support_enabled', label: 'เปิดศูนย์ช่วยเหลือ', type: 'checkbox', section: 'บริการสมาชิก' },
        { key: 'notification_enabled', label: 'เปิดศูนย์แจ้งเตือน', type: 'checkbox', section: 'บริการสมาชิก' },
        { key: 'articles_enabled', label: 'เปิด SEO / Articles', type: 'checkbox', section: 'เนื้อหา' },
      ]}
    />
  );
}
