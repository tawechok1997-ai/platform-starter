import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('duplicate slip migration', () => {
  const enumMigration = readFileSync(join(process.cwd(), '../../prisma/migrations', '20260711013000_add_slip_duplicate_and_payment_audit', 'migration.sql'), 'utf8');
  const objectMigration = readFileSync(join(process.cwd(), '../../prisma/migrations', '20260711013100_add_slip_duplicate_and_payment_audit_objects', 'migration.sql'), 'utf8');

  it('allows duplicate evidence rows while protecting accepted slips', () => {
    expect(objectMigration).toContain('top_up_requests_active_slip_transaction_ref_key');
    expect(objectMigration).toContain('top_up_requests_active_slip_file_hash_key');
    expect(objectMigration).toContain('"status" <> \'DUPLICATE\'');
  });

  it('keeps exact payout proof identifiers unique', () => {
    expect(objectMigration).toContain('withdrawal_requests_payment_transaction_ref_key');
    expect(objectMigration).toContain('withdrawal_requests_payment_slip_file_hash_key');
  });

  it('adds auditable staged deposit and withdrawal statuses before dependent objects', () => {
    for (const status of [
      'PENDING_SLIP_REVIEW',
      'PENDING_CREDIT',
      'DUPLICATE',
      'COMPLETED',
      'PENDING_REVIEW',
      'APPROVED_FOR_PAYMENT',
      'PAYMENT_PROOF_UPLOADED',
      'PAYMENT_VERIFIED',
    ]) {
      expect(enumMigration).toContain(`'${status}'`);
    }

    expect(enumMigration).not.toContain('CREATE UNIQUE INDEX');
    expect(objectMigration).toContain('CREATE UNIQUE INDEX');
  });
});
