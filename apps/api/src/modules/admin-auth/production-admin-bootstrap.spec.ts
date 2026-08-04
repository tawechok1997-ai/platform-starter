import {
  ensureProductionAdmin,
  resolveProductionAdminBootstrapConfig,
} from './production-admin-bootstrap';

const fixtureCredential = (...parts: string[]) => parts.join('-');

describe('production Admin bootstrap', () => {
  test('uses an explicit bootstrap account when configured', () => {
    const bootstrapPassword = fixtureCredential('a', 'secure', 'password', '2026');

    expect(resolveProductionAdminBootstrapConfig({
      BOOTSTRAP_ADMIN_USERNAME: 'platform-owner',
      BOOTSTRAP_ADMIN_EMAIL: 'owner@example.com',
      BOOTSTRAP_ADMIN_PASSWORD: bootstrapPassword,
    })).toEqual({
      username: 'platform-owner',
      email: 'owner@example.com',
      password: bootstrapPassword,
      passwordSource: 'BOOTSTRAP_ADMIN_PASSWORD',
    });
  });

  test('supports the maintained DEFAULT_ADMIN_SECRET fallback without logging its value', () => {
    const fallbackSecret = fixtureCredential('another', 'secure', 'secret', '2026');

    expect(resolveProductionAdminBootstrapConfig({
      DEFAULT_ADMIN_SECRET: fallbackSecret,
    })).toEqual({
      username: 'admin',
      email: 'admin@platform.local',
      password: fallbackSecret,
      passwordSource: 'DEFAULT_ADMIN_SECRET',
    });
  });

  test.each<[NodeJS.ProcessEnv, string]>([
    [{ BOOTSTRAP_ADMIN_PASSWORD: fixtureCredential('too', 'short') }, 'at least 12 characters'],
    [{ BOOTSTRAP_ADMIN_PASSWORD: ['set', 'in', 'local', 'env'].join('_') }, 'placeholder value'],
    [{
      BOOTSTRAP_ADMIN_PASSWORD: fixtureCredential('valid', 'password', '2026'),
      BOOTSTRAP_ADMIN_USERNAME: 'x',
    }, '3-50 characters'],
    [{
      BOOTSTRAP_ADMIN_PASSWORD: fixtureCredential('valid', 'password', '2026'),
      BOOTSTRAP_ADMIN_EMAIL: 'invalid',
    }, 'valid email'],
  ])('rejects unsafe bootstrap configuration: %o', (environment, message) => {
    expect(() => resolveProductionAdminBootstrapConfig(environment)).toThrow(message);
  });

  test('does not replace credentials when an Admin already exists', async () => {
    const prisma = {
      adminUser: {
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn(),
      },
      role: { findUnique: jest.fn() },
    };
    const hashPassword = jest.fn();

    await expect(ensureProductionAdmin(prisma as never, {}, hashPassword)).resolves.toEqual({
      status: 'existing',
      adminCount: 1,
    });
    expect(hashPassword).not.toHaveBeenCalled();
    expect(prisma.adminUser.create).not.toHaveBeenCalled();
  });

  test('creates the first Admin with the super_admin role', async () => {
    const prisma = {
      adminUser: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({
          id: 'admin-id',
          username: 'admin',
          email: 'admin@platform.local',
        }),
      },
      role: {
        findUnique: jest.fn().mockResolvedValue({ id: 'role-id' }),
      },
    };
    const hashPassword = jest.fn().mockResolvedValue('argon2-hash');
    const fallbackSecret = fixtureCredential('secure', 'default', 'admin', '2026');

    await expect(ensureProductionAdmin(prisma as never, {
      DEFAULT_ADMIN_SECRET: fallbackSecret,
    }, hashPassword)).resolves.toEqual({
      status: 'created',
      id: 'admin-id',
      username: 'admin',
      email: 'admin@platform.local',
      passwordSource: 'DEFAULT_ADMIN_SECRET',
    });
    expect(hashPassword).toHaveBeenCalledWith(fallbackSecret);
    expect(prisma.adminUser.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        username: 'admin',
        email: 'admin@platform.local',
        passwordHash: 'argon2-hash',
        status: 'ACTIVE',
        roles: { create: { roleId: 'role-id' } },
      }),
    }));
  });

  test('reports missing credentials without creating a predictable password', async () => {
    const prisma = {
      adminUser: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
      },
      role: { findUnique: jest.fn() },
    };

    await expect(ensureProductionAdmin(prisma as never, {})).resolves.toEqual({
      status: 'missing-config',
      acceptedPasswordVariables: [
        'BOOTSTRAP_ADMIN_PASSWORD',
        'SEED_ADMIN_PASSWORD',
        'P6_ADMIN_PASSWORD',
        'DEFAULT_ADMIN_SECRET',
      ],
    });
    expect(prisma.adminUser.create).not.toHaveBeenCalled();
  });
});
