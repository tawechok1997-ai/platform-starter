import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const toolsDir = path.join(root, 'tools');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const registry = JSON.parse(await readFile(path.join(toolsDir, 'tool-registry.json'), 'utf8'));
const strict = process.argv.includes('--strict');
const scriptText = Object.values(packageJson.scripts ?? {}).join('\n');
const referenced = new Set([...scriptText.matchAll(/tools\/([A-Za-z0-9._-]+\.mjs)/g)].map((match) => match[1]));
const entries = await readdir(toolsDir, { withFileTypes: true });
const toolFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.mjs')).map((entry) => entry.name).sort();

function patternToRegExp(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*');
  return new RegExp(`^${escaped}$`);
}

const categoryMatchers = Object.entries(registry.categories ?? {}).map(([name, category]) => ({
  name,
  matchers: (category.patterns ?? []).map(patternToRegExp),
}));

function classify(file) {
  return categoryMatchers.find((category) => category.matchers.some((matcher) => matcher.test(file)))?.name ?? null;
}

const missing = [];
for (const file of referenced) {
  try {
    await access(path.join(toolsDir, file));
  } catch {
    missing.push(file);
  }
}

const classified = new Map(toolFiles.map((file) => [file, classify(file)]));
const unclassified = toolFiles.filter((file) => !classified.get(file) && !file.endsWith('.test.mjs'));
const activeWithoutRootScript = toolFiles.filter((file) => classified.get(file) === 'active' && !referenced.has(file));
const unreferenced = toolFiles.filter((file) => {
  if (referenced.has(file) || file.endsWith('.test.mjs')) return false;
  return classified.get(file) !== 'historical';
});

const counts = Object.fromEntries(Object.keys(registry.categories ?? {}).map((name) => [name, 0]));
for (const category of classified.values()) {
  if (category) counts[category] = (counts[category] ?? 0) + 1;
}

console.log(`Referenced tools: ${referenced.size}`);
console.log(`Tool files: ${toolFiles.length}`);
for (const [category, count] of Object.entries(counts)) console.log(`  ${category}: ${count}`);
console.log(`  unclassified: ${unclassified.length}`);

if (missing.length) {
  console.error('\nMissing tools referenced by package scripts:');
  for (const file of missing) console.error(`- tools/${file}`);
}

if (activeWithoutRootScript.length) {
  console.error('\nActive tools without a direct root package script:');
  for (const file of activeWithoutRootScript) console.error(`- tools/${file}`);
}

if (unclassified.length) {
  console.log('\nUnclassified tools:');
  for (const file of unclassified) console.log(`- tools/${file}`);
}

if (unreferenced.length) {
  console.log('\nNon-historical tools without a direct root package script:');
  for (const file of unreferenced) console.log(`- tools/${file} (${classified.get(file) ?? 'unclassified'})`);
  console.log('Scoped tools may be referenced by workflows, tests or other tools. Review before deleting.');
}

const rules = registry.rules ?? {};
const failsMissing = missing.length > 0 && rules.strictModeFailsOnMissingReferencedTool !== false;
const failsActiveOwnership = activeWithoutRootScript.length > 0 && rules.requirePackageScriptOrReference !== false;
const failsUnclassified = strict && unclassified.length > 0 && rules.strictModeFailsOnUnclassifiedTool === true;

if (failsMissing || failsActiveOwnership || failsUnclassified) process.exitCode = 1;
