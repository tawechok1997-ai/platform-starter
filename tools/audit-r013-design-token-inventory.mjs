import fs from 'node:fs';
import path from 'node:path';

const roots = ['apps/web-admin', 'apps/web-member'];
const extensions = new Set(['.css', '.ts', '.tsx']);
const files = [];

for (const root of roots) walk(root);

const patterns = {
  hexColor: /#[0-9a-fA-F]{3,8}\b/g,
  rgbColor: /rgba?\([^)]*\)/g,
  spacing: /(?:margin|padding|gap|inset|top|right|bottom|left|width|height|min-width|min-height|max-width|max-height)\s*:\s*[^;{}]*(?:\d+(?:\.\d+)?(?:px|rem|vw|vh|dvh))/g,
  radius: /border-radius\s*:\s*[^;{}]+/g,
  shadow: /box-shadow\s*:\s*[^;{}]+/g,
  breakpoint: /@media\s*\([^)]*(?:width|height)[^)]*\)/g,
  zIndex: /z-index\s*:\s*-?\d+/g,
};

const report = {
  generatedAt: new Date().toISOString(),
  roots,
  filesScanned: files.length,
  categories: {},
  files: [],
};

for (const [category] of Object.entries(patterns)) report.categories[category] = { occurrences: 0, unique: [] };
const unique = Object.fromEntries(Object.keys(patterns).map((key) => [key, new Set()]));

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const counts = {};
  let relevant = false;
  for (const [category, pattern] of Object.entries(patterns)) {
    const matches = content.match(pattern) ?? [];
    counts[category] = matches.length;
    report.categories[category].occurrences += matches.length;
    for (const match of matches) unique[category].add(match.replace(/\s+/g, ' ').trim());
    if (matches.length) relevant = true;
  }
  if (relevant) report.files.push({ file, counts });
}

for (const [category, values] of Object.entries(unique)) {
  report.categories[category].unique = [...values].sort();
  report.categories[category].uniqueCount = values.size;
}

const output = process.env.R013_TOKEN_INVENTORY_OUTPUT ?? 'docs/evidence/r013-design-token-inventory.json';
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);

console.log(`R-013 design-token inventory: ${files.length} files`);
for (const [category, result] of Object.entries(report.categories)) {
  console.log(`- ${category}: ${result.occurrences} occurrences, ${result.uniqueCount} unique`);
}
console.log(`Evidence written to ${output}`);

function walk(current) {
  if (!fs.existsSync(current)) return;
  const stat = fs.statSync(current);
  if (stat.isDirectory()) {
    if (['node_modules', '.next', 'dist', 'coverage'].includes(path.basename(current))) return;
    for (const entry of fs.readdirSync(current)) walk(path.join(current, entry));
    return;
  }
  if (extensions.has(path.extname(current))) files.push(current.replaceAll('\\', '/'));
}
