import { mapRiskWatchlistItem, mapRiskWatchlistMatch } from './risk-watchlist.mapper';

describe('risk watchlist mapper', () => {
  it('maps database columns and normalizes version', () => {
    expect(
      mapRiskWatchlistItem({
        id: 'entry-1',
        subject_type: 'EMAIL',
        display_masked: 'ta***@example.com',
        list_type: 'BLACKLIST',
        reason_code: 'FRAUD',
        severity: 'HIGH',
        status: 'ACTIVE',
        version: '2',
      }),
    ).toMatchObject({
      id: 'entry-1',
      subjectType: 'EMAIL',
      displayMasked: 'ta***@example.com',
      listType: 'BLACKLIST',
      version: 2,
    });
  });

  it('marks blacklist matches as blocked', () => {
    const result = mapRiskWatchlistMatch([
      { id: 'entry-1', list_type: 'WATCHLIST', version: 1 },
      { id: 'entry-2', list_type: 'BLACKLIST', version: 1 },
    ]);

    expect(result.matched).toBe(true);
    expect(result.blocked).toBe(true);
    expect(result.items).toHaveLength(2);
  });

  it('returns a safe empty match result', () => {
    expect(mapRiskWatchlistMatch([])).toEqual({ matched: false, blocked: false, items: [] });
  });
});
