import { BadRequestException } from '@nestjs/common';
import { ICON_SETTING_KEYS, validateIconSettingsUpdate } from './icon-settings.validation';
import { GROUP_TO_PRISMA, PUBLIC_GROUPS, isSettingGroup } from './settings.constants';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

describe('icon settings endpoint contract', () => {
  it('registers icons as a public logical group stored in BRANDING', () => {
    expect(isSettingGroup('icons')).toBe(true);
    expect(GROUP_TO_PRISMA.icons).toBe('BRANDING');
    expect(PUBLIC_GROUPS).toContain('icons');
    expect(ICON_SETTING_KEYS).toHaveLength(26);
  });

  it('loads only icons.* rows even though icons share the BRANDING enum', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = { siteSetting: { findMany } } as any;
    const service = new SettingsService(prisma);

    await service.getAdminGroup('icons');

    expect(findMany).toHaveBeenCalledWith({
      where: { group: 'BRANDING', key: { startsWith: 'icons.' } },
      orderBy: { key: 'asc' },
    });
  });

  it('keeps branding queries isolated from icon rows', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = { siteSetting: { findMany } } as any;
    const service = new SettingsService(prisma);

    await service.getAdminGroup('branding');

    expect(findMany).toHaveBeenCalledWith({
      where: { group: 'BRANDING', key: { startsWith: 'branding.' } },
      orderBy: { key: 'asc' },
    });
  });

  it('accepts canonical icon keys with string values', () => {
    expect(validateIconSettingsUpdate({
      home: '/assets/reference-brand/menu/home.png',
      wallet: '฿',
      game_category_slot_icon: '/assets/reference-brand/menu/slot.png',
    })).toEqual({
      home: '/assets/reference-brand/menu/home.png',
      wallet: '฿',
      game_category_slot_icon: '/assets/reference-brand/menu/slot.png',
    });
  });

  it('rejects unknown keys and non-string values before persistence', () => {
    expect(() => validateIconSettingsUpdate({ unknown_icon: '/icons/unknown.png' })).toThrow(BadRequestException);
    expect(() => validateIconSettingsUpdate({ affiliate: {} })).toThrow(BadRequestException);
    expect(() => validateIconSettingsUpdate({ home: 'x'.repeat(2_049) })).toThrow(BadRequestException);
    expect(() => validateIconSettingsUpdate({ home: '/icons/home.png\u0000' })).toThrow(BadRequestException);
  });

  it('routes validated icon reads and writes through the icons logical group', async () => {
    const settingsService = {
      getAdminGroup: jest.fn().mockResolvedValue({ group: 'icons', settings: {} }),
      updateAdminGroup: jest.fn().mockResolvedValue({ success: true, group: 'icons' }),
    } as any;
    const controller = new SettingsController(settingsService);
    const actor = { id: 'admin-1', permissions: ['settings.branding.update'] } as any;
    const request = { ip: '127.0.0.1', headers: { 'user-agent': 'jest' } } as any;

    await controller.getIcons();
    await controller.updateIcons({ home: '/icons/home.png' }, actor, request);

    expect(settingsService.getAdminGroup).toHaveBeenCalledWith('icons');
    expect(settingsService.updateAdminGroup).toHaveBeenCalledWith(
      'icons',
      { home: '/icons/home.png' },
      actor,
      { ipAddress: '127.0.0.1', userAgent: 'jest' },
    );
  });

  it('does not call the service for an invalid icon payload', async () => {
    const settingsService = {
      getAdminGroup: jest.fn(),
      updateAdminGroup: jest.fn(),
    } as any;
    const controller = new SettingsController(settingsService);
    const actor = { id: 'admin-1', permissions: ['settings.branding.update'] } as any;
    const request = { ip: '127.0.0.1', headers: { 'user-agent': 'jest' } } as any;

    expect(() => controller.updateIcons({ affiliate: {} }, actor, request)).toThrow(BadRequestException);
    expect(settingsService.updateAdminGroup).not.toHaveBeenCalled();
  });
});
