import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const rootPackage = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const apiPackage = JSON.parse(await readFile(join(root, 'apps/api/package.json'), 'utf8'));
const schema = await readFile(join(root, 'prisma/schema.prisma'), 'utf8');

const expectedVersion = rootPackage.dependencies?.['@prisma/client'];
const versions = {
  rootClient: expectedVersion,
  rootCli: rootPackage.devDependencies?.prisma,
  apiClient: apiPackage.dependencies?.['@prisma/client'],
  apiCli: apiPackage.devDependencies?.prisma,
  overrideClient: rootPackage.pnpm?.overrides?.['@prisma/client'],
  overrideCli: rootPackage.pnpm?.overrides?.prisma,
};

for (const [name, version] of Object.entries(versions)) {
  if (!version) failures.push(`missing Prisma version: ${name}`);
  else if (expectedVersion && version !== expectedVersion) failures.push(`${name}=${version} differs from root @prisma/client=${expectedVersion}`);
}

if (!/generator\s+client\s*\{[\s\S]*?provider\s*=\s*"prisma-client-js"[\s\S]*?\}/m.test(schema)) {
  failures.push('schema.prisma: missing canonical prisma-client-js generator');
}
if (/output\s*=/.test(schema.match(/generator\s+client\s*\{[\s\S]*?\}/m)?.[0] ?? '')) {
  failures.push('schema.prisma: custom generated-client output is forbidden without an architecture exception');
}
if (rootPackage.scripts?.['db:generate'] !== 'prisma generate --schema prisma/schema.prisma') {
  failures.push('package.json: db:generate must use the canonical root schema');
}
if (!String(rootPackage.scripts?.['build:api'] ?? '').startsWith('pnpm db:generate')) {
  failures.push('package.json: build:api must generate Prisma client before compiling');
}

console.log('Generated client/schema drift audit:');
console.log(`  Prisma version: ${expectedVersion ?? 'missing'}`);
console.log(`  aligned version declarations: ${Object.keys(versions).length - failures.filter((item) => item.includes('Prisma version') || item.includes('differs')).length}/${Object.keys(versions).length}`);
console.log(`  failures: ${failures.length}`);

if (failures.length) {
  console.error('\nGenerated drift violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
