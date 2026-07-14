import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const ROOT = join(process.cwd(), 'apps', 'api', 'src', 'modules');
const MUTATION = /@(Post|Put|Patch|Delete)\s*\(/g;
const BODY_ANY = /@Body\(\)\s+\w+\s*:\s*any\b/;
const BODY_INLINE = /@Body\(\)\s+\w+\s*:\s*\{/;
const BODY_DTO = /@Body\(\)\s+\w+\s*:\s*([A-Z][A-Za-z0-9_]*(?:Dto|Request|Command|Input))\b/;

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

const files = await walk(ROOT);
const inventory = [];

for (const file of files) {
  const source = await readFile(file, 'utf8');
  MUTATION.lastIndex = 0;
  let match;
  while ((match = MUTATION.exec(source))) {
    const block = handlerSlice(source, match.index);
    const hasBody = /@Body\(/.test(block);
    const dtoMatch = block.match(BODY_DTO);
    inventory.push({
      file: normalize(file),
      method: match[1].toUpperCase(),
      line: lineNumber(source, match.index),
      hasBody,
      bodyAny: BODY_ANY.test(block),
      bodyInline: BODY_INLINE.test(block),
      dto: dtoMatch?.[1] ?? null,
    });
  }
}

const violations = inventory.filter((item) => (
  item.hasBody && (item.bodyAny || item.bodyInline || !item.dto)
));
const inlineBodies = inventory.filter((item) => item.bodyInline);
const dtoBodies = inventory.filter((item) => item.dto);
const bodyless = inventory.filter((item) => !item.hasBody);

console.log(`Mutation DTO audit: ${inventory.length} mutation handlers`);
console.log(`  DTO-backed bodies: ${dtoBodies.length}`);
console.log(`  inline object bodies: ${inlineBodies.length}`);
console.log(`  bodyless mutations: ${bodyless.length}`);
console.log(`  untyped mutation bodies: ${violations.length}`);

if (violations.length) {
  console.error('\nMutation handlers without declared DTO/request/command/input contracts:');
  for (const item of violations) {
    const reason = item.bodyAny ? 'any body' : item.bodyInline ? 'inline object body' : 'unrecognized body contract';
    console.error(`  - ${item.file}:${item.line} (@${item.method}, ${reason})`);
  }
  process.exitCode = 1;
}
