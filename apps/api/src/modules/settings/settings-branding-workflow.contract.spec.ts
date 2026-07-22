import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('branding settings workflow contract', () => {
  const controllerSource = readFileSync(join(__dirname, 'settings.controller.ts'), 'utf8');
  const serviceSource = readFileSync(join(__dirname, 'settings.service.ts'), 'utf8');
  const seedSource = readFileSync(join(__dirname, '../../../../prisma/seed.ts'), 'utf8');

  it('keeps separate edit and publish permissions', () => {
    expect(controllerSource).toContain("@RequirePermission('settings.branding.update')");
    expect(controllerSource).toContain("@RequirePermission('settings.branding.publish')");
    expect(seedSource).toContain("['settings.branding.publish', 'Branding Settings Publish/Rollback', 'settings']");
  });

  it('exposes draft publish history and rollback routes', () => {
    expect(controllerSource).toContain("@Put('admin/settings/branding/draft')");
    expect(controllerSource).toContain("@Post('admin/settings/branding/publish')");
    expect(controllerSource).toContain("@Get('admin/settings/branding/history')");
    expect(controllerSource).toContain("@Post('admin/settings/branding/history/:historyId/rollback')");
  });

  it('keeps draft settings private and records explicit audit actions', () => {
    expect(serviceSource).toContain('isPublic: false');
    expect(serviceSource).toContain("action: 'settings.draft.save'");
    expect(serviceSource).toContain("action: 'settings.publish'");
    expect(serviceSource).toContain("action: 'settings.rollback'");
    expect(serviceSource).toContain("if (normalizedKey.startsWith('__draft_')) return false");
  });

  it('uses existing history storage without adding a new workflow table', () => {
    expect(serviceSource).toContain('siteSettingHistory.findMany');
    expect(serviceSource).toContain('siteSettingHistory.create');
    expect(serviceSource).toContain('rollbackAdminSetting');
  });
});
