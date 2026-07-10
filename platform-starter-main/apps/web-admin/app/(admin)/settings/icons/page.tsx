import SettingsSectionPage from '../settings-section-page';

export default function IconSettingsPage() {
  return (
    <SettingsSectionPage
      group="icons"
      title="Icon Settings"
      description="ตั้งค่าไอคอนเมนูและ shortcut ฝั่งสมาชิก ใช้ได้ทั้ง emoji/text หรือ URL รูปภาพ"
      fields={[
        { key: 'home', label: 'หน้าแรก Icon', placeholder: '⌂ หรือ https://...' },
        { key: 'deposit', label: 'ฝาก Icon', placeholder: '＋ หรือ https://...' },
        { key: 'withdraw', label: 'ถอนเงิน Icon', placeholder: '↗ หรือ https://...' },
        { key: 'games', label: 'เกม Icon', placeholder: '🎮 หรือ https://...' },
        { key: 'bonus', label: 'โบนัส Icon', placeholder: '★ หรือ https://...' },
        { key: 'affiliate', label: 'ตัวแทน Icon', placeholder: '↔ หรือ https://...' },
        { key: 'support', label: 'ช่วยเหลือ Icon', placeholder: '✉ หรือ https://...' },
        { key: 'history', label: 'ประวัติ Icon', placeholder: '≡ หรือ https://...' },
        { key: 'bank', label: 'บัญชีธนาคาร Icon', placeholder: '◈ หรือ https://...' },
        { key: 'profile', label: 'โปรไฟล์ Icon', placeholder: '👤 หรือ https://...' },
        { key: 'notification', label: 'แจ้งเตือน Icon', placeholder: '🔔 หรือ https://...' },
        { key: 'promotion', label: 'โปรโมชัน Icon', placeholder: '🎁 หรือ https://...' },
        { key: 'vip', label: 'VIP Icon', placeholder: '♛ หรือ https://...' },
        { key: 'wallet', label: 'ยอดเงิน Icon', placeholder: '฿ หรือ https://...' },
      ]}
    />
  );
}
