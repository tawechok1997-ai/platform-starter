import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('finance concurrency hardening', () => {
  const deposit = source('src/modules/topups/deposit-workflow.service.ts');
  const withdrawals = source('src/modules/withdrawals/withdrawals.service.ts');
  const payout = source('src/modules/withdrawals/withdrawal-workflow.service.ts');

  it('locks the wallet before changing deposit balance', () => {
    expect(deposit).toContain('FROM "wallets"');
    expect(deposit).toContain('FOR UPDATE');
    expect(deposit.indexOf('FOR UPDATE')).toBeLessThan(deposit.indexOf('balance: balanceAfter'));
    expect(deposit).toContain('topup:${requestId}:credit-confirmed');
  });

  it('cleans up an uploaded deposit slip when the database transition fails', () => {
    expect(deposit).toContain('await this.storage.put(key, buffer, match[1])');
    expect(deposit).toContain('await this.storage.delete(key).catch(() => undefined)');
    expect(deposit.indexOf('this.storage.put(key')).toBeLessThan(deposit.indexOf('this.prisma.$executeRaw'));
    expect(deposit.indexOf('this.prisma.$executeRaw')).toBeLessThan(deposit.indexOf('this.storage.delete(key)'));
  });

  it('serializes withdrawal reservation against the wallet row', () => {
    expect(withdrawals).toContain('FROM "wallets"');
    expect(withdrawals).toContain('FOR UPDATE');
    expect(withdrawals.indexOf('FOR UPDATE')).toBeLessThan(withdrawals.indexOf('lockedBalance: lockedAfter'));
  });

  it('locks both request and wallet before final payout mutation', () => {
    expect(payout.match(/FOR UPDATE/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(payout.indexOf('FROM "withdrawal_requests"')).toBeLessThan(payout.indexOf('FROM "wallets"'));
    expect(payout.indexOf('FROM "wallets"')).toBeLessThan(payout.indexOf('balance: balanceAfter'));
    expect(payout).toContain('withdrawal:${requestId}:payment-verified');
  });

  it('keeps rejection terminal and guarded by request state', () => {
    expect(withdrawals).toContain("AND \"status\"::text IN ('PENDING', 'PENDING_REVIEW', 'APPROVED_FOR_PAYMENT')");
    expect(withdrawals).toContain("SET \"status\" = 'REJECTED'::\"WithdrawalRequestStatus\"");
  });
});
