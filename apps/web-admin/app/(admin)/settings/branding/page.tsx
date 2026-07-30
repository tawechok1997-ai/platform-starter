import { AdminStack } from '../../_components/admin-ui';
import SettingsSectionPage from '../settings-section-page';
import BrandingPublishPanel from './branding-publish-panel';

const REFERENCE_LOGO = '/assets/reference-brand/header/noah345-logo.webp';
const REFERENCE_FAVICON = 'https://cdn.zabbet.com/FEZX/lobby_settings/083e4b9b-63aa-4825-a0e3-57a88de57e2f.ico';

export default function BrandingSettingsPage() {
  return (
    <AdminStack>
      <BrandingPublishPanel />
      <SettingsSectionPage
        group="branding"
        title="แบรนด์และภาพลักษณ์"
        description="แก้ไขโลโก้ ไอคอนแท็บเว็บ สี รูปทรง และฟอนต์เป็น Draft จากนั้นตรวจ Preview ก่อน Publish ผ่าน workflow ด้านบน"
        preview="branding"
        risk="sensitive"
        defaults={{
          logo_url: REFERENCE_LOGO,
          logo_horizontal_url: REFERENCE_LOGO,
          logo_square_url: REFERENCE_LOGO,
          logo_mobile_url: REFERENCE_LOGO,
          logo_login_url: REFERENCE_LOGO,
          logo_register_url: REFERENCE_LOGO,
          favicon_url: REFERENCE_FAVICON,
        }}
        fields={[
          { key: 'brand_mark', label: 'Brand Mark', section: 'อัตลักษณ์แบรนด์', maxLength: 24, placeholder: 'เช่น P, K, ★ หรือชื่อย่อ' },
          { key: 'logo_url', label: 'โลโก้หลัก', section: 'โลโก้ตามพื้นที่ใช้งาน', asset: true, defaultValue: REFERENCE_LOGO, helper: 'ใช้เป็นค่า fallback หลักเมื่อพื้นที่นั้นไม่ได้ระบุโลโก้เฉพาะ' },
          { key: 'logo_horizontal_url', label: 'โลโก้แนวนอน', section: 'โลโก้ตามพื้นที่ใช้งาน', asset: true, defaultValue: REFERENCE_LOGO },
          { key: 'logo_square_url', label: 'โลโก้สี่เหลี่ยม', section: 'โลโก้ตามพื้นที่ใช้งาน', asset: true, defaultValue: REFERENCE_LOGO },
          { key: 'logo_mobile_url', label: 'โลโก้ Mobile', section: 'โลโก้ตามพื้นที่ใช้งาน', asset: true, defaultValue: REFERENCE_LOGO },
          { key: 'logo_login_url', label: 'โลโก้หน้า Login', section: 'โลโก้ตามพื้นที่ใช้งาน', asset: true, defaultValue: REFERENCE_LOGO },
          { key: 'logo_register_url', label: 'โลโก้หน้า Register', section: 'โลโก้ตามพื้นที่ใช้งาน', asset: true, defaultValue: REFERENCE_LOGO },
          { key: 'logo_dark_url', label: 'โลโก้บนพื้นหลังเข้ม', section: 'โลโก้ตามพื้นที่ใช้งาน', asset: true },
          { key: 'logo_light_url', label: 'โลโก้บนพื้นหลังสว่าง', section: 'โลโก้ตามพื้นที่ใช้งาน', asset: true },
          { key: 'footer_logo_url', label: 'โลโก้ Footer', section: 'โลโก้ตามพื้นที่ใช้งาน', asset: true },
          { key: 'loading_logo_url', label: 'โลโก้ Loading', section: 'โลโก้ตามพื้นที่ใช้งาน', asset: true },
          { key: 'watermark_logo_url', label: 'โลโก้ Watermark', section: 'โลโก้ตามพื้นที่ใช้งาน', asset: true },
          { key: 'favicon_url', label: 'ไอคอนแท็บเว็บ (Favicon)', section: 'App และ Browser Icons', asset: true, defaultValue: REFERENCE_FAVICON, placeholder: REFERENCE_FAVICON, helper: 'อัปโหลด PNG, WebP, JPG หรือ GIF แบบสี่เหลี่ยม หรือใส่ URL ไฟล์ ICO/SVG โดยตรง แนะนำขนาด 32×32 หรือ 64×64 พิกเซล' },
          { key: 'apple_touch_icon_url', label: 'Apple Touch Icon', section: 'App และ Browser Icons', asset: true },
          { key: 'pwa_icon_url', label: 'PWA Icon', section: 'App และ Browser Icons', asset: true },
          { key: 'app_icon_url', label: 'App Icon', section: 'App และ Browser Icons', asset: true },
          { key: 'open_graph_image_url', label: 'Open Graph Image', section: 'รูปเริ่มต้นและ Placeholder', asset: true, helper: 'รูป fallback เวลาแชร์ หากหน้า SEO ไม่ได้กำหนดรูปเฉพาะ' },
          { key: 'default_avatar_url', label: 'Default Avatar', section: 'รูปเริ่มต้นและ Placeholder', asset: true },
          { key: 'game_placeholder_url', label: 'Game Placeholder', section: 'รูปเริ่มต้นและ Placeholder', asset: true },
          { key: 'promotion_placeholder_url', label: 'Promotion Placeholder', section: 'รูปเริ่มต้นและ Placeholder', asset: true },
          { key: 'primary_color', label: 'สีหลัก', type: 'color', section: 'ชุดสี' },
          { key: 'secondary_color', label: 'สีรอง', type: 'color', section: 'ชุดสี' },
          { key: 'accent_color', label: 'สี Accent', type: 'color', section: 'ชุดสี' },
          { key: 'background_color', label: 'สีพื้นหลัง', type: 'color', section: 'ชุดสี' },
          { key: 'card_color', label: 'สีการ์ด', type: 'color', section: 'ชุดสี' },
          { key: 'button_color', label: 'สีปุ่ม', type: 'color', section: 'ชุดสี' },
          { key: 'text_color', label: 'สีข้อความ', type: 'color', section: 'ชุดสี' },
          { key: 'muted_text_color', label: 'สีข้อความรอง', type: 'color', section: 'ชุดสี' },
          { key: 'border_color', label: 'สีเส้นขอบ', type: 'color', section: 'ชุดสี' },
          { key: 'success_color', label: 'สี Success', type: 'color', section: 'สีสถานะ' },
          { key: 'danger_color', label: 'สี Danger', type: 'color', section: 'สีสถานะ' },
          { key: 'warning_color', label: 'สี Warning', type: 'color', section: 'สีสถานะ' },
          { key: 'info_color', label: 'สี Info', type: 'color', section: 'สีสถานะ' },
          { key: 'card_radius', label: 'รัศมีมุมการ์ด', section: 'รูปทรงและความกว้าง', maxLength: 32, placeholder: '16px' },
          { key: 'content_width', label: 'ความกว้างเนื้อหาสูงสุด', section: 'รูปทรงและความกว้าง', maxLength: 32, placeholder: '1440px' },
          { key: 'font_thai', label: 'ฟอนต์ภาษาไทย', section: 'Typography', maxLength: 240, placeholder: 'LINE Seed Sans TH, Noto Sans Thai, sans-serif' },
          { key: 'font_latin', label: 'ฟอนต์ Latin', section: 'Typography', maxLength: 240, placeholder: 'Inter, sans-serif' },
          { key: 'font_numeric', label: 'ฟอนต์ตัวเลข', section: 'Typography', maxLength: 240, placeholder: 'Inter, sans-serif' },
        ]}
      />
    </AdminStack>
  );
}
