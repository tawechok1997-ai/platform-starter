import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const toolDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(toolDirectory, '..');
const artifactPath = resolve(repositoryRoot, 'apps/api/dist/main.js');

try {
  await access(artifactPath, constants.R_OK);
  console.log(`✓ API build artifact found: ${artifactPath}`);
} catch {
  console.error(`✗ API build completed without a readable artifact: ${artifactPath}`);
  console.error('Check the Nest TypeScript configuration and ensure compilerOptions.noEmit is false.');
  process.exitCode = 1;
}
