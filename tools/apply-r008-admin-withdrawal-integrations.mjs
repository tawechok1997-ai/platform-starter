import { readFile, writeFile } from 'node:fs/promises';

async function patch(path, transforms) {
  let source = await readFile(path, 'utf8');
  for (const { from, to, label } of transforms) {
    if (source.includes(to)) continue;
    if (!source.includes(from)) throw new Error(`${path}: missing patch marker: ${label}`);
    source = source.replace(from, to);
  }
  await writeFile(path, source);
}

await patch('apps/api/src/modules/admin-access/admin-access.service.ts', [
  {
    label: 'admin policy imports',
    from: "import { PrismaService } from '../../database/prisma.service';\n",
    to: "import { PrismaService } from '../../database/prisma.service';\nimport { DomainError } from '../../common/domain/domain-error';\nimport { AdminOwnershipPolicy } from './domain/admin-ownership.policy';\n",
  },
  {
    label: 'remove inline self-transfer check',
    from: "    if (actorAdminId === targetAdminId) throw new BadRequestException('Ownership cannot be transferred to the same account');\n    await this.adminAuth.assertStepUp(actorAdminId, twoFactorCode, meta);\n",
    to: "    await this.adminAuth.assertStepUp(actorAdminId, twoFactorCode, meta);\n",
  },
  {
    label: 'ownership policy enforcement',
    from: "    if (actor.roles.every((item) => !PROTECTED_ROLE_CODES.has(item.role.code) && !item.role.permissions.some((permission) => permission.permission.code === SUPER_PERMISSION))) {\n      throw new ForbiddenException('Only an owner-level admin can transfer ownership');\n    }\n    if (target.status !== 'ACTIVE') throw new BadRequestException('Target admin account must be active');\n",
    to: "    const actorIsOwner = actor.roles.some((item) => PROTECTED_ROLE_CODES.has(item.role.code) || item.role.permissions.some((permission) => permission.permission.code === SUPER_PERMISSION));\n    try {\n      AdminOwnershipPolicy.assertCanTransfer({\n        actorIsOwner,\n        actorId: actorAdminId,\n        targetId: targetAdminId,\n        targetActive: target.status === 'ACTIVE',\n      });\n    } catch (error) {\n      if (error instanceof DomainError && error.message.includes('Only an owner')) throw new ForbiddenException(error.message);\n      if (error instanceof DomainError) throw new BadRequestException(error.message);\n      throw error;\n    }\n",
  },
]);

await patch('apps/api/src/modules/withdrawals/withdrawals.service.ts', [
  {
    label: 'withdrawal policy imports',
    from: "import { PrismaService } from '../../database/prisma.service';\n",
    to: "import { PrismaService } from '../../database/prisma.service';\nimport { DomainError, InvalidStateTransitionError } from '../../common/domain/domain-error';\nimport { Money } from '../../common/domain/value-objects';\nimport { WithdrawalPolicy, type WithdrawalStatus } from './domain/withdrawal.policy';\nimport { WalletSettlementPolicy } from '../wallet/domain/wallet-settlement.policy';\n",
  },
  {
    label: 'amount policy',
    from: "    const amount = new Decimal(dto.amount ?? 0);\n    if (amount.lte(0)) throw new BadRequestException('Amount must be greater than zero');\n",
    to: "    const amount = new Decimal(dto.amount ?? 0);\n    this.applyDomainPolicy(() => WithdrawalPolicy.assertAmount(Money.fromMajor(amount.toString())));\n",
  },
  {
    label: 'wallet reservation policy',
    from: "      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');\n      const available = wallet.balance.minus(wallet.locked_balance);\n      if (available.lt(amount)) throw new BadRequestException('Insufficient available balance');\n      const lockedAfter = wallet.locked_balance.plus(amount);\n",
    to: "      this.applyDomainPolicy(() => WalletSettlementPolicy.assertActive(wallet.status));\n      const lockedAfterMoney = this.applyDomainPolicy(() => WalletSettlementPolicy.reserve(\n        Money.fromMajor(wallet.balance.toString(), wallet.currency),\n        Money.fromMajor(wallet.locked_balance.toString(), wallet.currency),\n        Money.fromMajor(amount.toString(), wallet.currency),\n      ));\n      const lockedAfter = new Decimal(lockedAfterMoney.toMajorString());\n",
  },
  {
    label: 'claim policy',
    from: "      if (!['PENDING', 'PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED'].includes(request.status)) throw new ConflictException('Withdrawal request is not available for claim');\n",
    to: "      if (!WithdrawalPolicy.canBeClaimed(request.status as WithdrawalStatus)) throw new ConflictException('Withdrawal request is not available for claim');\n",
  },
  {
    label: 'approve transition policy',
    from: "      if (!['PENDING', 'PENDING_REVIEW'].includes(request.status)) throw new ConflictException(`Withdrawal cannot be approved: ${request.status}`);\n",
    to: "      this.applyDomainPolicy(() => WithdrawalPolicy.assertTransition(request.status as WithdrawalStatus, 'APPROVED_FOR_PAYMENT'));\n",
  },
  {
    label: 'complete transition policy',
    from: "      if (!['APPROVED_FOR_PAYMENT', 'PAYMENT_VERIFIED'].includes(request.status)) throw new ConflictException(`Withdrawal cannot be completed: ${request.status}`);\n",
    to: "      this.applyDomainPolicy(() => WithdrawalPolicy.assertTransition(request.status as WithdrawalStatus, 'COMPLETED'));\n",
  },
  {
    label: 'wallet debit policy',
    from: "      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');\n      if (wallet.locked_balance.lt(request.amount) || wallet.balance.lt(request.amount)) throw new BadRequestException('Wallet balance is not enough to complete withdrawal');\n      const balanceAfter = wallet.balance.minus(request.amount);\n      const lockedAfter = wallet.locked_balance.minus(request.amount);\n",
    to: "      this.applyDomainPolicy(() => WalletSettlementPolicy.assertActive(wallet.status));\n      const settlement = this.applyDomainPolicy(() => WalletSettlementPolicy.completeDebit(\n        Money.fromMajor(wallet.balance.toString(), wallet.currency),\n        Money.fromMajor(wallet.locked_balance.toString(), wallet.currency),\n        Money.fromMajor(request.amount.toString(), wallet.currency),\n      ));\n      const balanceAfter = new Decimal(settlement.balanceAfter.toMajorString());\n      const lockedAfter = new Decimal(settlement.lockedAfter.toMajorString());\n",
  },
  {
    label: 'reject transition policy',
    from: "      if (!['PENDING', 'PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED'].includes(request.status)) throw new ConflictException(`Withdrawal cannot be rejected: ${request.status}`);\n",
    to: "      this.applyDomainPolicy(() => WithdrawalPolicy.assertTransition(request.status as WithdrawalStatus, 'REJECTED'));\n",
  },
  {
    label: 'wallet release policy',
    from: "      if (wallet.locked_balance.lt(request.amount)) throw new BadRequestException('Locked balance is not enough');\n      const lockedAfter = wallet.locked_balance.minus(request.amount);\n",
    to: "      const lockedAfterMoney = this.applyDomainPolicy(() => WalletSettlementPolicy.releaseReservation(\n        Money.fromMajor(wallet.locked_balance.toString(), wallet.currency),\n        Money.fromMajor(request.amount.toString(), wallet.currency),\n      ));\n      const lockedAfter = new Decimal(lockedAfterMoney.toMajorString());\n",
  },
  {
    label: 'domain policy adapter',
    from: "  private normalizeIdempotencyKey(userId: string, value?: string | null) {",
    to: "  private applyDomainPolicy<T>(operation: () => T): T {\n    try {\n      return operation();\n    } catch (error) {\n      if (error instanceof InvalidStateTransitionError) throw new ConflictException(error.message);\n      if (error instanceof DomainError) throw new BadRequestException(error.message);\n      throw error;\n    }\n  }\n\n  private normalizeIdempotencyKey(userId: string, value?: string | null) {",
  },
]);

console.log('R-008 Admin ownership and Withdrawal/Wallet integrations applied.');
