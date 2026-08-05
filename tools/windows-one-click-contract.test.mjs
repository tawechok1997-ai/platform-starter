import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const setupCmd = read('Setup-Windows.cmd');
const startCmd = read('Start-Windows.cmd');
const stopCmd = read('Stop-Windows.cmd');
const verifyCmd = read('Verify-Windows.cmd');
const setup = read('scripts/windows/setup.ps1');
const start = read('scripts/windows/start.ps1');
const stop = read('scripts/windows/stop.ps1');
const verify = read('scripts/windows/verify.ps1');
const compose = read('compose.windows.yml');
const envExample = read('.env.example');
const docs = read('docs/windows-one-click.md');
const gitignore = read('.gitignore');


test('root launchers delegate to maintained PowerShell owners', () => {
  assert.match(setupCmd, /scripts\\windows\\setup\.ps1/);
  assert.match(startCmd, /scripts\\windows\\start\.ps1/);
  assert.match(stopCmd, /scripts\\windows\\stop\.ps1/);
  assert.match(verifyCmd, /scripts\\windows\\verify\.ps1/);
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


test('every generated Windows environment replacement exists exactly once in the template', () => {
  const replacements = setup.match(/\$replacements = @\{([\s\S]*?)\n  \}/)?.[1] ?? '';
  const replacementKeys = [...replacements.matchAll(/^\s*'([A-Z0-9_]+)'\s*=/gm)].map((match) => match[1]);
  const templateKeys = [...envExample.matchAll(/^([A-Z_][A-Z0-9_]*)=/gm)].map((match) => match[1]);

  assert.ok(replacementKeys.length > 0, 'setup replacement map must contain environment keys');
  assert.equal(new Set(templateKeys).size, templateKeys.length, '.env.example must not contain duplicate keys');

  for (const key of replacementKeys) {
    assert.equal(
      templateKeys.filter((templateKey) => templateKey === key).length,
      1,
      `${key} must exist exactly once in .env.example so setup can write its generated value`,
    );
  }
});


test('Windows setup isolates local credentials from maintained environments', () => {
  assert.match(setup, /\.env\.windows\.local/);
  assert.match(setup, /New-HexSecret/);
  assert.match(setup, /127\.0\.0\.1:55432/);
  assert.match(setup, /127\.0\.0\.1:56379/);
  assert.match(setup, /preserving local secrets and database credentials/);
  assert.match(setup, /'DEFAULT_ADMIN_SECRET'\s*=\s*\(New-HexSecret\)/);
  assert.match(setup, /'BOOTSTRAP_ADMIN_PASSWORD'\s*=\s*\(New-HexSecret\)/);
  assert.match(envExample, /^BOOTSTRAP_ADMIN_PASSWORD=set_in_local_env$/m);
  assert.match(gitignore, /^\.env\.windows\.local$/m);
  assert.match(gitignore, /^\.local\/$/m);
});


test('local Admin credentials remain discoverable without writing the secret to setup output', () => {
  assert.match(setupCmd, /Local Admin credentials are stored in \.env\.windows\.local/);
  assert.match(setupCmd, /docs\\windows-one-click\.md/);
  assert.doesNotMatch(setupCmd, /BOOTSTRAP_ADMIN_PASSWORD=/);
  assert.match(docs, /## First local Admin sign-in/);
  assert.match(docs, /BOOTSTRAP_ADMIN_USERNAME/);
  assert.match(docs, /BOOTSTRAP_ADMIN_EMAIL/);
  assert.match(docs, /Select-String[\s\S]*BOOTSTRAP_ADMIN_PASSWORD=/);
  assert.match(docs, /Do not paste the generated password into chat, tickets, logs, screenshots/);
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


test('native process stop failures surface and partial startup is cleaned', () => {
  assert.match(start, /function Stop-ProcessTree/);
  assert.match(stop, /function Stop-ProcessTree/);
  assert.match(start, /taskkill exited with code/);
  assert.match(stop, /taskkill exited with code/);
  assert.match(start, /\$LaunchedProcesses \+= \$apiProcess/);
  assert.match(start, /\$LaunchedProcesses \+= \$memberProcess/);
  assert.match(start, /\$LaunchedProcesses \+= \$adminProcess/);
  assert.match(start, /Cleaning up partially started application terminals/);
  assert.match(start, /Remove-Item -LiteralPath \$ProcessFile/);
  assert.match(stop, /Remove-Item -LiteralPath \$ProcessFile[\s\S]*Stopping PostgreSQL and Redis containers/s);
});


test('recorded terminals are reused only while every application remains healthy', () => {
  assert.match(start, /function Test-HttpEndpoint/);
  assert.match(start, /\$recordedStackReady = Test-AllRecordedProcessesAlive/);
  assert.match(start, /Test-HttpEndpoint -Url 'http:\/\/localhost:4000\/health'/);
  assert.match(start, /Test-HttpEndpoint -Url 'http:\/\/localhost:3000'/);
  assert.match(start, /Test-HttpEndpoint -Url 'http:\/\/localhost:3001'/);
  assert.match(start, /already running and healthy/);
  assert.match(start, /else \{[\s\S]*Stop-RecordedProcesses[\s\S]*Opening application terminals/s);
});


test('clean-machine verifier checks the complete local stack and writes redacted evidence', () => {
  assert.match(verifyCmd, /windows-clean-machine-verification\.json/);
  assert.match(verify, /Windows 10\|Windows 11/);
  assert.match(verify, /wsl\.exe.*--status/s);
  assert.match(verify, /Node\.js 22/);
  assert.match(verify, /pnpm 11\.18\.0/);
  assert.match(verify, /Docker engine readiness/);
  assert.match(verify, /compose.*config.*--quiet/s);
  assert.match(verify, /pg_isready/);
  assert.match(verify, /redis-cli.*ping/s);
  assert.match(verify, /prisma.*migrate.*status/s);
  assert.match(verify, /localhost:4000\/health/);
  assert.match(verify, /localhost:3000/);
  assert.match(verify, /localhost:3001/);
  assert.match(verify, /windows-clean-machine-verification\.json/);
  assert.match(verify, /No secrets are written to the evidence report/);
  assert.doesNotMatch(verify, /checks\s*=\s*\$environmentValues/);
  assert.doesNotMatch(verify, /detail\s*=\s*\$safeValue/);
});
