import { readFile, writeFile } from 'node:fs/promises';

async function patch(path, transforms) {
  let source = await readFile(path, 'utf8');
  for (const [from, to, label] of transforms) {
    if (!source.includes(from)) throw new Error(`${path}: missing patch marker ${label}`);
    source = source.replace(from, to);
  }
  await writeFile(path, source);
}

await patch('apps/api/src/modules/admin-access/admin-access.service.ts', [
  [
    "import { PrismaService } from '../../database/prisma.service';\n",
    "import { PrismaService } from '../../database/prisma.service';\nimport { DomainError } from '../../common/domain/domain-error';\nimport { AdminOwnershipPolicy } from './domain/admin-ownership.policy';\n",
    'admin policy imports',
  ],
  [
    "    if (actorAdminId === targetAdminId) throw new BadRequestException('Ownership cannot be transferred to the same account');\n    await this.adminAuth.assertStepUp(actorAdminId, twoFactorCode, meta);\n",
    "    await this.adminAuth.assertStepUp(actorAdminId, twoFactorCode, meta);\n",
    'remove duplicated self-transfer check',
  ],
  [
    "    if (!actor) throw new ForbiddenException('Acting admin account not found');\n    if (!target) throw new NotFoundException('Target admin account not found');\n    if (actor.roles.every((item) => !PROTECTED_ROLE_CODES.has(item.role.code) && !item.role.permissions.some((permission) => permission.permission.code === SUPER_PERMISSION))) {\n      throw new ForbiddenException('Only an owner-level admin can transfer ownership');\n    }\n    if (target.status !== 'ACTIVE') throw new BadRequestException('Target admin account must be active');\n",
    "    if (!actor) throw new ForbiddenException('Acting admin account not found');\n    if (!target) throw new NotFoundException('Target admin account not found');\n    const actorIsOwner = actor.roles.some((item) => PROTECTED_ROLE_CODES.has(item.role.code) || item.role.permissions.some((permission) => permission.permission.code === SUPER_PERMISSION));\n    try {\n      AdminOwnershipPolicy.assertCanTransfer({ actorIsOwner, actorId: actorAdminId, targetId: targetAdminId, targetActive: target.status === 'ACTIVE' });\n    } catch (error) {\n      if (error instanceof DomainError && error.message.includes('Only an owner')) throw new ForbiddenException(error.message);\n      if (error instanceof DomainError) throw new BadRequestException(error.message);\n      throw error;\n    }\n",
    'admin transfer policy call',
  ],
]);

await patch('apps/api/src/modules/withdrawals/withdrawals.service.ts', [
  [
    "import { PrismaService } from '../../database/prisma.service';\n",
    "import { PrismaService } from '../../database/prisma.service';\nimport { DomainError, InvalidStateTransitionError } from '../../common/domain/domain-error';\nimport { Money } from '../../common/domain/value-objects';\nimport { WithdrawalPolicy, type WithdrawalStatus } from './domain/withdrawal.policy';\nimport { WalletSettlementPolicy } from '../wallet/domain/wallet-settlement.policy';\n",
    'withdrawal policy imports',
  ],
  [
    "    const amount = new Decimal(dto.amount ?? 0);\n    if (amount.lte(0)) throw new BadRequestException('Amount must be greater than zero');\n",
    "    const amount = new Decimal(dto.amount ?? 0);\n    this.applyPolicy(() => WithdrawalPolicy.assertAmount(Money.fromMajor(amount.toString())));\n",
    'withdrawal amount policy',
  ],
  [
    "      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');\n      const available = wallet.balance.minus(wallet.locked_balance);\n      if (available.lt(amount)) throw new BadRequestException('Insufficient available balance');\n      const lockedAfter = wallet.locked_balance.plus(amount);\n",
    "      this.applyPolicy(() => WalletSettlementPolicy.assertActive(wallet.status));\n      const lockedAfter = new Decimal(this.applyPolicy(() => WalletSettlementPolicy.reserve(\n        Money.fromMajor(wallet.balance.toString(), wallet.currency),\n        Money.fromMajor(wallet.locked_balance.toString(), wallet.currency),\n        Money.fromMajor(amount.toString(), wallet.currency),\n      )).toMajorString());\n",
    'wallet reserve policy',
  ],
  [
    "      if (!['PENDING', 'PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED'].includes(request.status)) throw new ConflictException('Withdrawal request is not available for claim');\n",
    "      if (!WithdrawalPolicy.canBeClaimed(request.status as WithdrawalStatus)) throw new ConflictException('Withdrawal request is not available for claim');\n",
    'withdrawal claim policy',
  ],
  [
    "      if (!['PENDING', 'PENDING_REVIEW'].includes(request.status)) throw new ConflictException(`Withdrawal cannot be approved: ${request.status}`);\n",
    "      this.applyPolicy(() => WithdrawalPolicy.assertTransition(request.status as WithdrawalStatus, 'APPROVED_FOR_PAYMENT'));\n",
    'withdrawal approval transition',
  ],
  [
    "      if (!['APPROVED_FOR_PAYMENT', 'PAYMENT_VERIFIED'].includes(request.status)) throw new ConflictException(`Withdrawal cannot be completed: ${request.status}`);\n",
    "      this.applyPolicy(() => WithdrawalPolicy.assertTransition(request.status as WithdrawalStatus, 'COMPLETED'));\n",
    'withdrawal completion transition',
  ],
  [
    "      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');\n      if (wallet.locked_balance.lt(request.amount) || wallet.balance.lt(request.amount)) throw new BadRequestException('Wallet balance is not enough to complete withdrawal');\n      const balanceAfter = wallet.balance.minus(request.amount);\n      const lockedAfter = wallet.locked_balance.minus(request.amount);\n",
    "      this.applyPolicy(() => WalletSettlementPolicy.assertActive(wallet.status));\n      const settled = this.applyPolicy(() => WalletSettlementPolicy.completeDebit(\n        Money.fromMajor(wallet.balance.toString(), wallet.currency),\n        Money.fromMajor(wallet.locked_balance.toString(), wallet.currency),\n        Money.fromMajor(request.amount.toString(), wallet.currency),\n      ));\n      const balanceAfter = new Decimal(settled.balanceAfter.toMajorString());\n      const lockedAfter = new Decimal(settled.lockedAfter.toMajorString());\n",
    'wallet completion policy',
  ],
  [
    "      if (!['PENDING', 'PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED'].includes(request.status)) throw new ConflictException(`Withdrawal cannot be rejected: ${request.status}`);\n",
    "      this.applyPolicy(() => WithdrawalPolicy.assertTransition(request.status as WithdrawalStatus, 'REJECTED'));\n",
    'withdrawal rejection transition',
  ],
  [
    "      if (wallet.locked_balance.lt(request.amount)) throw new BadRequestException('Locked balance is not enough');\n      const lockedAfter = wallet.locked_balance.minus(request.amount);\n",
    "      const lockedAfter = new Decimal(this.applyPolicy(() => WalletSettlementPolicy.releaseReservation(\n        Money.fromMajor(wallet.locked_balance.toString(), wallet.currency),\n        Money.fromMajor(request.amount.toString(), wallet.currency),\n      )).toMajorString());\n",
    'wallet release policy',
  ],
  [
    "  private normalizeIdempotencyKey(userId: string, value?: string | null) { const key = value?.trim();",
    "  private applyPolicy<T>(operation: () => T): T { try { return operation(); } catch (error) { if (error instanceof InvalidStateTransitionError) throw new ConflictException(error.message); if (error instanceof DomainError) throw new BadRequestException(error.message); throw error; } }\n  private normalizeIdempotencyKey(userId: string, value?: string | null) { const key = value?.trim();",
    'domain error mapping helper',
  ],
]);

console.log('Applied R-008 Admin ownership and Withdrawal/Wallet policy integrations.');
