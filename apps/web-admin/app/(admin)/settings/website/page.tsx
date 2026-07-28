import SettingsSectionPage from '../settings-section-page';

const defaults = {
  site_name: '',
  site_description: '',
  site_url: '',
  admin_url: '',
  default_language: 'th',
  timezone: 'Asia/Bangkok',
  currency: 'THB',
  date_format: 'DD/MM/YYYY',
  maintenance_mode: false,
  registration_enabled: true,
  login_enabled: true,
  home_heading: 'ยินดีต้อนรับ',
  home_subtitle: 'เลือกเกม โปรโมชั่น และบริการที่ต้องการ',
  announcement_label: 'ประกาศ',
  promotions_heading: 'โปรโมชั่นแนะนำ',
  games_heading: 'เกมทั้งหมด',
  providers_heading: 'ค่ายเกม',
  featured_games_heading: 'เกมแนะนำ',
  popular_games_heading: 'ยอดนิยม',
  recent_games_heading: 'เล่นล่าสุด',
  favorite_games_heading: 'เกมโปรด',
  empty_games_message: 'ยังไม่มีเกมที่พร้อมแสดง',
  empty_promotions_message: 'ยังไม่มีโปรโมชั่นที่เปิดใช้งาน',
  login_title: 'ยินดีต้อนรับกลับ',
  login_subtitle: 'เข้าสู่บัญชีของคุณอย่างปลอดภัย',
  register_title: 'สมัครสมาชิก',
  register_subtitle: 'กรอกข้อมูลให้ครบในไม่กี่ขั้นตอน',
  deposit_label: 'ฝากเงิน',
  withdraw_label: 'ถอนเงิน',
  support_label: 'ติดต่อเรา',
};

export default function WebsiteSettingsPage() {
  return (
    <SettingsSectionPage
      group="website"
      title="ข้อมูลและข้อความเว็บไซต์"
      description="กำหนดชื่อ โดเมน ภาษา สถานะการเข้าถึง และข้อความที่หน้า Member นำไปใช้จริง"
      defaults={defaults}
      risk="sensitive"
      fields={[
        { key: 'site_name', label: 'ชื่อเว็บไซต์', section: 'ข้อมูลเว็บไซต์', required: true, maxLength: 160 },
        { key: 'site_description', label: 'คำอธิบายเว็บไซต์', type: 'textarea', section: 'ข้อมูลเว็บไซต์', maxLength: 1000 },
        { key: 'site_url', label: 'โดเมน Member', type: 'url', section: 'ข้อมูลเว็บไซต์', required: true, placeholder: 'https://example.com' },
        { key: 'admin_url', label: 'โดเมน Admin', type: 'url', section: 'ข้อมูลเว็บไซต์', required: true, placeholder: 'https://admin.example.com' },
        { key: 'default_language', label: 'ภาษาเริ่มต้น', type: 'select', section: 'ภาษาและภูมิภาค', required: true, options: [{ value: 'th', label: 'ไทย' }, { value: 'en', label: 'English' }] },
        { key: 'timezone', label: 'เขตเวลา', type: 'select', section: 'ภาษาและภูมิภาค', required: true, options: [{ value: 'Asia/Bangkok', label: 'Asia/Bangkok (UTC+7)' }, { value: 'UTC', label: 'UTC' }] },
        { key: 'currency', label: 'สกุลเงิน', type: 'select', section: 'ภาษาและภูมิภาค', required: true, options: [{ value: 'THB', label: 'THB – บาทไทย' }, { value: 'USD', label: 'USD – ดอลลาร์สหรัฐ' }] },
        { key: 'date_format', label: 'รูปแบบวันที่', type: 'select', section: 'ภาษาและภูมิภาค', required: true, options: [{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }, { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }] },
        { key: 'maintenance_mode', label: 'โหมดปิดปรับปรุงทั้งเว็บไซต์', type: 'checkbox', section: 'สถานะระบบ', helper: 'ใช้เฉพาะกรณีจำเป็น หน้า Maintenance แยกสามารถควบคุมบริการละเอียดกว่า' },
        { key: 'registration_enabled', label: 'เปิดรับสมัครสมาชิก', type: 'checkbox', section: 'สถานะระบบ', helper: 'ปิดแล้วผู้ใช้ใหม่จะสร้างบัญชีไม่ได้' },
        { key: 'login_enabled', label: 'เปิดให้เข้าสู่ระบบ', type: 'checkbox', section: 'สถานะระบบ', helper: 'ปิดแล้วสมาชิกจะเข้าสู่ระบบไม่ได้' },
        { key: 'home_heading', label: 'หัวข้อหน้าแรก', section: 'ข้อความหน้าแรก', required: true, maxLength: 160 },
        { key: 'home_subtitle', label: 'คำอธิบายหน้าแรก', type: 'textarea', section: 'ข้อความหน้าแรก', maxLength: 600 },
        { key: 'announcement_label', label: 'ป้ายประกาศ', section: 'ข้อความหน้าแรก', maxLength: 80 },
        { key: 'promotions_heading', label: 'หัวข้อโปรโมชั่น', section: 'ข้อความหน้าแรก', maxLength: 120 },
        { key: 'games_heading', label: 'หัวข้อเกมทั้งหมด', section: 'ข้อความหน้าเกม', maxLength: 120 },
        { key: 'providers_heading', label: 'หัวข้อค่ายเกม', section: 'ข้อความหน้าเกม', maxLength: 120 },
        { key: 'featured_games_heading', label: 'หัวข้อเกมแนะนำ', section: 'ข้อความหน้าเกม', maxLength: 120 },
        { key: 'popular_games_heading', label: 'หัวข้อเกมยอดนิยม', section: 'ข้อความหน้าเกม', maxLength: 120 },
        { key: 'recent_games_heading', label: 'หัวข้อเล่นล่าสุด', section: 'ข้อความหน้าเกม', maxLength: 120 },
        { key: 'favorite_games_heading', label: 'หัวข้อเกมโปรด', section: 'ข้อความหน้าเกม', maxLength: 120 },
        { key: 'empty_games_message', label: 'ข้อความเมื่อไม่มีเกม', type: 'textarea', section: 'ข้อความ Empty State', maxLength: 600 },
        { key: 'empty_promotions_message', label: 'ข้อความเมื่อไม่มีโปรโมชั่น', type: 'textarea', section: 'ข้อความ Empty State', maxLength: 600 },
        { key: 'login_title', label: 'หัวข้อเข้าสู่ระบบ', section: 'Login และ Register', maxLength: 120 },
        { key: 'login_subtitle', label: 'คำอธิบายเข้าสู่ระบบ', type: 'textarea', section: 'Login และ Register', maxLength: 500 },
        { key: 'register_title', label: 'หัวข้อสมัครสมาชิก', section: 'Login และ Register', maxLength: 120 },
        { key: 'register_subtitle', label: 'คำอธิบายสมัครสมาชิก', type: 'textarea', section: 'Login และ Register', maxLength: 500 },
        { key: 'deposit_label', label: 'ข้อความปุ่มฝากเงิน', section: 'ปุ่มงานหลัก', maxLength: 80 },
        { key: 'withdraw_label', label: 'ข้อความปุ่มถอนเงิน', section: 'ปุ่มงานหลัก', maxLength: 80 },
        { key: 'support_label', label: 'ข้อความปุ่มติดต่อเรา', section: 'ปุ่มงานหลัก', maxLength: 80 },
      ]}
    />
  );
}
