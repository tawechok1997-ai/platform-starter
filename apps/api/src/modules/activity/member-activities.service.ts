import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedAdminActor } from '../../common/actors';
import {
  type ActivityPeriod,
  type LotteryRoundConfig,
  type MissionDefinition,
  type TurnoverCategory,
} from './activity-config';
import { ActivityConfigService } from './activity-config.service';
import { ActivityRepository } from './activity.repository';

const DAILY_ACTIVITY = 'DAILY_LOGIN';
const MISSION_ACTIVITY = 'MISSION';
const TURNOVER_ACTIVITY = 'TURNOVER_REWARD';
const LOTTERY_ACTIVITY = 'LOTTERY_PREDICTION';

@Injectable()
export class MemberActivitiesService {
  constructor(
    private readonly configService: ActivityConfigService,
    private readonly repository: ActivityRepository,
  ) {}

  async listPublicActivities() {
    const config = await this.configService.getConfig();
    if (!config.enabled) return { enabled: false, items: [] };

    const now = new Date();
    const latestLotteryRound = config.lottery.rounds
      .filter((round) => round.enabled)
      .sort((a, b) => Date.parse(b.closesAt) - Date.parse(a.closesAt))[0];

    return {
      enabled: true,
      timezone: config.timezone,
      items: config.cards
        .filter((card) => card.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((card) => ({
          id: card.code,
          code: card.code,
          title: card.title,
          subtitle: card.code === 'lottery-prediction' && latestLotteryRound
            ? lotteryStatus(latestLotteryRound, now).label
            : card.subtitle ?? '',
          imageUrl: card.imageUrl,
          href: card.href,
          requiresLogin: card.requiresLogin,
          sortOrder: card.sortOrder,
        })),
    };
  }

  async getMemberOverview(memberId: string) {
    const [publicActivities, balances] = await Promise.all([
      this.listPublicActivities(),
      this.repository.getRewardBalances(memberId),
    ]);
    return { ...publicActivities, balances };
  }

  async getDailyLogin(memberId: string) {
    const config = await this.configService.getConfig();
    this.assertEnabled(config.enabled && config.dailyLogin.enabled, 'Daily login activity is disabled');

    const cycle = dailyCycle(new Date(), config.timezone, config.dailyLogin.resetHour, config.dailyLogin.cycleAnchor, config.dailyLogin.cycleDays);
    const claims = await this.repository.listClaims(memberId, DAILY_ACTIVITY, [cycle.periodKey]);
    const claimedCodes = new Set(claims.map((claim) => claim.reward_code));
    const rewards = config.dailyLogin.rewards
      .slice()
      .sort((a, b) => a.day - b.day)
      .map((reward) => ({
        ...reward,
        claimed: claimedCodes.has(reward.code),
        available: reward.day === cycle.day && !claimedCodes.has(reward.code),
      }));

    return {
      activityCode: DAILY_ACTIVITY,
      cycleDays: config.dailyLogin.cycleDays,
      periodKey: cycle.periodKey,
      currentDay: cycle.day,
      claimedCount: claims.length,
      canClaim: rewards.some((reward) => reward.available),
      rewards,
      resetHour: config.dailyLogin.resetHour,
      timezone: config.timezone,
    };
  }

  async claimDailyLogin(memberId: string) {
    const config = await this.configService.getConfig({ fresh: true });
    this.assertEnabled(config.enabled && config.dailyLogin.enabled, 'Daily login activity is disabled');
    const cycle = dailyCycle(new Date(), config.timezone, config.dailyLogin.resetHour, config.dailyLogin.cycleAnchor, config.dailyLogin.cycleDays);
    const reward = config.dailyLogin.rewards.find((item) => item.day === cycle.day);
    if (!reward) throw new NotFoundException('Daily reward is not configured');

    const result = await this.repository.createRewardClaim({
      memberId,
      activityCode: DAILY_ACTIVITY,
      rewardCode: reward.code,
      periodKey: cycle.periodKey,
      rewardType: reward.rewardType,
      amount: reward.amount,
      idempotencyKey: `activity:daily:${memberId}:${cycle.periodKey}:${reward.code}`,
      metadata: { day: reward.day, cycleDays: config.dailyLogin.cycleDays },
    });
    return { success: true, duplicate: !result.created, claim: serializeClaim(result.claim) };
  }

  async getMissions(memberId: string) {
    const config = await this.configService.getConfig();
    this.assertEnabled(config.enabled && config.missions.enabled, 'Missions are disabled');
    const definitions = activeMissions(config.missions.definitions);
    const periodKeys = Array.from(new Set(definitions.map((mission) => periodKey(mission.period, config.timezone, new Date()))));
    const [progressRows, claims, balances] = await Promise.all([
      this.repository.listProgress(memberId, MISSION_ACTIVITY, periodKeys),
      this.repository.listClaims(memberId, MISSION_ACTIVITY, periodKeys),
      this.repository.getRewardBalances(memberId),
    ]);
    const progressMap = new Map(progressRows.map((row) => [`${row.rule_code}:${row.period_key}`, row]));
    const claimMap = new Map(claims.map((claim) => [`${claim.reward_code}:${claim.period_key}`, claim]));

    return {
      activityCode: MISSION_ACTIVITY,
      balances,
      items: definitions.map((mission) => {
        const key = periodKey(mission.period, config.timezone, new Date());
        const progress = Number(progressMap.get(`${mission.code}:${key}`)?.progress ?? 0);
        const claim = claimMap.get(`${mission.code}:${key}`);
        return {
          ...mission,
          periodKey: key,
          progress,
          progressPercent: percentage(progress, mission.target),
          completed: progress >= mission.target,
          claimed: Boolean(claim),
          claimable: progress >= mission.target && !claim,
        };
      }),
    };
  }

  async claimMission(memberId: string, missionCode: string) {
    const config = await this.configService.getConfig({ fresh: true });
    this.assertEnabled(config.enabled && config.missions.enabled, 'Missions are disabled');
    const mission = activeMissions(config.missions.definitions).find((item) => item.code === missionCode);
    if (!mission) throw new NotFoundException('Mission not found');
    const key = periodKey(mission.period, config.timezone, new Date());
    const progress = await this.repository.getProgress(memberId, MISSION_ACTIVITY, mission.code, key);
    if (Number(progress?.progress ?? 0) < mission.target) throw new BadRequestException('Mission conditions are not complete');

    const result = await this.repository.createRewardClaim({
      memberId,
      activityCode: MISSION_ACTIVITY,
      rewardCode: mission.code,
      periodKey: key,
      rewardType: mission.rewardType,
      amount: mission.rewardAmount,
      idempotencyKey: `activity:mission:${memberId}:${mission.code}:${key}`,
      metadata: { missionCode: mission.code, target: mission.target },
    });
    return { success: true, duplicate: !result.created, claim: serializeClaim(result.claim) };
  }

  async getTurnover(memberId: string, category: string) {
    const normalized = normalizeTurnoverCategory(category);
    const config = await this.configService.getConfig();
    this.assertEnabled(config.enabled && config.turnover.enabled, 'Turnover rewards are disabled');
    const key = `turnover:${periodKey('MONTHLY', config.timezone, new Date())}`;
    const progress = await this.repository.getProgress(memberId, TURNOVER_ACTIVITY, normalized, key);
    const current = Number(progress?.progress ?? 0);
    const claims = await this.repository.listClaims(memberId, TURNOVER_ACTIVITY, [key]);
    const claimed = new Set(claims.map((claim) => claim.reward_code));
    const tiers = config.turnover.tiers
      .filter((tier) => tier.enabled && tier.category === normalized)
      .sort((a, b) => a.order - b.order)
      .map((tier) => ({
        ...tier,
        reached: current >= tier.turnover,
        claimed: claimed.has(tier.code),
        claimable: current >= tier.turnover && !claimed.has(tier.code),
      }));
    const next = tiers.find((tier) => !tier.reached) ?? null;

    return {
      activityCode: TURNOVER_ACTIVITY,
      category: normalized,
      periodKey: key,
      currentTurnover: current,
      nextTarget: next?.turnover ?? tiers.at(-1)?.turnover ?? 0,
      progressPercent: percentage(current, next?.turnover ?? tiers.at(-1)?.turnover ?? 0),
      claimedReward: claims.reduce((sum, claim) => sum + Number(claim.amount ?? 0), 0),
      totalReward: tiers.reduce((sum, tier) => sum + tier.bonus, 0),
      tiers,
    };
  }

  async claimTurnover(memberId: string, category: string, tierCode: string) {
    const normalized = normalizeTurnoverCategory(category);
    const config = await this.configService.getConfig({ fresh: true });
    this.assertEnabled(config.enabled && config.turnover.enabled, 'Turnover rewards are disabled');
    const tier = config.turnover.tiers.find((item) => item.enabled && item.category === normalized && item.code === tierCode);
    if (!tier) throw new NotFoundException('Turnover reward tier not found');
    const key = `turnover:${periodKey('MONTHLY', config.timezone, new Date())}`;
    const progress = await this.repository.getProgress(memberId, TURNOVER_ACTIVITY, normalized, key);
    if (Number(progress?.progress ?? 0) < tier.turnover) throw new BadRequestException('Turnover target has not been reached');

    const result = await this.repository.createRewardClaim({
      memberId,
      activityCode: TURNOVER_ACTIVITY,
      rewardCode: tier.code,
      periodKey: key,
      rewardType: 'CREDIT',
      amount: tier.bonus,
      idempotencyKey: `activity:turnover:${memberId}:${key}:${tier.code}`,
      metadata: { category: normalized, turnover: tier.turnover },
    });
    return { success: true, duplicate: !result.created, claim: serializeClaim(result.claim) };
  }

  async getLotteryRound(memberId: string, roundCode?: string) {
    const config = await this.configService.getConfig();
    this.assertEnabled(config.enabled && config.lottery.enabled, 'Lottery prediction is disabled');
    const round = selectLotteryRound(config.lottery.rounds, roundCode);
    if (!round) throw new NotFoundException('Lottery round not found');
    const [entry, result] = await Promise.all([
      this.repository.getLotteryEntry(memberId, round.code),
      this.repository.getLotteryResult(round.code),
    ]);
    return {
      activityCode: LOTTERY_ACTIVITY,
      round,
      state: lotteryStatus(round, new Date()),
      entry,
      result,
      canSubmit: lotteryStatus(round, new Date()).code === 'OPEN' && !entry,
    };
  }

  async submitLotteryEntry(memberId: string, roundCode: string, input: { topNumber?: unknown; bottomNumber?: unknown }) {
    const config = await this.configService.getConfig({ fresh: true });
    this.assertEnabled(config.enabled && config.lottery.enabled, 'Lottery prediction is disabled');
    const round = selectLotteryRound(config.lottery.rounds, roundCode);
    if (!round) throw new NotFoundException('Lottery round not found');
    if (lotteryStatus(round, new Date()).code !== 'OPEN') throw new BadRequestException('Lottery prediction round is closed');
    const topNumber = digitValue(input.topNumber, round.topDigits, 'topNumber');
    const bottomNumber = digitValue(input.bottomNumber, round.bottomDigits, 'bottomNumber');
    const existing = await this.repository.getLotteryEntry(memberId, round.code);
    if (existing) throw new BadRequestException('Prediction was already submitted for this round');
    const entry = await this.repository.createLotteryEntry({ memberId, roundCode: round.code, topNumber, bottomNumber });
    return { success: true, entry };
  }

  async recordMetric(input: {
    memberId: string;
    metricCode: string;
    category?: string;
    value: number;
    sourceType: string;
    sourceId?: string;
    idempotencyKey: string;
    occurredAt?: string;
    metadata?: Record<string, unknown>;
  }) {
    const value = Number(input.value);
    if (!input.memberId || !input.metricCode || !input.idempotencyKey) throw new BadRequestException('memberId, metricCode and idempotencyKey are required');
    if (!Number.isFinite(value) || value <= 0 || value > 1_000_000_000_000) throw new BadRequestException('Metric value is invalid');
    const eventId = await this.repository.insertMetric({
      ...input,
      value,
      category: input.category?.trim().toLowerCase() || null,
      sourceId: input.sourceId ?? null,
      occurredAt: input.occurredAt ? validDate(input.occurredAt, 'occurredAt') : undefined,
    });
    if (!eventId) return { success: true, duplicate: true, updated: [] };

    const config = await this.configService.getConfig();
    const updated: Array<{ activityCode: string; ruleCode: string; periodKey: string }> = [];
    if (config.enabled && config.missions.enabled) {
      for (const mission of activeMissions(config.missions.definitions)) {
        if (mission.metricCode !== input.metricCode) continue;
        if (mission.category && mission.category.toLowerCase() !== input.category?.toLowerCase()) continue;
        const key = periodKey(mission.period, config.timezone, input.occurredAt ? new Date(input.occurredAt) : new Date());
        await this.repository.upsertProgress({
          memberId: input.memberId,
          activityCode: MISSION_ACTIVITY,
          ruleCode: mission.code,
          periodKey: key,
          delta: value,
          target: mission.target,
          metadata: { metricCode: input.metricCode, sourceEventId: eventId },
        });
        updated.push({ activityCode: MISSION_ACTIVITY, ruleCode: mission.code, periodKey: key });
      }
    }

    const category = input.category?.toLowerCase();
    if (config.enabled && config.turnover.enabled && input.metricCode === 'QUALIFIED_TURNOVER' && (category === 'slot' || category === 'casino')) {
      const tiers = config.turnover.tiers.filter((tier) => tier.enabled && tier.category === category);
      const target = Math.max(0, ...tiers.map((tier) => tier.turnover));
      const key = `turnover:${periodKey('MONTHLY', config.timezone, input.occurredAt ? new Date(input.occurredAt) : new Date())}`;
      await this.repository.upsertProgress({
        memberId: input.memberId,
        activityCode: TURNOVER_ACTIVITY,
        ruleCode: category,
        periodKey: key,
        delta: value,
        target,
        metadata: { metricCode: input.metricCode, sourceEventId: eventId },
      });
      updated.push({ activityCode: TURNOVER_ACTIVITY, ruleCode: category, periodKey: key });
    }

    return { success: true, duplicate: false, eventId, updated };
  }

  async publishLotteryResult(actor: AuthenticatedAdminActor, roundCode: string, input: { topNumber?: unknown; bottomNumber?: unknown }) {
    const config = await this.configService.getConfig({ fresh: true });
    const round = selectLotteryRound(config.lottery.rounds, roundCode);
    if (!round) throw new NotFoundException('Lottery round not found');
    const topNumber = digitValue(input.topNumber, round.topDigits, 'topNumber');
    const bottomNumber = digitValue(input.bottomNumber, round.bottomDigits, 'bottomNumber');
    const result = await this.repository.saveLotteryResult({ roundCode: round.code, topNumber, bottomNumber, actor });
    const entries = await this.repository.listMatchingLotteryEntries(round.code, topNumber, bottomNumber);
    let credited = 0;

    for (const entry of entries) {
      const topMatched = entry.top_number === topNumber;
      const bottomMatched = entry.bottom_number === bottomNumber;
      const amount = topMatched && bottomMatched ? round.bothReward : topMatched ? round.topReward : round.bottomReward;
      if (amount <= 0) continue;
      const claim = await this.repository.createRewardClaim({
        memberId: entry.member_id,
        activityCode: LOTTERY_ACTIVITY,
        rewardCode: `lottery-${round.code}`,
        periodKey: round.code,
        rewardType: 'CREDIT',
        amount,
        idempotencyKey: `activity:lottery:${round.code}:${entry.member_id}`,
        metadata: { roundCode: round.code, topMatched, bottomMatched, topNumber, bottomNumber },
      });
      if (claim.created) credited += 1;
      await this.repository.markLotteryEntryResult(entry.member_id, round.code, topMatched, bottomMatched, amount);
    }
    await this.repository.auditAdmin(actor, 'activities.lottery.publish_result', round.code, { topNumber, bottomNumber, matchedEntries: entries.length, credited });
    return { success: true, result, matchedEntries: entries.length, credited };
  }

  adminOverview() {
    return this.repository.adminOverview();
  }

  listAdminClaims(take?: number) {
    return this.repository.listAdminClaims(take);
  }

  listLotteryEntries(roundCode?: string, take?: number) {
    return this.repository.listLotteryEntries(roundCode, take);
  }

  private assertEnabled(enabled: boolean, message: string) {
    if (!enabled) throw new NotFoundException(message);
  }
}

function activeMissions(definitions: MissionDefinition[]) {
  const now = Date.now();
  return definitions.filter((mission) => mission.enabled && (!mission.expiresAt || Date.parse(mission.expiresAt) > now));
}

function normalizeTurnoverCategory(category: string): TurnoverCategory {
  const normalized = category.trim().toLowerCase();
  if (normalized !== 'slot' && normalized !== 'casino') throw new BadRequestException('category must be slot or casino');
  return normalized;
}

export function periodKey(period: ActivityPeriod, timezone: string, now: Date) {
  const parts = zonedParts(now, timezone);
  if (period === 'DAILY') return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
  if (period === 'MONTHLY') return `${parts.year}-${pad(parts.month)}`;
  if (period === 'WEEKLY') {
    const base = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
    const day = base.getUTCDay() || 7;
    base.setUTCDate(base.getUTCDate() - day + 1);
    return `week:${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-${pad(base.getUTCDate())}`;
  }
  return 'campaign';
}

export function dailyCycle(now: Date, timezone: string, resetHour: number, anchor: string, cycleDays: number) {
  const businessDate = businessDateParts(now, timezone, resetHour);
  const anchorDate = businessDateParts(validDate(anchor, 'cycleAnchor'), timezone, resetHour);
  const currentSerial = Date.UTC(businessDate.year, businessDate.month - 1, businessDate.day) / 86_400_000;
  const anchorSerial = Date.UTC(anchorDate.year, anchorDate.month - 1, anchorDate.day) / 86_400_000;
  const delta = Math.floor(currentSerial - anchorSerial);
  const cycleIndex = Math.floor(delta / cycleDays);
  const cycleStart = new Date((anchorSerial + cycleIndex * cycleDays) * 86_400_000);
  const day = ((delta % cycleDays) + cycleDays) % cycleDays + 1;
  return {
    day,
    periodKey: `cycle:${cycleStart.getUTCFullYear()}-${pad(cycleStart.getUTCMonth() + 1)}-${pad(cycleStart.getUTCDate())}`,
  };
}

function businessDateParts(now: Date, timezone: string, resetHour: number) {
  const parts = zonedParts(now, timezone);
  if (parts.hour >= resetHour) return parts;
  const prior = new Date(Date.UTC(parts.year, parts.month - 1, parts.day) - 86_400_000);
  return { year: prior.getUTCFullYear(), month: prior.getUTCMonth() + 1, day: prior.getUTCDate(), hour: parts.hour };
}

function zonedParts(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour) };
}

function selectLotteryRound(rounds: LotteryRoundConfig[], roundCode?: string) {
  const enabled = rounds.filter((round) => round.enabled);
  if (roundCode) return enabled.find((round) => round.code === roundCode) ?? null;
  return enabled.sort((a, b) => Date.parse(b.closesAt) - Date.parse(a.closesAt))[0] ?? null;
}

export function lotteryStatus(round: LotteryRoundConfig, now: Date) {
  const time = now.getTime();
  const opensAt = Date.parse(round.opensAt);
  const closesAt = Date.parse(round.closesAt);
  if (time < opensAt) return { code: 'UPCOMING', label: 'ยังไม่เปิดทายผล' } as const;
  if (time > closesAt) return { code: 'CLOSED', label: 'หมดเวลาทายผล' } as const;
  return { code: 'OPEN', label: 'เปิดรับคำทาย' } as const;
}

function digitValue(value: unknown, length: number, field: string) {
  const text = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
  if (!new RegExp(`^\\d{${length}}$`).test(text)) throw new BadRequestException(`${field} must contain exactly ${length} digits`);
  return text;
}

function validDate(value: string, field: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new BadRequestException(`${field} is invalid`);
  return date;
}

function percentage(value: number, target: number) {
  if (target <= 0) return value > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, Math.round((value / target) * 10000) / 100));
}

function serializeClaim(claim: Record<string, unknown> | null | undefined) {
  if (!claim) return null;
  return { ...claim, amount: Number(claim.amount ?? 0) };
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}
