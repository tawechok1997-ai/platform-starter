import { BadRequestException } from '@nestjs/common';

export const ICON_SETTING_KEYS = [
  'home',
  'deposit',
  'withdraw',
  'games',
  'promotion',
  'bonus',
  'affiliate',
  'support',
  'history',
  'notification',
  'bank',
  'profile',
  'vip',
  'wallet',
  'game_category_home_icon',
  'game_category_casino_icon',
  'game_category_slot_icon',
  'game_category_live_icon',
  'game_category_sport_icon',
  'game_category_fishing_icon',
  'game_category_lottery_icon',
  'game_category_card_icon',
  'game_category_arcade_icon',
  'game_category_new_icon',
  'game_category_popular_icon',
  'game_category_other_icon',
] as const;

const ICON_SETTING_KEY_SET = new Set<string>(ICON_SETTING_KEYS);
const MAX_ICON_SETTING_VALUE_LENGTH = 2_048;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

export function validateIconSettingsUpdate(body: Record<string, unknown>) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Icon settings payload must be an object');
  }

  return Object.entries(body).reduce<Record<string, string>>((result, [key, value]) => {
    if (!ICON_SETTING_KEY_SET.has(key)) {
      throw new BadRequestException(`Unsupported icon setting: ${key}`);
    }
    if (typeof value !== 'string') {
      throw new BadRequestException(`Icon setting ${key} must be a string`);
    }
    if (value.length > MAX_ICON_SETTING_VALUE_LENGTH) {
      throw new BadRequestException(`Icon setting ${key} is too long`);
    }
    if (CONTROL_CHARACTER_PATTERN.test(value)) {
      throw new BadRequestException(`Icon setting ${key} contains invalid control characters`);
    }

    result[key] = value;
    return result;
  }, {});
}
