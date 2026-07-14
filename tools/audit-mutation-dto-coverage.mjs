import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const ROOT = join(process.cwd(), 'apps', 'api', 'src', 'modules');
const CRITICAL_MODULES = new Set([
  'admin-access',
  'admin-auth',
  'finance',
  'withdrawals',
  'risk-alerts',
  'support',
  'promotions',
  'game-platform',
]);
const MUTATION = /@(Post|Put|Patch|Delete)\s*\(/g;
const BODY_DECORATOR = /@Body\([^)]*\)/;
const BODY_ANY = /@Body\([^)]*\)\s+\w+\s*:\s*(?:any|unknown)\b/;
const BODY_INLINE = /@Body\([^)]*\)\s+\w+\s*:\s*\{/;
const BODY_NAMED = /@Body\([^)]*\)\s+\w+\s*:\s*([A-Z][A-Za-z0-9_]*)\b/;
const BODY_UNSAFE_GENERIC = /@Body\([^)]*\)\s+\w+\s*:\s*(?:Record|object|Object)\b/;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && entry.name.endsWith('.controller.ts')) files.push(path);
  }
  return files;
}

function normalize(path) {
  return relative(ROOT, path).split(sep).join('/');
}

function moduleSlug(path) {
  return normalize(path).split('/')[0];
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

function handlerSlice(source, start) {
  const next = source.slice(start + 1).search(/\n\s*@(?:Get|Post|Put|Patch|Delete)\s*\(/);
  const end = next < 0 ? source.length : start + 1 + next;
  return source.slice(start, end);
}

const files = await walk(ROOT);
const inventory = [];

for (const file of files) {
  const source = await readFile(file, 'utf8');
  MUTATION.lastIndex = 0;
  let match;
  while ((match = MUTATION.exec(source))) {
    const block = handlerSlice(source, match.index);
    const namedMatch = block.match(BODY_NAMED);
    inventory.push({
      file: normalize(file),
      module: moduleSlug(file),
      method: match[1].toUpperCase(),
      line: lineNumber(source, match.index),
      hasBody: BODY_DECORATOR.test(block),
      bodyAny: BODY_ANY.test(block),
      bodyInline: BODY_INLINE.test(block),
      bodyUnsafeGeneric: BODY_UNSAFE_GENERIC.test(block),
      namedType: namedMatch?.[1] ?? null,
    });
  }
}

const criticalUntyped = inventory.filter((item) => (
  CRITICAL_MODULES.has(item.module)
  && item.hasBody
  && (item.bodyAny || item.bodyUnsafeGeneric || (!item.namedType && !item.bodyInline))
));
const inlineBodies = inventory.filter((item) => item.bodyInline);
const namedBodies = inventory.filter((item) => item.namedType);
const bodyless = inventory.filter((item) => !item.hasBody);

console.log(`Mutation DTO audit: ${inventory.length} mutation handlers`);
console.log(`  named typed bodies: ${namedBodies.length}`);
console.log(`  inline object bodies: ${inlineBodies.length}`);
console.log(`  bodyless mutations: ${bodyless.length}`);
console.log(`  critical untyped bodies: ${criticalUntyped.length}`);

if (inlineBodies.length) {
  console.warn('\nInline object bodies scheduled for migration:');
  for (const item of inlineBodies) console.warn(`  - ${item.file}:${item.line} (@${item.method})`);
}

if (criticalUntyped.length) {
  console.error('\nCritical mutation handlers using untyped or generic request bodies:');
  for (const item of criticalUntyped) console.error(`  - ${item.file}:${item.line} (@${item.method})`);
  process.exitCode = 1;
}
