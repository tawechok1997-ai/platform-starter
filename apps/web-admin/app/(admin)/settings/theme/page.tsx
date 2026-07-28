import SettingsSectionPage from '../settings-section-page';

export default function ThemeSettingsPage() {
  return (
    <SettingsSectionPage
      group="theme"
      title="ธีมและการจัดวาง"
      description="ควบคุมโครงหน้าสมาชิก การนำทาง จำนวนคอลัมน์เกม และระดับ motion จากจุดเดียว"
      preview="theme"
      fields={[
        { key: 'animation_level', label: 'ระดับ Animation', type: 'select', section: 'Motion และการตอบสนอง', required: true, options: [{ value: 'off', label: 'ปิด' }, { value: 'subtle', label: 'นุ่มนวล' }, { value: 'lively', label: 'มีชีวิตชีวา' }], helper: 'เลือกระดับ motion ที่ใช้กับหน้า Member ทั้งระบบ' },
        { key: 'game_grid_columns', label: 'จำนวนคอลัมน์เกม', type: 'number', section: 'โครงหน้าเกม', min: 2, max: 8, required: true, helper: 'รองรับ 2–8 คอลัมน์ ระบบ Mobile จะปรับตามพื้นที่อัตโนมัติ' },
        { key: 'hero_banner_enabled', label: 'แสดง Hero Banner', type: 'checkbox', section: 'ส่วนประกอบหน้าแรก', helper: 'เปิดพื้นที่แบนเนอร์หลักที่อ่านรูปจาก Content Center' },
        { key: 'provider_menu_enabled', label: 'แสดงเมนูค่ายเกม', type: 'checkbox', section: 'ส่วนประกอบหน้าแรก' },
        { key: 'show_promotion_banner', label: 'แสดงแบนเนอร์โปรโมชัน', type: 'checkbox', section: 'ส่วนประกอบหน้าแรก' },
        { key: 'show_game_categories', label: 'แสดงหมวดเกม', type: 'checkbox', section: 'ส่วนประกอบหน้าแรก' },
        { key: 'show_popular_providers', label: 'แสดงค่ายเกมยอดนิยม', type: 'checkbox', section: 'ส่วนประกอบหน้าแรก' },
        { key: 'show_recommended_games', label: 'แสดงเกมแนะนำ', type: 'checkbox', section: 'ส่วนประกอบหน้าแรก' },
        { key: 'bottom_navigation_enabled', label: 'แสดง Bottom Navigation', type: 'checkbox', section: 'การนำทาง', helper: 'ใช้กับหน้าจอ Mobile เป็นหลัก' },
        { key: 'desktop_sidebar_enabled', label: 'แสดง Sidebar บน Desktop', type: 'checkbox', section: 'การนำทาง' },
        { key: 'sticky_wallet_enabled', label: 'ตรึงกระเป๋าเงิน', type: 'checkbox', section: 'การนำทาง' },
        { key: 'floating_deposit_button_enabled', label: 'แสดงปุ่มฝากเงินแบบลอย', type: 'checkbox', section: 'การนำทาง' },
        { key: 'show_balance_header', label: 'แสดงยอดเงินบน Header', type: 'checkbox', section: 'ข้อมูลสมาชิก' },
        { key: 'show_deposit_withdraw_buttons', label: 'แสดงปุ่มฝากและถอน', type: 'checkbox', section: 'ข้อมูลสมาชิก' },
        { key: 'show_provider_name', label: 'แสดงชื่อ Provider บนการ์ดเกม', type: 'checkbox', section: 'การ์ดเกม' },
        { key: 'show_hot_badge', label: 'แสดงป้าย HOT', type: 'checkbox', section: 'การ์ดเกม' },
        { key: 'show_new_badge', label: 'แสดงป้าย NEW', type: 'checkbox', section: 'การ์ดเกม' },
      ]}
    />
  );
}
