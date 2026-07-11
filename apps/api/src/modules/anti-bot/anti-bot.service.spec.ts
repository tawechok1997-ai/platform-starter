import { BadRequestException } from '@nestjs/common';
import { AntiBotService } from './anti-bot.service';

function prismaWithSetting(valueJson: unknown = null) {
  return {
    siteSetting: { findUnique: jest.fn().mockResolvedValue(valueJson ? { valueJson } : null) },
    $transaction: jest.fn(),
    adminAuditLog: { create: jest.fn() },
  } as any;
}

describe('AntiBotService safety defaults', () => {
  const originalRuntimeFlag = process.env.ANTIBOT_RUNTIME_ENABLED;

  afterEach(() => {
    if (originalRuntimeFlag === undefined) delete process.env.ANTIBOT_RUNTIME_ENABLED;
    else process.env.ANTIBOT_RUNTIME_ENABLED = originalRuntimeFlag;
  });

  it('keeps protection disabled when no configuration exists', async () => {
    const service = new AntiBotService(prismaWithSetting());

    await expect(service.getPublicConfig('MEMBER_LOGIN')).resolves.toEqual({
      enabled: false,
      provider: null,
      siteKey: '',
      adaptiveMode: true,
      emergencyMode: false,
    });
    await expect(service.assertValid('MEMBER_LOGIN', undefined)).resolves.toEqual({ required: false, success: true });
  });

  it('keeps protection disabled until the runtime flag is explicitly enabled', async () => {
    delete process.env.ANTIBOT_RUNTIME_ENABLED;
    const service = new AntiBotService(prismaWithSetting({
      enabled: true,
      provider: 'TURNSTILE',
      siteKey: 'site-key',
      encryptedSecret: 'not-returned',
      routes: { ADMIN_LOGIN: true, MEMBER_LOGIN: true, MEMBER_REGISTER: true },
      adaptiveMode: true,
      emergencyMode: false,
    }));

    await expect(service.getPublicConfig('ADMIN_LOGIN')).resolves.toEqual(expect.objectContaining({ enabled: false, provider: null, siteKey: '' }));
    await expect(service.assertValid('ADMIN_LOGIN', undefined)).resolves.toEqual({ required: false, success: true });
  });

  it('requires a CAPTCHA token only for an enabled route when runtime protection is enabled', async () => {
    process.env.ANTIBOT_RUNTIME_ENABLED = 'true';
    const prisma = prismaWithSetting({
      enabled: true,
      provider: 'TURNSTILE',
      siteKey: 'site-key',
      encryptedSecret: 'not-returned',
      routes: { ADMIN_LOGIN: false, MEMBER_LOGIN: true, MEMBER_REGISTER: false },
      adaptiveMode: true,
      emergencyMode: false,
    });
    const service = new AntiBotService(prisma);

    await expect(service.assertValid('ADMIN_LOGIN', undefined)).resolves.toEqual({ required: false, success: true });
    await expect(service.assertValid('MEMBER_LOGIN', undefined)).rejects.toThrow(BadRequestException);
  });

  it('never exposes the encrypted provider secret in admin or public configuration', async () => {
    process.env.ANTIBOT_RUNTIME_ENABLED = 'true';
    const service = new AntiBotService(prismaWithSetting({
      enabled: true,
      provider: 'HCAPTCHA',
      siteKey: 'public-site-key',
      encryptedSecret: 'v1.private.secret.payload',
      routes: { ADMIN_LOGIN: true, MEMBER_LOGIN: false, MEMBER_REGISTER: false },
      adaptiveMode: false,
      emergencyMode: false,
    }));

    const adminConfig = await service.getAdminConfig();
    const publicConfig = await service.getPublicConfig('ADMIN_LOGIN');

    expect(adminConfig).toEqual(expect.objectContaining({ secretConfigured: true }));
    expect(adminConfig).not.toHaveProperty('encryptedSecret');
    expect(publicConfig).not.toHaveProperty('encryptedSecret');
    expect(publicConfig).not.toHaveProperty('secret');
  });

  it('rejects enabling protection without a site key and secret', async () => {
    const prisma = prismaWithSetting();
    const service = new AntiBotService(prisma);

    await expect(service.updateConfig('admin-id', {
      enabled: true,
      provider: 'TURNSTILE',
      routes: { ADMIN_LOGIN: true, MEMBER_LOGIN: false, MEMBER_REGISTER: false },
    }, {})).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('audits rejected provider responses without storing the CAPTCHA token', async () => {
    process.env.ANTIBOT_RUNTIME_ENABLED = 'true';
    process.env.ANTIBOT_ENCRYPTION_KEY = 'test-key';
    const prisma = prismaWithSetting({
      enabled: true,
      provider: 'TURNSTILE',
      siteKey: 'site-key',
      encryptedSecret: 'v1.invalid.invalid.invalid',
      routes: { ADMIN_LOGIN: true, MEMBER_LOGIN: false, MEMBER_REGISTER: false },
      adaptiveMode: true,
      emergencyMode: false,
    });
    const service = new AntiBotService(prisma);

    await expect(service.assertValid('ADMIN_LOGIN', 'captcha-token', '203.0.113.10')).rejects.toThrow();
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'ANTI_BOT_PROVIDER_UNAVAILABLE', module: 'anti-bot' }),
    }));
    expect(JSON.stringify(prisma.adminAuditLog.create.mock.calls)).not.toContain('captcha-token');
  });
});
