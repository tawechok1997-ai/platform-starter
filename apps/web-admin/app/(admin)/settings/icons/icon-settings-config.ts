const MENU_ROOT = '/assets/reference-brand/menu';

type IconSettingsDefinition = {
  key: string;
  label: string;
  outputFile: string;
  sourceFile: string;
  section?: string;
};

type TextIconSettingsDefinition = {
  key: string;
  label: string;
  defaultValue: string;
};

const PRIMARY_MENU_ICONS: IconSettingsDefinition[] = [
  { key: 'home', label: 'เมนูหน้าแรก', outputFile: 'home.png', sourceFile: 'หน้าเเรก.png' },
  { key: 'deposit', label: 'เมนูฝากเงิน', outputFile: 'deposit.png', sourceFile: 'ฝาก.png' },
  { key: 'withdraw', label: 'เมนูถอนเงิน', outputFile: 'withdraw.png', sourceFile: 'ถอน.png' },
  { key: 'games', label: 'เมนูเกม', outputFile: 'home.png', sourceFile: 'หน้าเเรก.png' },
  { key: 'promotion', label: 'เมนูโปรโมชัน', outputFile: 'promotion.png', sourceFile: 'โปรโมชัน.png' },
  { key: 'bonus', label: 'เมนูโบนัส', outputFile: 'bonus.png', sourceFile: 'โบนัส.png' },
  { key: 'affiliate', label: 'เมนูแนะนำเพื่อน', outputFile: 'affiliate.png', sourceFile: 'ลิ้งเเนะนำเพื่อน.png' },
  { key: 'support', label: 'เมนูบริการลูกค้า', outputFile: 'support.png', sourceFile: 'บริการลูกค้า.png' },
  { key: 'history', label: 'เมนูประวัติ', outputFile: 'history.png', sourceFile: 'ประวัตื.png' },
  { key: 'notification', label: 'เมนูแจ้งเตือน', outputFile: 'notification.png', sourceFile: 'เเจ้งเตอน.png' },
];

const SHARED_RUNTIME_ICONS: IconSettingsDefinition[] = [
  { key: 'casino', label: 'Navigation: คาสิโน', outputFile: 'casino.png', sourceFile: 'คาสิโน.png', section: 'Runtime กลาง Desktop และ Mobile' },
  { key: 'slot', label: 'Navigation: สล็อต', outputFile: 'slot.png', sourceFile: 'สล็อต.png', section: 'Runtime กลาง Desktop และ Mobile' },
  { key: 'fishing', label: 'Navigation: ยิงปลา', outputFile: 'fishing.png', sourceFile: 'ตกปลา.png', section: 'Runtime กลาง Desktop และ Mobile' },
  { key: 'sport', label: 'Navigation: กีฬา', outputFile: 'sport.png', sourceFile: 'กีฬา.png', section: 'Runtime กลาง Desktop และ Mobile' },
  { key: 'card', label: 'Navigation: ไพ่', outputFile: 'card.png', sourceFile: 'ไพ่.png', section: 'Runtime กลาง Desktop และ Mobile' },
  { key: 'lottery', label: 'Navigation: หวย', outputFile: 'lottery.png', sourceFile: 'หวย.png', section: 'Runtime กลาง Desktop และ Mobile' },
  { key: 'live', label: 'Navigation: ถ่ายทอดสด', outputFile: 'live.png', sourceFile: 'ถ่ายทอดสด.png', section: 'Runtime กลาง Desktop และ Mobile' },
  { key: 'mission', label: 'Header: ภารกิจ', outputFile: 'bonus.png', sourceFile: 'โบนัส.png', section: 'Runtime กลาง Desktop และ Mobile' },
  { key: 'announcement', label: 'หน้าแรก: ประกาศ', outputFile: 'notification.png', sourceFile: 'เเจ้งเตอน.png', section: 'Runtime กลาง Desktop และ Mobile' },
  { key: 'activity', label: 'หน้าแรก: กิจกรรม', outputFile: 'activities.png', sourceFile: 'กิจกรรม.png', section: 'Runtime กลาง Desktop และ Mobile' },
  { key: 'news', label: 'หน้าแรก: ข่าวสาร', outputFile: 'news.png', sourceFile: 'ข่าวสาร.png', section: 'Runtime กลาง Desktop และ Mobile' },
  { key: 'tournament', label: 'หน้าแรก: Tournament', outputFile: 'activities.png', sourceFile: 'กิจกรรม.png', section: 'Runtime กลาง Desktop และ Mobile' },
  { key: 'jackpot', label: 'หน้าแรก: Jackpot', outputFile: 'bonus.png', sourceFile: 'โบนัส.png', section: 'Runtime กลาง Desktop และ Mobile' },
  { key: 'leaderboard', label: 'หน้าแรก: Leaderboard', outputFile: 'recommended.png', sourceFile: 'เเนะนำ.png', section: 'Runtime กลาง Desktop และ Mobile' },
  { key: 'mini_game', label: 'หน้าแรก: Mini Game', outputFile: 'activities.png', sourceFile: 'กิจกรรม.png', section: 'Runtime กลาง Desktop และ Mobile' },
  { key: 'popular_games', label: 'Section: เกมยอดนิยม', outputFile: 'recommended.png', sourceFile: 'เเนะนำ.png', section: 'Runtime กลาง Desktop และ Mobile' },
  { key: 'online_games', label: 'Section: เกมออนไลน์', outputFile: 'home.png', sourceFile: 'หน้าเเรก.png', section: 'Runtime กลาง Desktop และ Mobile' },
  { key: 'classic_games', label: 'Section: Classic Games', outputFile: 'activities.png', sourceFile: 'กิจกรรม.png', section: 'Runtime กลาง Desktop และ Mobile' },
  { key: 'contact', label: 'ระบบติดต่อกลาง', outputFile: 'support.png', sourceFile: 'บริการลูกค้า.png', section: 'Runtime กลาง Desktop และ Mobile' },
];

const LEGACY_TEXT_ICONS: TextIconSettingsDefinition[] = [
  { key: 'bank', label: 'เมนูบัญชีธนาคาร', defaultValue: '◈' },
  { key: 'profile', label: 'เมนูโปรไฟล์', defaultValue: '👤' },
  { key: 'vip', label: 'เมนู VIP', defaultValue: '♛' },
  { key: 'wallet', label: 'เมนูยอดเงิน', defaultValue: '฿' },
];

const CLOSE_ICON_FIELD = {
  key: 'close',
  label: 'ปุ่มปิด Modal',
  section: 'ไอคอนระบบ',
  placeholder: '/images/close.svg',
  helper: 'แสดงตัวอย่างรูปปัจจุบันและรูปใหม่ก่อนบันทึก รองรับ URL หรืออัปโหลดไฟล์',
  type: 'url' as const,
  asset: true,
  defaultValue: '/images/close.svg',
};

export const GAME_CATEGORY_ICON_DEFINITIONS: IconSettingsDefinition[] = [
  { key: 'game_category_home_icon', label: 'หมวดเกม: หน้าหลัก', outputFile: 'home.png', sourceFile: 'หน้าเเรก.png' },
  { key: 'game_category_casino_icon', label: 'หมวดเกม: คาสิโน', outputFile: 'casino.png', sourceFile: 'คาสิโน.png' },
  { key: 'game_category_slot_icon', label: 'หมวดเกม: สล็อต', outputFile: 'slot.png', sourceFile: 'สล็อต.png' },
  { key: 'game_category_live_icon', label: 'หมวดเกม: คาสิโนสด', outputFile: 'live.png', sourceFile: 'ถ่ายทอดสด.png' },
  { key: 'game_category_sport_icon', label: 'หมวดเกม: กีฬา', outputFile: 'sport.png', sourceFile: 'กีฬา.png' },
  { key: 'game_category_fishing_icon', label: 'หมวดเกม: ยิงปลา', outputFile: 'fishing.png', sourceFile: 'ตกปลา.png' },
  { key: 'game_category_lottery_icon', label: 'หมวดเกม: หวย', outputFile: 'lottery.png', sourceFile: 'หวย.png' },
  { key: 'game_category_card_icon', label: 'หมวดเกม: ไพ่', outputFile: 'card.png', sourceFile: 'ไพ่.png' },
  { key: 'game_category_arcade_icon', label: 'หมวดเกม: อาร์เคด', outputFile: 'activities.png', sourceFile: 'กิจกรรม.png' },
  { key: 'game_category_new_icon', label: 'หมวดเกม: เกมใหม่', outputFile: 'news.png', sourceFile: 'ข่าวสาร.png' },
  { key: 'game_category_popular_icon', label: 'หมวดเกม: ยอดนิยม', outputFile: 'recommended.png', sourceFile: 'เเนะนำ.png' },
  { key: 'game_category_other_icon', label: 'หมวดเกม: หมวดอื่นจาก API', outputFile: 'home.png', sourceFile: 'หน้าเเรก.png' },
];

const ALL_IMAGE_DEFINITIONS = [...PRIMARY_MENU_ICONS, ...SHARED_RUNTIME_ICONS, ...GAME_CATEGORY_ICON_DEFINITIONS];

export const ICON_SETTINGS_DEFAULTS: Record<string, string> = {
  ...Object.fromEntries(ALL_IMAGE_DEFINITIONS.map((item) => [item.key, `${MENU_ROOT}/${item.outputFile}`])),
  ...Object.fromEntries(LEGACY_TEXT_ICONS.map((item) => [item.key, item.defaultValue])),
  close: CLOSE_ICON_FIELD.defaultValue,
};

export const ICON_SETTINGS_FIELDS = [
  ...PRIMARY_MENU_ICONS.map((item) => imageField(item, 'เมนูหลักและทางลัด')),
  ...SHARED_RUNTIME_ICONS.map((item) => imageField(item, item.section ?? 'Runtime กลาง Desktop และ Mobile')),
  ...LEGACY_TEXT_ICONS.map((item) => ({
    key: item.key,
    label: item.label,
    section: 'ไอคอนข้อความและ URL สำรอง',
    placeholder: item.defaultValue,
    helper: 'รองรับอักขระหรือ Emoji ตามจุดใช้งาน',
    defaultValue: item.defaultValue,
  })),
  CLOSE_ICON_FIELD,
  ...GAME_CATEGORY_ICON_DEFINITIONS.map((item) => imageField(item, 'หมวดเกม')),
];

export function referenceIconPath(outputFile: string) {
  return `${MENU_ROOT}/${outputFile}`;
}

function imageField(item: IconSettingsDefinition, section: string) {
  return {
    key: item.key,
    label: item.label,
    section,
    placeholder: `${MENU_ROOT}/${item.outputFile}`,
    helper: `ไฟล์ต้นแบบ ${item.sourceFile} · ค่าเริ่มต้น ${item.outputFile}`,
    type: 'url' as const,
    asset: true,
    defaultValue: `${MENU_ROOT}/${item.outputFile}`,
  };
}
