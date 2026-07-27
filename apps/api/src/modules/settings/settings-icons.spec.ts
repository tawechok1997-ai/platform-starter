import { GROUP_TO_PRISMA, PUBLIC_GROUPS, isSettingGroup } from './settings.constants';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

describe('icon settings endpoint contract', () => {
  it('registers icons as a public logical group stored in BRANDING', () => {
    expect(isSettingGroup('icons')).toBe(true);
    expect(GROUP_TO_PRISMA.icons).toBe('BRANDING');
    expect(PUBLIC_GROUPS).toContain('icons');
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

  it('keeps branding queries isolated from icons rows', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = { siteSetting: { findMany } } as any;
    const service = new SettingsService(prisma);

    await service.getAdminGroup('branding');

    expect(findMany).toHaveBeenCalledWith({
      where: { group: 'BRANDING', key: { startsWith: 'branding.' } },
      orderBy: { key: 'asc' },
    });
  });

  it('routes icon reads and writes through the icons logical group', async () => {
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
});
