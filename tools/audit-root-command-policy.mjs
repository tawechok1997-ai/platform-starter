import { readFile } from 'node:fs/promises';
import process from 'node:process';

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const scripts = packageJson.scripts ?? {};
const allowedPrefixes = ['check:', 'audit:', 'test:', 'verify:', 'lint:', 'typecheck:', 'build:', 'start:', 'db:', 'help:', 'analyze:', 'ci:'];
const allowedTopLevel = new Set(['dev', 'build', 'lint', 'test', 'typecheck']);
const violations = [];

for (const [name, command] of Object.entries(scripts)) {
  if (!allowedTopLevel.has(name) && !allowedPrefixes.some((prefix) => name.startsWith(prefix))) {
    violations.push({ name, reason: 'unsupported command prefix' });
  }
  if (typeof command !== 'string' || !command.trim()) {
    violations.push({ name, reason: 'empty or non-string command' });
    continue;
  }
  if (/\b(?:npm|yarn)\s+(?:run\s+)?/.test(command)) {
    violations.push({ name, reason: 'root scripts must use pnpm consistently' });
  }
  if (/&&\s*(?:npm|yarn)\b/.test(command)) {
    violations.push({ name, reason: 'mixed package manager orchestration' });
  }
}

const aliases = new Map();
for (const [name, command] of Object.entries(scripts)) {
  const normalized = String(command).replace(/\s+/g, ' ').trim();
  const names = aliases.get(normalized) ?? [];
  names.push(name);
  aliases.set(normalized, names);
}
const duplicateCommands = [...aliases.entries()]
  .filter(([, names]) => names.length > 1)
  .map(([command, names]) => ({ command, names }));

console.log(`Root commands: ${Object.keys(scripts).length}`);
console.log(`Policy violations: ${violations.length}`);
console.log(`Exact duplicate command bodies: ${duplicateCommands.length}`);

for (const violation of violations) console.error(`- ${violation.name}: ${violation.reason}`);
for (const duplicate of duplicateCommands) console.log(`- duplicate aliases: ${duplicate.names.join(', ')}`);

if (violations.length) process.exitCode = 1;
