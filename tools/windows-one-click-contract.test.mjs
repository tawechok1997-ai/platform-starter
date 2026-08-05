import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const setupCmd = read('Setup-Windows.cmd');
const startCmd = read('Start-Windows.cmd');
const stopCmd = read('Stop-Windows.cmd');
const setup = read('scripts/windows/setup.ps1');
const start = read('scripts/windows/start.ps1');
const stop = read('scripts/windows/stop.ps1');
const compose = read('compose.windows.yml');
const gitignore = read('.gitignore');


test('root launchers delegate to maintained PowerShell owners', () => {
  assert.match(setupCmd, /scripts\\windows\\setup\.ps1/);
  assert.match(startCmd, /scripts\\windows\\start\.ps1/);
  assert.match(stopCmd, /scripts\\windows\\stop\.ps1/);
});


test('setup owns a complete Windows 10 and 11 bootstrap', () => {
  assert.match(setup, /ProductType/);
  assert.match(setup, /Windows 10\|Windows 11/);
  assert.match(setup, /Microsoft-Windows-Subsystem-Linux/);
  assert.match(setup, /VirtualMachinePlatform/);
  assert.match(setup, /Git\.Git/);
  assert.match(setup, /OpenJS\.NodeJS\.22/);
  assert.match(setup, /Docker\.DockerDesktop/);
  assert.match(setup, /pnpm@11\.18\.0/);
  assert.match(setup, /pnpm\.cmd'.*'install'.*'--frozen-lockfile'/s);
  assert.match(setup, /db:migrate/);
  assert.match(setup, /db:seed/);
  assert.match(setup, /db:seed:access/);
});


test('pnpm activation happens while the machine bootstrap is elevated', () => {
  const machineBootstrap = setup.match(/function Invoke-MachineBootstrap \{([\s\S]*?)\n\}/)?.[1] ?? '';
  const pnpmInstaller = setup.match(/function Install-Pnpm \{([\s\S]*?)\n\}/)?.[1] ?? '';
  const dependencyInstaller = setup.match(/function Install-ProjectDependencies \{([\s\S]*?)\n\}/)?.[1] ?? '';

  assert.match(machineBootstrap, /Install-Node22[\s\S]*Install-Pnpm[\s\S]*Install-DockerDesktop/);
  assert.match(pnpmInstaller, /corepack\.cmd'.*'enable'/s);
  assert.match(pnpmInstaller, /corepack\.cmd'.*'prepare'.*'pnpm@11\.18\.0'.*'--activate'/s);
  assert.match(pnpmInstaller, /pnpm\.cmd --version/);
  assert.doesNotMatch(dependencyInstaller, /corepack\.cmd'.*'enable'/s);
  assert.match(dependencyInstaller, /pnpm is not available on PATH/);
});


test('Windows setup isolates local credentials from maintained environments', () => {
  assert.match(setup, /\.env\.windows\.local/);
  assert.match(setup, /New-HexSecret/);
  assert.match(setup, /127\.0\.0\.1:55432/);
  assert.match(setup, /127\.0\.0\.1:56379/);
  assert.match(setup, /preserving local secrets and database credentials/);
  assert.match(setup, /'DEFAULT_ADMIN_SECRET'\s*=\s*\(New-HexSecret\)/);
  assert.match(setup, /'BOOTSTRAP_ADMIN_PASSWORD'\s*=\s*\(New-HexSecret\)/);
  assert.match(gitignore, /^\.env\.windows\.local$/m);
  assert.match(gitignore, /^\.local\/$/m);
});


test('Docker infrastructure is loopback-only and persistent', () => {
  assert.match(compose, /postgres:16-alpine/);
  assert.match(compose, /redis:7-alpine/);
  assert.match(compose, /127\.0\.0\.1:55432:5432/);
  assert.match(compose, /127\.0\.0\.1:56379:6379/);
  assert.match(compose, /platform_starter_postgres_data/);
  assert.match(compose, /platform_starter_redis_data/);
  assert.match(compose, /healthcheck:/);
});


test('start and stop scripts own all three applications without deleting data', () => {
  assert.match(start, /@platform\/api dev/);
  assert.match(start, /@platform\/web-member dev/);
  assert.match(start, /@platform\/web-admin dev/);
  assert.match(start, /windows-processes\.json/);
  assert.match(start, /localhost:4000\/health/);
  assert.match(start, /localhost:3000/);
  assert.match(start, /localhost:3001/);
  assert.match(stop, /taskkill\.exe/);
  assert.match(stop, /compose.*stop/s);
  assert.doesNotMatch(stop, /down\s+--volumes|volume\s+rm|prune/);
});


test('process lifecycle refuses stale or reused Windows process ids', () => {
  assert.match(start, /startedAt = \$Process\.StartTime\.ToUniversalTime\(\)\.ToString\('o'\)/);
  assert.match(start, /function Get-RecordedProcess/);
  assert.match(start, /actualStart - \$expectedStart/);
  assert.match(stop, /function Get-RecordedProcess/);
  assert.match(stop, /Skipping stale process record/);
  assert.match(stop, /actualStart - \$expectedStart/);
});
