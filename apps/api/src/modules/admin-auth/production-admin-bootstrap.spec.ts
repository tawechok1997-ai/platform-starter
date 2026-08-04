import {
  ensureProductionAdmin,
  resolveProductionAdminBootstrapConfig,
} from './production-admin-bootstrap';

describe('production Admin bootstrap', () => {
  test('uses an explicit bootstrap account when configured', () => {
    expect(resolveProductionAdminBootstrapConfig({
      BOOTSTRAP_ADMIN_USERNAME: 'platform-owner',
      BOOTSTRAP_ADMIN_EMAIL: 'owner@example.com',
      BOOTSTRAP_ADMIN_PASSWORD: 'a-secure-password-2026',
    })).toEqual({
      username: 'platform-owner',
      email: 'owner@example.com',
      password: 'a-secure-password-2026',
      passwordSource: 'BOOTSTRAP_ADMIN_PASSWORD',
    });
  });

  test('supports the maintained DEFAULT_ADMIN_SECRET fallback without logging its value', () => {
    expect(resolveProductionAdminBootstrapConfig({
      DEFAULT_ADMIN_SECRET: 'another-secure-secret-2026',
    })).toEqual({
      username: 'admin',
      email: 'admin@platform.local',
      password: 'another-secure-secret-2026',
      passwordSource: 'DEFAULT_ADMIN_SECRET',
    });
  });

  test.each([
    [{ BOOTSTRAP_ADMIN_PASSWORD: 'too-short' }, 'at least 12 characters'],
    [{ BOOTSTRAP_ADMIN_PASSWORD: 'set_in_local_env' }, 'placeholder value'],
    [{ BOOTSTRAP_ADMIN_PASSWORD: 'valid-password-2026', BOOTSTRAP_ADMIN_USERNAME: 'x' }, '3-50 characters'],
    [{ BOOTSTRAP_ADMIN_PASSWORD: 'valid-password-2026', BOOTSTRAP_ADMIN_EMAIL: 'invalid' }, 'valid email'],
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
    } as never;
    const hashPassword = jest.fn();

    await expect(ensureProductionAdmin(prisma, {}, hashPassword)).resolves.toEqual({
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
    } as never;
    const hashPassword = jest.fn().mockResolvedValue('argon2-hash');

    await expect(ensureProductionAdmin(prisma, {
      DEFAULT_ADMIN_SECRET: 'secure-default-admin-2026',
    }, hashPassword)).resolves.toEqual({
      status: 'created',
      id: 'admin-id',
      username: 'admin',
      email: 'admin@platform.local',
      passwordSource: 'DEFAULT_ADMIN_SECRET',
    });
    expect(hashPassword).toHaveBeenCalledWith('secure-default-admin-2026');
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
    } as never;

    await expect(ensureProductionAdmin(prisma, {})).resolves.toEqual({
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
