import { BadRequestException } from '@nestjs/common';
import { AdminUiPreferenceService } from './admin-ui-preference.service';

describe('AdminUiPreferenceService', () => {
  test('returns an empty self preference when none exists', async () => {
    const service = new AdminUiPreferenceService({
      $queryRaw: jest.fn().mockResolvedValue([]),
    } as never);

    await expect(service.get('00000000-0000-0000-0000-000000000001', 'dashboard-widget-layout-v1'))
      .resolves.toEqual({
        key: 'dashboard-widget-layout-v1',
        value: null,
        version: 0,
        updatedAt: null,
      });
  });

  test('normalizes the stored response', async () => {
    const updatedAt = new Date('2026-08-05T00:00:00.000Z');
    const service = new AdminUiPreferenceService({
      $queryRaw: jest.fn().mockResolvedValue([{
        key: 'dashboard-widget-layout-v1',
        value: { version: 1, items: [] },
        version: 2,
        updatedAt,
      }]),
    } as never);

    await expect(service.upsert(
      '00000000-0000-0000-0000-000000000001',
      'dashboard-widget-layout-v1',
      { version: 1, items: [] },
    )).resolves.toEqual({
      key: 'dashboard-widget-layout-v1',
      value: { version: 1, items: [] },
      version: 2,
      updatedAt: updatedAt.toISOString(),
    });
  });

  test('rejects unsupported keys and oversized values', async () => {
    const service = new AdminUiPreferenceService({ $queryRaw: jest.fn() } as never);

    await expect(service.get('admin-id', 'another-key')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.upsert(
      'admin-id',
      'dashboard-widget-layout-v1',
      { content: 'x'.repeat(60_000) },
    )).rejects.toBeInstanceOf(BadRequestException);
  });
});
