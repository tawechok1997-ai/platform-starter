import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const appDirectory = path.resolve(toolsDirectory, '..');
const buildIdPath = path.join(appDirectory, '.next', 'BUILD_ID');
const packageManager = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const port = process.env.PORT || '3000';

if (!(await fileExists(buildIdPath))) {
  console.warn('[web-member] Missing .next/BUILD_ID; building the production app before startup.');
  const buildExitCode = await run(packageManager, ['build']);
  if (buildExitCode !== 0) process.exit(buildExitCode || 1);
}

if (!(await fileExists(buildIdPath))) {
  console.error('[web-member] Production build completed without creating .next/BUILD_ID.');
  process.exit(1);
}

const server = spawn(packageManager, ['exec', 'next', 'start', '-p', port], {
  cwd: appDirectory,
  env: process.env,
  stdio: 'inherit',
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    if (!server.killed) server.kill(signal);
  });
}

server.on('error', (error) => {
  console.error('[web-member] Failed to start Next.js:', error);
  process.exit(1);
});

server.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

async function fileExists(filePath) {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: appDirectory,
      env: process.env,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${command} ${args.join(' ')} terminated by ${signal}`));
        return;
      }
      resolve(code ?? 1);
    });
  });
}
