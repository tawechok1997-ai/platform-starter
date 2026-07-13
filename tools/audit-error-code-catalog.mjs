import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const sourcePath = join(root, 'apps', 'api', 'src', 'common', 'errors', 'error-codes.ts');
const docsPath = join(root, 'docs', 'architecture', 'error-code-catalog.md');

const [source, docs] = await Promise.all([
  readFile(sourcePath, 'utf8'),
  readFile(docsPath, 'utf8'),
]);

const codes = [...source.matchAll(/\b([A-Z][A-Z0-9_]+):\s*'\1'/g)].map((match) => match[1]);
const duplicateCodes = codes.filter((code, index) => codes.indexOf(code) !== index);
const undocumentedCodes = codes.filter((code) => !docs.includes(`\`${code}\``));
const missingRequiredSections = [
  '## Finance and withdrawals',
  '## Risk alerts',
  '## Promotions',
  '## Rollout rule',
].filter((heading) => !docs.includes(heading));

console.log(`Error code catalog audit: ${codes.length} stable codes`);
console.log(`  duplicate codes: ${duplicateCodes.length}`);
console.log(`  undocumented codes: ${undocumentedCodes.length}`);
console.log(`  missing sections: ${missingRequiredSections.length}`);

for (const code of duplicateCodes) console.error(`Duplicate code: ${code}`);
for (const code of undocumentedCodes) console.error(`Undocumented code: ${code}`);
for (const section of missingRequiredSections) console.error(`Missing section: ${section}`);

if (!codes.length || duplicateCodes.length || undocumentedCodes.length || missingRequiredSections.length) {
  process.exitCode = 1;
}
