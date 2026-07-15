import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

jest.mock('argon2', () => ({
  hash: jest.fn(async () => 'hashed-secret'),
  verify: jest.fn(async () => true),
}));

type PrismaMock = ReturnType<typeof createPrismaMock>;

function createPrismaMock() {
  const tx = {
    user: {
      create: jest.fn(async ({ data }: any) => ({ id: 'user-1', ...data })),
      update: jest.fn(async ({ data }: any) => ({ id: 'user-1', ...data })),
    },
    userProfile: { upsert: jest.fn(async ({ create, update }: any) => ({ ...(create ?? {}), ...(update ?? {}) })) },
    wallet: { create: jest.fn(async ({ data }: any) => ({ id: 'wallet-1', ...data })) },
    memberBankAccount: {
      findFirst: jest.fn(async () => null),
      create: jest.fn(async ({ data }: any) => ({ id: 'bank-1', ...data })),
    },
    verificationToken: {
      updateMany: jest.fn(async () => ({ count: 1 })),
      create: jest.fn(async ({ data }: any) => ({ id: 'reset-token-1', ...data })),
    },
    authSession: { updateMany: jest.fn(async () => ({ count: 1 })) },
  };

  const prisma = {
    user: { findFirst: jest.fn(async () => null), updateMany: jest.fn(async () => ({ count: 1 })) },
    memberBankAccount: { findFirst: jest.fn(async () => null) },
    loginHistory: { create: jest.fn(async () => ({})), findMany: jest.fn(async () => []) },
    authSession: {
      create: jest.fn(async ({ data }: any) => ({ id: 'session-1', ...data })),
    },
    verificationToken: { findFirst: jest.fn(async () => null) },
    $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    __tx: tx,
  };

  return prisma;
}

function createService(prisma: PrismaMock, config: Record<string, string> = {}) {
  const jwtService = { signAsync: jest.fn(async () => 'access-token') };
  const configService = { get: jest.fn((key: string) => config[key]) };
  return new AuthService(prisma as any, jwtService as any, configService as any);
}

const validDto = {
  username: 'member01',
  phone: '0812345678',
  email: 'member@example.com',
  secret: 'secret123',
  fullName: 'สมชาย ใจดี',
  bankName: 'ธนาคารทดสอบ',
  bankAccountNumber: '1234567890',
  bankAccountName: 'สมชาย ใจดี',
  deviceId: 'web-member',
};

describe('AuthService member registration', () => {
  it('rejects registration when bank account name does not match the legal name', async () => {
    const prisma = createPrismaMock();
    const service = createService(prisma);

    await expect(service.register({ ...validDto, bankAccountName: 'บุคคล อื่น' }, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.authSession.create).not.toHaveBeenCalled();
  });

  it('rejects registration when the bank account number is already in use', async () => {
    const prisma = createPrismaMock();
    prisma.memberBankAccount.findFirst.mockResolvedValueOnce({ id: 'existing-bank' } as any);
    const service = createService(prisma);

    await expect(service.register(validDto, {})).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.authSession.create).not.toHaveBeenCalled();
  });

  it('creates the user, profile, wallet, and primary bank account in one transaction', async () => {
    const prisma = createPrismaMock();
    const service = createService(prisma);

    const result = await service.register(validDto, { deviceId: 'web-member' });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.__tx.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        username: validDto.username,
        phone: validDto.phone,
        email: validDto.email,
        profile: { create: { displayName: validDto.fullName } },
      }),
    });
    expect(prisma.__tx.wallet.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', currency: 'THB' },
    });
    expect(prisma.__tx.memberBankAccount.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        bankName: validDto.bankName,
        accountName: validDto.bankAccountName,
        accountNumber: validDto.bankAccountNumber,
        isPrimary: true,
        status: 'PENDING_REVIEW',
      }),
    });
    expect(result).toEqual(expect.objectContaining({ accessToken: 'access-token' }));
  });

  it('does not create a session when bank creation fails inside the transaction', async () => {
    const prisma = createPrismaMock();
    prisma.__tx.memberBankAccount.create.mockRejectedValueOnce(new Error('bank write failed'));
    const service = createService(prisma);

    await expect(service.register(validDto, {})).rejects.toThrow('bank write failed');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.authSession.create).not.toHaveBeenCalled();
    expect(prisma.loginHistory.create).not.toHaveBeenCalled();
  });
});

describe('AuthService member profile update', () => {
  it('returns a specific duplicate phone error before updating profile', async () => {
    const prisma = createPrismaMock();
    prisma.user.findFirst.mockResolvedValueOnce({
      id: 'other-user',
      phone: '0812345678',
      email: 'other@example.com',
    } as any);
    const service = createService(prisma);

    await expect(
      service.updateMemberProfile('user-1', { phone: '0812345678', email: 'new@example.com' } as any),
    ).rejects.toThrow('เบอร์โทรนี้ถูกใช้กับสมาชิกอื่นแล้ว');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns a specific duplicate email error before updating profile', async () => {
    const prisma = createPrismaMock();
    prisma.user.findFirst.mockResolvedValueOnce({
      id: 'other-user',
      phone: '0899999999',
      email: 'used@example.com',
    } as any);
    const service = createService(prisma);

    await expect(
      service.updateMemberProfile('user-1', { phone: '0812345678', email: 'USED@example.com' } as any),
    ).rejects.toThrow('อีเมลนี้ถูกใช้กับสมาชิกอื่นแล้ว');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('AuthService progressive lockout', () => {
  it('locks a member after consecutive failed sign-ins', async () => {
    const prisma = createPrismaMock();
    prisma.user.findFirst.mockResolvedValueOnce({
      id: 'member-1',
      status: 'ACTIVE',
      passwordHash: 'stored-hash',
    } as any);
    prisma.loginHistory.findMany.mockResolvedValueOnce(Array.from({ length: 8 }, () => ({ success: false })) as any);
    const argon2 = await import('argon2');
    (argon2.verify as jest.Mock).mockResolvedValueOnce(false);
    const service = createService(prisma);

    await expect(
      service.signIn({ identifier: 'member01', secret: 'wrong' } as any, { ipAddress: '127.0.0.1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'member-1', status: 'ACTIVE' },
      data: { status: 'LOCKED' },
    });
  });
});

describe('AuthService password reset', () => {
  it('uses a database selector and only exposes the composite token in development', async () => {
    const prisma = createPrismaMock();
    prisma.user.findFirst.mockResolvedValueOnce({ id: 'member-1' } as any);
    const service = createService(prisma, { PASSWORD_RESET_EXPOSE_TOKEN: 'true' });

    const result = await service.requestPasswordReset('member01');

    expect(result).toEqual({
      success: true,
      deliveryQueued: false,
      resetToken: expect.stringMatching(/^reset-token-1\./),
    });
    expect(prisma.__tx.verificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'PASSWORD_RESET', target: 'member-1' }),
      select: { id: true },
    });
  });

  it('looks up one reset-token row by selector before verifying the secret', async () => {
    const prisma = createPrismaMock();
    prisma.verificationToken.findFirst.mockResolvedValueOnce({
      id: 'reset-token-1',
      target: 'member-1',
      tokenHash: 'hashed-secret',
    } as any);
    const service = createService(prisma);

    await expect(
      service.confirmPasswordReset({ token: 'reset-token-1.raw-secret', newPassword: 'new-secret-123' }),
    ).resolves.toEqual({ success: true, revokedSessions: true });

    expect(prisma.verificationToken.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'reset-token-1',
        type: 'PASSWORD_RESET',
        usedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
    });
    expect(prisma.__tx.verificationToken.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: 'reset-token-1', usedAt: null }),
      data: { usedAt: expect.any(Date) },
    });
    expect(prisma.__tx.authSession.updateMany).toHaveBeenCalledWith({
      where: { userId: 'member-1', type: 'MEMBER', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('rejects malformed reset tokens without scanning token rows', async () => {
    const prisma = createPrismaMock();
    const service = createService(prisma);

    await expect(
      service.confirmPasswordReset({ token: 'malformed', newPassword: 'new-secret-123' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.verificationToken.findFirst).not.toHaveBeenCalled();
  });
});
