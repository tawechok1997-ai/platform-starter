import { spawnSync } from 'node:child_process';

const separator = process.argv.indexOf('--');
const printJson = process.argv.includes('--print-json');
const command = separator >= 0 ? process.argv.slice(separator + 1) : [];
const metadata = resolveDeploymentMetadata(process.env);

if (printJson) {
  console.log(JSON.stringify(metadata, null, 2));
  process.exit(0);
}

if (command.length === 0) {
  console.error('Usage: node tools/run-with-deployment-metadata.mjs -- <command> [...args]');
  process.exit(2);
}

const result = spawnSync(command[0], command.slice(1), {
  cwd: process.cwd(),
  env: { ...process.env, ...metadata },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(`Deployment command failed to start: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);

function resolveDeploymentMetadata(env) {
  const commit = firstNonEmpty(
    env.GIT_COMMIT_SHA,
    env.RAILWAY_GIT_COMMIT_SHA,
    env.VERCEL_GIT_COMMIT_SHA,
    env.GITHUB_SHA,
    resolveLocalGitCommit(),
  );
  const builtAt = validTimestamp(env.BUILT_AT) ? env.BUILT_AT.trim() : new Date().toISOString();
  const nodeEnvironment = firstNonEmpty(env.NODE_ENV, 'production');

  return {
    GIT_COMMIT_SHA: normalizeCommit(commit) || 'unknown',
    BUILT_AT: builtAt,
    NODE_ENV: nodeEnvironment,
  };
}

function resolveLocalGitCommit() {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : '';
}

function normalizeCommit(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return /^[0-9a-f]{7,40}$/.test(normalized) ? normalized : '';
}

function validTimestamp(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  return Number.isFinite(Date.parse(value));
}

function firstNonEmpty(...values) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
}
