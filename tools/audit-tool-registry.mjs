import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const toolsDir = path.join(root, 'tools');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const strict = process.argv.includes('--strict');
const scriptText = Object.values(packageJson.scripts ?? {}).join('\n');
const referenced = new Set([...scriptText.matchAll(/tools\/([A-Za-z0-9._-]+\.mjs)/g)].map((match) => match[1]));
const entries = await readdir(toolsDir, { withFileTypes: true });
const toolFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.mjs')).map((entry) => entry.name).sort();

const missing = [];
for (const file of referenced) {
  try {
    await access(path.join(toolsDir, file));
  } catch {
    missing.push(file);
  }
}

const unreferenced = toolFiles.filter((file) => {
  if (referenced.has(file)) return false;
  if (file.endsWith('.test.mjs')) return false;
  return file !== 'audit-tool-registry.mjs';
});

console.log(`Referenced tools: ${referenced.size}`);
console.log(`Tool files: ${toolFiles.length}`);

if (missing.length) {
  console.error('\nMissing tools referenced by package scripts:');
  for (const file of missing) console.error(`- tools/${file}`);
}

if (unreferenced.length) {
  console.log('\nTools without a direct root package script:');
  for (const file of unreferenced) console.log(`- tools/${file}`);
  console.log('These may be referenced by workflows, tests or other tools. Review before deleting.');
}

if (missing.length || (strict && unreferenced.length)) {
  process.exitCode = 1;
}
