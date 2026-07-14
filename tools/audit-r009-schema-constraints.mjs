import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const schemaPath = path.join(ROOT, 'prisma', 'schema.prisma');
const JSON_MODE = process.env.R009_SCHEMA_JSON === '1';
const STRICT_MODE = process.env.R009_SCHEMA_STRICT === '1';

if (!fs.existsSync(schemaPath)) {
  console.error('R-009 schema audit failed: prisma/schema.prisma was not found.');
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, 'utf8');
const modelPattern = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
const models = new Map();
for (const match of schema.matchAll(modelPattern)) {
  models.set(match[1], match[2]);
}

const criticalModels = [
  'Wallet',
  'WalletLedger',
  'TopUpRequest',
  'WithdrawalRequest',
  'AdminDelegation',
  'RiskAlert',
  'Promotion',
  'PromotionClaim',
  'AffiliateCommission',
  'KycSubmission',
  'WatchlistEntry',
];

const inventory = [];
const missingModels = [];
for (const modelName of criticalModels) {
  const body = models.get(modelName);
  if (!body) {
    missingModels.push(modelName);
    continue;
  }

  const uniqueFields = [...body.matchAll(/^\s*(\w+)\s+[^\n]*@unique[^\n]*$/gm)].map((match) => match[1]);
  const compoundUnique = [...body.matchAll(/@@unique\s*\(([^\n]+)\)/g)].map((match) => match[1].trim());
  const indexes = [...body.matchAll(/@@index\s*\(([^\n]+)\)/g)].map((match) => match[1].trim());
  const relations = [...body.matchAll(/@relation\(([^\n]+)\)/g)].map((match) => match[1].trim());
  const cascadeRelations = relations.filter((relation) => /onDelete:\s*Cascade/.test(relation));
  const idempotencyFields = [...body.matchAll(/^\s*(\w*idempotency\w*)\s+/gmi)].map((match) => match[1]);

  inventory.push({
    model: modelName,
    uniqueFields,
    compoundUnique,
    indexes,
    relationCount: relations.length,
    cascadeRelationCount: cascadeRelations.length,
    idempotencyFields,
  });
}

const modelsWithoutAnyUniqueness = inventory
  .filter((entry) => entry.uniqueFields.length === 0 && entry.compoundUnique.length === 0)
  .map((entry) => entry.model);
const modelsWithoutIndexes = inventory
  .filter((entry) => entry.indexes.length === 0)
  .map((entry) => entry.model);

const result = {
  audit: 'R-009 schema constraint and idempotency inventory',
  schema: 'prisma/schema.prisma',
  discoveredModels: models.size,
  criticalModelsRequested: criticalModels.length,
  criticalModelsFound: inventory.length,
  missingModels,
  modelsWithoutAnyUniqueness,
  modelsWithoutIndexes,
  strict: STRICT_MODE,
  note: 'This inventory does not claim semantic correctness of every constraint. Findings require domain review before schema changes.',
  inventory,
};

if (JSON_MODE) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  console.log(`R-009 schema audit: found ${inventory.length}/${criticalModels.length} critical model(s).`);
  if (missingModels.length) console.log(`Missing or renamed models: ${missingModels.join(', ')}`);
  console.log(`Models without explicit uniqueness beyond primary key: ${modelsWithoutAnyUniqueness.length}.`);
  console.log(`Models without explicit indexes: ${modelsWithoutIndexes.length}.`);
}

if (STRICT_MODE && missingModels.length > 0) {
  console.error('R-009 strict schema audit failed: one or more required critical models are missing or renamed without updating the audit contract.');
  process.exitCode = 1;
}
