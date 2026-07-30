import { isTournamentRadarDue, normalizeTournamentWrite, publicLeaderboardAlias } from './game-tournament.types';

const now = new Date('2026-07-30T12:00:00.000Z');

function tournament(overrides: Record<string, unknown> = {}) {
  return normalizeTournamentWrite({
    name: 'Weekend Sprint',
    slug: 'weekend-sprint',
    status: 'ACTIVE',
    startsAt: '2026-07-30T10:00:00.000Z',
    endsAt: '2026-07-31T10:00:00.000Z',
    gameIds: ['11111111-1111-4111-8111-111111111111'],
    leaderboardSize: 50,
    radarEnabled: true,
    radarIntervalMinutes: 15,
    ...overrides,
  }, null, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', now);
}

describe('game tournament rules', () => {
  it('normalizes valid tournament configuration', () => {
    const item = tournament();
    expect(item.status).toBe('ACTIVE');
    expect(item.gameIds).toEqual(['11111111-1111-4111-8111-111111111111']);
    expect(item.radarIntervalMinutes).toBe(15);
  });

  it('rejects an end time before the start time', () => {
    expect(() => tournament({ endsAt: '2026-07-30T09:00:00.000Z' })).toThrow('Tournament end time must be after start time');
  });

  it('marks an active tournament without cache as due', () => {
    expect(isTournamentRadarDue(tournament(), null, now)).toBe(true);
  });

  it('does not run radar before the configured interval', () => {
    const item = tournament();
    const cache = {
      tournamentId: item.id,
      metric: 'GAME_LAUNCHES' as const,
      calculatedAt: '2026-07-30T11:50:00.000Z',
      windowStart: item.startsAt,
      windowEnd: '2026-07-30T11:50:00.000Z',
      entries: [],
    };
    expect(isTournamentRadarDue(item, cache, now)).toBe(false);
  });

  it('masks usernames when no display name exists', () => {
    expect(publicLeaderboardAlias({ displayName: null, username: 'player123' })).toBe('pl******');
    expect(publicLeaderboardAlias({ displayName: 'Coke', username: 'hidden' })).toBe('Coke');
  });
});
