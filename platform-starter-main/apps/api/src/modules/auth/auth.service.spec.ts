import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';

jest.mock('argon2', () => ({
  hash: jest.fn(async () => 'hashed-secret'),
  verify: jest.fn(async () => true),
}));

type PrismaMock = ReturnType<typeof createPrismaMock>;

function createPrismaMock() {
  const tx = {
    user: { create: jest.fn(async ({ data }: any) => ({ id: 'user-1', ...data })) },
    wallet: { create: jest.fn(async ({ data }: any) => ({ id: 'wallet-1', ...data })) },
    memberBankAccount: {
      findFirst: jest.fn(async () => null),
      create: jest.fn(async ({ data }: any) => ({ id: 'bank-1', ...data })),
    },
  };

  const prisma = {
    user: { findFirst: jest.fn(async () => null) },
    memberBankAccount: { findFirst: jest.fn(async () => null) },
    loginHistory: { create: jest.fn(async () => ({})) },
    authSession: {
      create: jest.fn(async ({ data }: any) => ({ id: 'session-1', ...data })),
    },
    $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    __tx: tx,
  };

  return prisma;
}

function createService(prisma: PrismaMock) {
  const jwtService = { signAsync: jest.fn(async () => 'access-token') };
  const configService = { get: jest.fn(() => undefined) };
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

    await expect(
      service.register({ ...validDto, bankAccountName: 'บุคคล อื่น' }, {}),
    ).rejects.toBeInstanceOf(BadRequestException);

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
