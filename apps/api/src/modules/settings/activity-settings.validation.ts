import { BadRequestException } from '@nestjs/common';

const JSON_ARRAY_KEYS = [
  'activity_cards_json',
  'daily_login_rewards_json',
  'mission_definitions_json',
  'turnover_reward_tiers_json',
  'lottery_prediction_rounds_json',
] as const;

export function validateActivitySettingsUpdate(body: Record<string, unknown>) {
  const normalized = { ...body };

  for (const key of JSON_ARRAY_KEYS) {
    if (!(key in normalized)) continue;
    const value = normalized[key];
    if (Array.isArray(value)) {
      normalized[key] = JSON.stringify(value, null, 2);
      continue;
    }
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${key} must be a JSON array string`);
    }
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) throw new Error('not-array');
      normalized[key] = JSON.stringify(parsed, null, 2);
    } catch {
      throw new BadRequestException(`${key} contains invalid JSON array data`);
    }
  }

  if ('activity_timezone' in normalized) {
    const timezone = String(normalized.activity_timezone ?? '').trim();
    if (!timezone) throw new BadRequestException('activity_timezone is required');
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
    } catch {
      throw new BadRequestException('activity_timezone is invalid');
    }
    normalized.activity_timezone = timezone;
  }

  if ('daily_login_cycle_days' in normalized) {
    normalized.daily_login_cycle_days = boundedInteger(normalized.daily_login_cycle_days, 'daily_login_cycle_days', 1, 366);
  }
  if ('daily_login_reset_hour' in normalized) {
    normalized.daily_login_reset_hour = boundedInteger(normalized.daily_login_reset_hour, 'daily_login_reset_hour', 0, 23);
  }
  if ('daily_login_cycle_anchor' in normalized) {
    const anchor = String(normalized.daily_login_cycle_anchor ?? '').trim();
    if (!anchor || Number.isNaN(Date.parse(anchor))) throw new BadRequestException('daily_login_cycle_anchor must be ISO 8601');
    normalized.daily_login_cycle_anchor = anchor;
  }

  validateCards(normalized.activity_cards_json);
  validateDailyRewards(normalized.daily_login_rewards_json);
  validateMissions(normalized.mission_definitions_json);
  validateTurnover(normalized.turnover_reward_tiers_json);
  validateLotteryRounds(normalized.lottery_prediction_rounds_json);

  return normalized;
}

function validateCards(value: unknown) {
  for (const item of parsedArray(value)) {
    const row = record(item, 'activity card');
    requiredString(row.code, 'activity card code');
    requiredString(row.title, 'activity card title');
    requiredString(row.imageUrl, 'activity card imageUrl');
    const href = requiredString(row.href, 'activity card href');
    if (!href.startsWith('/mobile/member/activity/')) throw new BadRequestException('activity card href must use /mobile/member/activity/*');
  }
}

function validateDailyRewards(value: unknown) {
  const rows = parsedArray(value);
  const days = new Set<number>();
  for (const item of rows) {
    const row = record(item, 'daily reward');
    const day = boundedInteger(row.day, 'daily reward day', 1, 366);
    if (days.has(day)) throw new BadRequestException(`daily reward day ${day} is duplicated`);
    days.add(day);
    requiredString(row.code, 'daily reward code');
    rewardType(row.rewardType);
    nonNegative(row.amount, 'daily reward amount');
  }
}

function validateMissions(value: unknown) {
  const codes = new Set<string>();
  for (const item of parsedArray(value)) {
    const row = record(item, 'mission');
    const code = requiredString(row.code, 'mission code');
    if (codes.has(code)) throw new BadRequestException(`mission code ${code} is duplicated`);
    codes.add(code);
    requiredString(row.metricCode, 'mission metricCode');
    requiredString(row.title, 'mission title');
    positive(row.target, 'mission target');
    rewardType(row.rewardType);
    nonNegative(row.rewardAmount, 'mission rewardAmount');
    if (!['DAILY', 'WEEKLY', 'MONTHLY', 'CAMPAIGN'].includes(String(row.period ?? ''))) {
      throw new BadRequestException('mission period must be DAILY, WEEKLY, MONTHLY or CAMPAIGN');
    }
  }
}

function validateTurnover(value: unknown) {
  const codes = new Set<string>();
  for (const item of parsedArray(value)) {
    const row = record(item, 'turnover tier');
    const code = requiredString(row.code, 'turnover tier code');
    if (codes.has(code)) throw new BadRequestException(`turnover tier code ${code} is duplicated`);
    codes.add(code);
    if (row.category !== 'slot' && row.category !== 'casino') throw new BadRequestException('turnover category must be slot or casino');
    positive(row.turnover, 'turnover target');
    nonNegative(row.bonus, 'turnover bonus');
  }
}

function validateLotteryRounds(value: unknown) {
  const codes = new Set<string>();
  for (const item of parsedArray(value)) {
    const row = record(item, 'lottery round');
    const code = requiredString(row.code, 'lottery round code');
    if (codes.has(code)) throw new BadRequestException(`lottery round code ${code} is duplicated`);
    codes.add(code);
    requiredString(row.title, 'lottery round title');
    requiredString(row.bannerUrl, 'lottery round bannerUrl');
    const opensAt = requiredDate(row.opensAt, 'lottery round opensAt');
    const closesAt = requiredDate(row.closesAt, 'lottery round closesAt');
    if (closesAt <= opensAt) throw new BadRequestException('lottery round closesAt must be after opensAt');
    boundedInteger(row.topDigits, 'lottery topDigits', 1, 10);
    boundedInteger(row.bottomDigits, 'lottery bottomDigits', 1, 10);
    nonNegative(row.topReward, 'lottery topReward');
    nonNegative(row.bottomReward, 'lottery bottomReward');
    nonNegative(row.bothReward, 'lottery bothReward');
  }
}

function parsedArray(value: unknown): unknown[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, label: string) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new BadRequestException(`${label} is required`);
  return text;
}

function requiredDate(value: unknown, label: string) {
  const text = requiredString(value, label);
  const time = Date.parse(text);
  if (Number.isNaN(time)) throw new BadRequestException(`${label} is invalid`);
  return time;
}

function rewardType(value: unknown) {
  if (!['CREDIT', 'POINT', 'TICKET'].includes(String(value ?? ''))) {
    throw new BadRequestException('rewardType must be CREDIT, POINT or TICKET');
  }
}

function positive(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new BadRequestException(`${label} must be greater than zero`);
  return number;
}

function nonNegative(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new BadRequestException(`${label} must be zero or greater`);
  return number;
}

function boundedInteger(value: unknown, label: string, min: number, max: number) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw new BadRequestException(`${label} must be an integer from ${min} to ${max}`);
  return number;
}
