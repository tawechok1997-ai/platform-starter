import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const packageDir = fileURLToPath(new URL('..', import.meta.url));
const args = [
  '--import',
  'tsx',
  '--test',
  'src/**/*.spec.ts',
  'app/**/*.spec.ts',
];

const child = spawn(process.execPath, args, {
  cwd: packageDir,
  env: process.env,
  stdio: ['inherit', 'pipe', 'pipe'],
});

let stdout = '';
let stderr = '';

child.stdout.setEncoding('utf8');
child.stderr.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  stdout += chunk;
});
child.stderr.on('data', (chunk) => {
  stderr += chunk;
});

function failureSnippets(tapOutput) {
  const lines = tapOutput.split(/\r?\n/);
  const indexes = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (/^\s*not ok \d+ - /.test(lines[index])) indexes.push(index);
  }

  if (indexes.length === 0) return '';

  const snippets = indexes.map((start, failureIndex) => {
    const nextFailure = indexes[failureIndex + 1] ?? lines.length;
    const end = Math.min(nextFailure, start + 70);
    return lines.slice(start, end).join('\n').trimEnd();
  });

  return snippets.join('\n\n');
}

child.on('error', (error) => {
  console.error(`Unable to start web-member tests: ${error.message}`);
  process.exitCode = 1;
});

child.on('close', (code, signal) => {
  if (code === 0) {
    process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    return;
  }

  const failures = failureSnippets(stdout);
  console.error('Web Member tests failed. Focused TAP diagnostics follow.');
  if (failures) {
    process.stdout.write(`${failures}\n`);
  } else {
    const tail = stdout.split(/\r?\n/).slice(-120).join('\n');
    process.stdout.write(`${tail}\n`);
  }
  if (stderr) process.stderr.write(stderr);

  const summary = stdout.split(/\r?\n/).slice(-16).join('\n').trim();
  if (summary) {
    console.error('\nWeb Member test summary:');
    console.error(summary);
  }
  if (signal) console.error(`Web Member test process ended by signal ${signal}.`);
  process.exitCode = typeof code === 'number' && code !== 0 ? code : 1;
});
