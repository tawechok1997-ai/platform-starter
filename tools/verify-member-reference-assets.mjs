#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(repositoryRoot, 'docs/member-reference-assets.manifest.json');
const inputDirectory = path.resolve(process.argv[2] ?? '.');
const jsonOutput = process.argv.includes('--json');

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const results = [];
  const hashes = new Map();

  for (const asset of manifest.assets) {
    const filePath = path.join(inputDirectory, asset.sourceFilename);
    const result = {
      role: asset.role,
      sourceFilename: asset.sourceFilename,
      filePath,
      exists: false,
      bytes: 0,
      pngSignature: false,
      sha256: null,
      expectedSha256: asset.sha256,
      checksumMatches: asset.sha256 === null,
      duplicateOf: null,
      valid: false,
      errors: [],
    };

    try {
      const fileStat = await stat(filePath);
      result.exists = fileStat.isFile();
      if (!result.exists) result.errors.push('Path exists but is not a regular file.');
    } catch {
      result.errors.push('File is missing.');
    }

    if (result.exists) {
      const buffer = await readFile(filePath);
      result.bytes = buffer.length;
      result.pngSignature = buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
      result.sha256 = sha256(buffer);
      result.checksumMatches = asset.sha256 === null || result.sha256 === asset.sha256;

      if (buffer.length < manifest.rules.minimumBytes) {
        result.errors.push(`File is smaller than ${manifest.rules.minimumBytes} bytes.`);
      }
      if (manifest.rules.requirePngSignature && !result.pngSignature) {
        result.errors.push('File does not have a valid PNG signature.');
      }
      if (!result.checksumMatches) {
        result.errors.push('SHA-256 does not match the manifest.');
      }

      const previous = hashes.get(result.sha256);
      if (manifest.rules.requireUniqueSha256 && previous) {
        result.duplicateOf = previous;
        result.errors.push(`Binary duplicates ${previous}.`);
      } else {
        hashes.set(result.sha256, asset.sourceFilename);
      }
    }

    result.valid = result.errors.length === 0;
    results.push(result);
  }

  const summary = {
    manifest: path.relative(repositoryRoot, manifestPath),
    inputDirectory,
    checked: results.length,
    valid: results.filter((result) => result.valid).length,
    invalid: results.filter((result) => !result.valid).length,
    ready: results.every((result) => result.valid),
    results,
  };

  if (jsonOutput) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } else {
    for (const result of results) {
      const state = result.valid ? 'PASS' : 'FAIL';
      console.log(`${state} ${result.role}: ${result.sourceFilename}`);
      if (result.sha256) console.log(`  sha256 ${result.sha256}`);
      for (const error of result.errors) console.log(`  - ${error}`);
    }
    console.log(`\n${summary.valid}/${summary.checked} reference assets passed.`);
  }

  if (!summary.ready) fail('Reference asset intake is not ready.');
}

main().catch((error) => {
  fail(error instanceof Error ? error.stack ?? error.message : String(error));
});
