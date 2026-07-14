import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const target = join(root, 'apps/api/src/modules/withdrawals/withdrawals.service.ts');
let source = await readFile(target, 'utf8');

function replaceOnce(before, after, label) {
  if (!source.includes(before)) {
    if (source.includes(after)) {
      console.log(`${label}: already applied`);
      return;
    }
    throw new Error(`${label}: expected source fragment not found`);
  }
  source = source.replace(before, after);
  console.log(`${label}: applied`);
}

replaceOnce(
  "import { CompleteWithdrawalRequestDto } from './dto/complete-withdrawal-request.dto';",
  "import { CompleteWithdrawalRequestDto } from './dto/complete-withdrawal-request.dto';\nimport { Money } from '../../common/domain/value-objects';\nimport { WithdrawalPolicy, type WithdrawalStatus } from './domain/withdrawal.policy';\nimport { WalletSettlementPolicy } from '../wallet/domain/wallet-settlement.policy';",
  'policy imports',
);

replaceOnce(
  "    const amount = new Decimal(dto.amount ?? 0);\n    if (amount.lte(0)) throw new BadRequestException('Amount must be greater than zero');",
  "    const amount = new Decimal(dto.amount ?? 0);\n    WithdrawalPolicy.assertAmount(Money.fromMajor(amount.toString()));",
  'withdrawal amount policy',
);

replaceOnce(
  "      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');\n      const available = wallet.balance.minus(wallet.locked_balance);\n      if (available.lt(amount)) throw new BadRequestException('Insufficient available balance');\n      const lockedAfter = wallet.locked_balance.plus(amount);",
  "      WalletSettlementPolicy.assertActive(wallet.status);\n      const lockedAfterMoney = WalletSettlementPolicy.reserve(\n        Money.fromMajor(wallet.balance.toString(), wallet.currency),\n        Money.fromMajor(wallet.locked_balance.toString(), wallet.currency),\n        Money.fromMajor(amount.toString(), wallet.currency),\n      );\n      const lockedAfter = new Decimal(lockedAfterMoney.toMajorString());",
  'wallet reservation policy',
);

replaceOnce(
  "      if (!['PENDING', 'PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED'].includes(request.status)) throw new ConflictException('Withdrawal request is not available for claim');",
  "      if (!WithdrawalPolicy.canBeClaimed(request.status as WithdrawalStatus)) throw new ConflictException('Withdrawal request is not available for claim');",
  'claim eligibility policy',
);

replaceOnce(
  "      if (!['PENDING', 'PENDING_REVIEW'].includes(request.status)) throw new ConflictException(`Withdrawal cannot be approved: ${request.status}`);",
  "      WithdrawalPolicy.assertTransition(request.status as WithdrawalStatus, 'APPROVED_FOR_PAYMENT');",
  'approval transition policy',
);

replaceOnce(
  "      if (!['APPROVED_FOR_PAYMENT', 'PAYMENT_VERIFIED'].includes(request.status)) throw new ConflictException(`Withdrawal cannot be completed: ${request.status}`);",
  "      WithdrawalPolicy.assertTransition(request.status as WithdrawalStatus, 'COMPLETED');",
  'completion transition policy',
);

replaceOnce(
  "      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');\n      if (wallet.locked_balance.lt(request.amount) || wallet.balance.lt(request.amount)) throw new BadRequestException('Wallet balance is not enough to complete withdrawal');\n      const balanceAfter = wallet.balance.minus(request.amount);\n      const lockedAfter = wallet.locked_balance.minus(request.amount);",
  "      WalletSettlementPolicy.assertActive(wallet.status);\n      const settlement = WalletSettlementPolicy.completeDebit(\n        Money.fromMajor(wallet.balance.toString(), wallet.currency),\n        Money.fromMajor(wallet.locked_balance.toString(), wallet.currency),\n        Money.fromMajor(request.amount.toString(), wallet.currency),\n      );\n      const balanceAfter = new Decimal(settlement.balanceAfter.toMajorString());\n      const lockedAfter = new Decimal(settlement.lockedAfter.toMajorString());",
  'wallet completion policy',
);

replaceOnce(
  "      if (!['PENDING', 'PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED'].includes(request.status)) throw new ConflictException(`Withdrawal cannot be rejected: ${request.status}`);",
  "      WithdrawalPolicy.assertTransition(request.status as WithdrawalStatus, 'REJECTED');",
  'rejection transition policy',
);

replaceOnce(
  "      if (wallet.locked_balance.lt(request.amount)) throw new BadRequestException('Locked balance is not enough');\n      const lockedAfter = wallet.locked_balance.minus(request.amount);",
  "      const lockedAfterMoney = WalletSettlementPolicy.releaseReservation(\n        Money.fromMajor(wallet.locked_balance.toString(), wallet.currency),\n        Money.fromMajor(request.amount.toString(), wallet.currency),\n      );\n      const lockedAfter = new Decimal(lockedAfterMoney.toMajorString());",
  'wallet reservation release policy',
);

await writeFile(target, source, 'utf8');
console.log('R-008 withdrawal/wallet policy integration completed.');
