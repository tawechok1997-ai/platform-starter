import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const API_SRC = path.join(ROOT, 'apps', 'api', 'src');
const JSON_MODE = process.env.R010_QUERY_JSON === '1';
const STRICT_MODE = process.env.R010_QUERY_STRICT === '1';

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return full.endsWith('.ts') ? [full] : [];
  });
}

function relative(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

function methodRanges(source) {
  const starts = [...source.matchAll(/^\s{2}(?:private\s+|protected\s+|public\s+)?(?:async\s+)?([A-Za-z0-9_$]+)\s*\([^)]*\)\s*(?::[^\{]+)?\{/gm)]
    .map((match) => ({ name: match[1], start: match.index ?? 0 }));
  return starts.map((item, index) => ({ ...item, end: starts[index + 1]?.start ?? source.length }));
}

function methodForIndex(ranges, index) {
  return ranges.find((range) => index >= range.start && index < range.end)?.name ?? '<module-or-class-field>';
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

const files = walk(API_SRC).sort();
const hardCodedTakes = [];
const defaultTakes = [];
const queryShapes = new Map();

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const ranges = methodRanges(source);
  const fileName = relative(file);

  for (const match of source.matchAll(/\btake\s*:\s*(\d+)\b/g)) {
    const value = Number(match[1]);
    const method = methodForIndex(ranges, match.index ?? 0);
    hardCodedTakes.push({
      key: `${fileName}#${method}#take:${value}`,
      file: fileName,
      method,
      line: lineNumber(source, match.index ?? 0),
      value,
    });
  }

  for (const match of source.matchAll(/(?:Math\.min\s*\(\s*Math\.max\s*\(\s*Number\([^)]*\?\?\s*(\d+)|Number\([^)]*\?\?\s*(\d+))/g)) {
    const value = Number(match[1] ?? match[2]);
    if (!Number.isFinite(value)) continue;
    const method = methodForIndex(ranges, match.index ?? 0);
    defaultTakes.push({
      key: `${fileName}#${method}#default-take:${value}`,
      file: fileName,
      method,
      line: lineNumber(source, match.index ?? 0),
      value,
    });
  }

  for (const match of source.matchAll(/\b(?:this\.prisma|tx)\.([A-Za-z0-9_]+)\.findMany\s*\(\s*\{([\s\S]{0,2000}?)\}\s*\)/g)) {
    const model = match[1];
    const body = normalizeWhitespace(match[2]);
    const select = body.match(/\bselect\s*:\s*\{([\s\S]*?)\}(?:\s*,|$)/)?.[1] ?? '';
    const include = body.match(/\binclude\s*:\s*\{([\s\S]*?)\}(?:\s*,|$)/)?.[1] ?? '';
    const orderBy = body.match(/\borderBy\s*:\s*([^,}]+)/)?.[1] ?? '';
    const shape = normalizeWhitespace(`${model}|select:${select}|include:${include}|orderBy:${orderBy}`);
    const method = methodForIndex(ranges, match.index ?? 0);
    const item = {
      key: `${fileName}#${method}#${model}.findMany:${lineNumber(source, match.index ?? 0)}`,
      file: fileName,
      method,
      line: lineNumber(source, match.index ?? 0),
      model,
      shape,
    };
    const group = queryShapes.get(shape) ?? [];
    group.push(item);
    queryShapes.set(shape, group);
  }
}

const duplicateQueryGroups = [...queryShapes.entries()]
  .filter(([, items]) => items.length > 1)
  .map(([shape, items]) => ({
    key: `duplicate:${Buffer.from(shape).toString('base64url').slice(0, 24)}`,
    shape,
    occurrences: items,
  }))
  .sort((a, b) => b.occurrences.length - a.occurrences.length || a.key.localeCompare(b.key));

hardCodedTakes.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
defaultTakes.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

const result = {
  audit: 'R-010 query/read-model inventory',
  scannedFiles: files.length,
  hardCodedTakeCount: hardCodedTakes.length,
  defaultTakeCount: defaultTakes.length,
  duplicateQueryGroupCount: duplicateQueryGroups.length,
  hardCodedTakes,
  defaultTakes,
  duplicateQueryGroups,
};

if (JSON_MODE) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  console.log(`R-010 query inventory: scanned ${files.length} TypeScript file(s).`);
  console.log(`Hard-coded takes: ${hardCodedTakes.length}; default takes: ${defaultTakes.length}; duplicate query groups: ${duplicateQueryGroups.length}.`);
  for (const item of hardCodedTakes) console.log(`- TAKE ${item.file}:${item.line} ${item.method} -> ${item.value}`);
  for (const group of duplicateQueryGroups) console.log(`- DUPLICATE ${group.key}: ${group.occurrences.length} occurrence(s)`);
}

if (STRICT_MODE && (hardCodedTakes.length > 0 || duplicateQueryGroups.length > 0)) {
  process.exitCode = 1;
}
