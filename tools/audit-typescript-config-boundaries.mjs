import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const configDir = resolve(rootDir, 'packages/config/typescript');

async function readConfig(name) {
  const content = await readFile(resolve(configDir, name), 'utf8');
  return JSON.parse(content);
}

const [base, next, nest] = await Promise.all([
  readConfig('base.json'),
  readConfig('next.json'),
  readConfig('nest.json'),
]);

const failures = [];
const baseOptions = base.compilerOptions ?? {};
const nextOptions = next.compilerOptions ?? {};
const nestOptions = nest.compilerOptions ?? {};

for (const option of ['noEmit', 'noUncheckedIndexedAccess', 'exactOptionalPropertyTypes']) {
  if (Object.hasOwn(baseOptions, option)) {
    failures.push(`base.json must not define app-specific option "${option}"`);
  }
}

if (nextOptions.noEmit !== true) failures.push('next.json must set noEmit=true');
if (nextOptions.noUncheckedIndexedAccess !== true) failures.push('next.json must set noUncheckedIndexedAccess=true');
if (nextOptions.exactOptionalPropertyTypes !== true) failures.push('next.json must set exactOptionalPropertyTypes=true');

if (nestOptions.noEmit !== false) failures.push('nest.json must set noEmit=false');
if (nestOptions.noUncheckedIndexedAccess !== false) failures.push('nest.json must set noUncheckedIndexedAccess=false until the staged API migration is complete');
if (nestOptions.exactOptionalPropertyTypes !== false) failures.push('nest.json must set exactOptionalPropertyTypes=false until the staged API migration is complete');

if (failures.length > 0) {
  console.error('TypeScript config boundary audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('TypeScript config boundaries are valid.');
