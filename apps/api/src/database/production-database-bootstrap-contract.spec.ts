import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repositoryRoot = resolve(__dirname, '../../../..');
const bootstrapSource = readFileSync(
  resolve(repositoryRoot, 'tools/prepare-production-database.mjs'),
  'utf8',
);
const governanceMigration = readFileSync(
  resolve(
    repositoryRoot,
    'prisma/migrations/20260803070000_add_admin_team_access_governance/migration.sql',
  ),
  'utf8',
);

const GOVERNANCE_RELATIONS = [
  'admin_teams',
  'admin_team_members',
  'admin_reporting_lines',
  'admin_permission_overrides',
  'admin_access_profiles',
] as const;

describe('production database bootstrap contract', () => {
  test('materializes SQL-only Admin governance relations before startup', () => {
    expect(bootstrapSource).toContain(
      "name: '20260803070000_add_admin_team_access_governance'",
    );

    for (const relation of GOVERNANCE_RELATIONS) {
      expect(bootstrapSource).toContain(`'${relation}'`);
      expect(governanceMigration).toContain(`CREATE TABLE "${relation}"`);
    }
  });

  test('repairs physical schema drift after Prisma migrate deploy', () => {
    expect(bootstrapSource).toMatch(
      /runPrisma\(\['migrate', 'deploy'\]\);\s*await applyBootstrapSafeMigrations\(\);/,
    );
    expect(bootstrapSource).toContain('Refusing partial bootstrap-safe migration');
    expect(bootstrapSource).toContain('Migration history does not match the physical schema');
  });
});
