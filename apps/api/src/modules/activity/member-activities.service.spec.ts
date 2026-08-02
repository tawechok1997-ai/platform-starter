import { DEFAULT_ACTIVITY_CONFIG, parseActivityConfig } from './activity-config';
import { dailyCycle, lotteryStatus, periodKey } from './member-activities.service';

describe('member activity configuration and periods', () => {
  it('provides the source activity defaults without database settings', () => {
    const config = parseActivityConfig({});
    expect(config.enabled).toBe(true);
    expect(config.cards.map((item) => item.code)).toEqual([
      'daily-mission',
      'lottery-prediction',
      'turnover-reward',
    ]);
    expect(config.dailyLogin.cycleDays).toBe(28);
    expect(config.dailyLogin.rewards).toHaveLength(28);
    expect(config.turnover.tiers.filter((item) => item.category === 'slot')).toHaveLength(10);
    expect(config.turnover.tiers.filter((item) => item.category === 'slot').reduce((sum, item) => sum + item.bonus, 0)).toBe(39000);
  });

  it('parses admin JSON settings and preserves exact login route ownership', () => {
    const config = parseActivityConfig({
      activity_system_enabled: false,
      daily_login_cycle_days: 7,
      activity_cards_json: JSON.stringify([{ code: 'daily-mission', title: 'ภารกิจ', imageUrl: '/card.webp', href: '/mobile/member/activity/daily-mission', enabled: true, sortOrder: 1, requiresLogin: true }]),
    });
    expect(config.enabled).toBe(false);
    expect(config.dailyLogin.cycleDays).toBe(7);
    expect(config.cards[0].href).toBe('/mobile/member/activity/daily-mission');
  });

  it('computes business periods in Asia Bangkok', () => {
    const beforeReset = new Date('2026-08-02T03:30:00+07:00');
    const afterReset = new Date('2026-08-02T04:30:00+07:00');
    expect(periodKey('DAILY', 'Asia/Bangkok', afterReset)).toBe('2026-08-02');
    expect(periodKey('MONTHLY', 'Asia/Bangkok', afterReset)).toBe('2026-08');
    expect(dailyCycle(beforeReset, 'Asia/Bangkok', 4, DEFAULT_ACTIVITY_CONFIG.dailyLogin.cycleAnchor, 28).day).toBe(1);
    expect(dailyCycle(afterReset, 'Asia/Bangkok', 4, DEFAULT_ACTIVITY_CONFIG.dailyLogin.cycleAnchor, 28).day).toBe(2);
  });

  it('closes lottery prediction at the configured server deadline', () => {
    const round = DEFAULT_ACTIVITY_CONFIG.lottery.rounds[0];
    expect(lotteryStatus(round, new Date('2026-08-01T14:59:59+07:00')).code).toBe('OPEN');
    expect(lotteryStatus(round, new Date('2026-08-01T15:00:01+07:00')).code).toBe('CLOSED');
  });
});
