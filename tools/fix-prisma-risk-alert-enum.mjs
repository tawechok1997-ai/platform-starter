import { readFile, writeFile } from 'node:fs/promises';

const schemaPath = new URL('../prisma/schema.prisma', import.meta.url);
const source = await readFile(schemaPath, 'utf8');

const enumPattern = /enum RiskAlertType \{([\s\S]*?)\n\}/m;
const match = source.match(enumPattern);

if (!match) {
  throw new Error('RiskAlertType enum not found in prisma/schema.prisma');
}

const seen = new Set();
const lines = match[1].split('\n');
const deduped = lines.filter((line) => {
  const value = line.trim();
  if (!value || value.startsWith('//')) return true;
  if (seen.has(value)) return false;
  seen.add(value);
  return true;
});

const nextEnum = `enum RiskAlertType {${deduped.join('\n')}\n}`;
const nextSource = source.replace(enumPattern, nextEnum);

if (nextSource !== source) {
  await writeFile(schemaPath, nextSource, 'utf8');
  console.log('Removed duplicate RiskAlertType enum values from prisma/schema.prisma');
}
