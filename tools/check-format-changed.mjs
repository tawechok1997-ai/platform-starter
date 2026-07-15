import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const supported = /\.(?:[cm]?[jt]sx?|json|ya?ml|css|md)$/i;

function gitFiles(args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.status !== 0) return [];
  return result.stdout
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
}

const current = new Set([
  ...gitFiles(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD']),
  ...gitFiles(['diff', '--cached', '--name-only', '--diff-filter=ACMR']),
  ...gitFiles(['ls-files', '--others', '--exclude-standard']),
]);

if (current.size === 0) {
  for (const file of gitFiles(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD^', 'HEAD'])) current.add(file);
}

const files = [...current].filter(
  (file) => supported.test(file) && !file.endsWith('/next-env.d.ts') && existsSync(file),
);
if (files.length === 0) {
  console.log('No changed Prettier-supported files to check.');
  process.exit(0);
}

const executable = process.platform === 'win32' ? 'node_modules/.bin/prettier.cmd' : 'node_modules/.bin/prettier';
const result = spawnSync(executable, ['--check', ...files], { stdio: 'inherit' });
process.exit(result.status ?? 1);
