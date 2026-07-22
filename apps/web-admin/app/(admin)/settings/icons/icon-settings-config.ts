const MENU_ROOT = '/assets/reference-brand/menu';

type IconSettingsDefinition = {
  key: string;
  label: string;
  outputFile: string;
  sourceFile: string;
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

const ALL_DEFINITIONS = [...PRIMARY_MENU_ICONS, ...GAME_CATEGORY_ICON_DEFINITIONS];

export const ICON_SETTINGS_DEFAULTS: Record<string, string> = Object.fromEntries(
  ALL_DEFINITIONS.map((item) => [item.key, `${MENU_ROOT}/${item.outputFile}`]),
);

export const ICON_SETTINGS_FIELDS = ALL_DEFINITIONS.map((item) => ({
  key: item.key,
  label: `${item.label} (${item.sourceFile} → ${item.outputFile})`,
  placeholder: `${MENU_ROOT}/${item.outputFile}`,
}));

export function referenceIconPath(outputFile: string) {
  return `${MENU_ROOT}/${outputFile}`;
}
