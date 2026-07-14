import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const ROOT = join(process.cwd(), 'apps', 'api', 'src', 'modules');
const BASELINE_PATH = join(process.cwd(), 'docs', 'architecture', 'mutation-dto-debt.json');
const MUTATION = /@(Post|Put|Patch|Delete)\s*\(/g;
const BODY_ANY = /@Body\([^)]*\)\s+\w+\s*:\s*any\b/;
const BODY_INLINE = /@Body\([^)]*\)\s+\w+\s*:\s*\{/;
const BODY_CONTRACT = /@Body\([^)]*\)\s+\w+\s*:\s*([A-Z][A-Za-z0-9_]*)\b/;

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

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

function handlerSlice(source, start) {
  const next = source.slice(start + 1).search(/\n\s*@(?:Get|Post|Put|Patch|Delete)\s*\(/);
  const end = next < 0 ? source.length : start + 1 + next;
  return source.slice(start, end);
}

function violationReason(item) {
  if (item.bodyAny) return 'any';
  if (item.bodyInline) return 'inline';
  return 'unrecognized';
}

function violationKey(item) {
  return `${item.file}:${item.line}:${item.method}:${violationReason(item)}`;
}

const baselineDocument = JSON.parse(await readFile(BASELINE_PATH, 'utf8'));
const baseline = new Set(Array.isArray(baselineDocument.violations) ? baselineDocument.violations : []);
const files = await walk(ROOT);
const inventory = [];

for (const file of files) {
  const source = await readFile(file, 'utf8');
  MUTATION.lastIndex = 0;
  let match;
  while ((match = MUTATION.exec(source))) {
    const block = handlerSlice(source, match.index);
    const hasBody = /@Body\(/.test(block);
    const contractMatch = block.match(BODY_CONTRACT);
    inventory.push({
      file: normalize(file),
      method: match[1].toUpperCase(),
      line: lineNumber(source, match.index),
      hasBody,
      bodyAny: BODY_ANY.test(block),
      bodyInline: BODY_INLINE.test(block),
      contract: contractMatch?.[1] ?? null,
    });
  }
}

const violations = inventory.filter((item) => item.hasBody && (item.bodyAny || item.bodyInline || !item.contract));
const currentKeys = new Set(violations.map(violationKey));
const newViolations = violations.filter((item) => !baseline.has(violationKey(item)));
const resolvedBaseline = [...baseline].filter((key) => !currentKeys.has(key));
const typedBodies = inventory.filter((item) => item.contract && !item.bodyAny && !item.bodyInline);
const bodyless = inventory.filter((item) => !item.hasBody);

console.log(`Mutation DTO audit: ${inventory.length} mutation handlers`);
console.log(`  typed request bodies: ${typedBodies.length}`);
console.log(`  bodyless mutations: ${bodyless.length}`);
console.log(`  baseline debt: ${baseline.size}`);
console.log(`  current debt: ${violations.length}`);
console.log(`  new violations: ${newViolations.length}`);
console.log(`  resolved baseline entries: ${resolvedBaseline.length}`);

if (resolvedBaseline.length) {
  console.warn('\nResolved baseline entries should be removed from mutation-dto-debt.json:');
  for (const key of resolvedBaseline) console.warn(`  - ${key}`);
}

if (newViolations.length) {
  console.error('\nNew mutation handlers without declared request contracts:');
  for (const item of newViolations) {
    console.error(`  - ${violationKey(item)}`);
  }
  process.exitCode = 1;
}
