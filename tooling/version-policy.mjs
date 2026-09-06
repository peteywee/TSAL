#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const VERSION_SURFACES = new Set(['VERSION', 'package.json', 'tsal.project.json']);
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export function getVersionState(root = process.cwd()) {
  const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'tsal.project.json'), 'utf8'));
  return {
    version,
    packageVersion: packageJson.version,
    manifestVersion: manifest.tsal_version
  };
}

export function validateVersionSync(state) {
  const failures = [];
  if (!SEMVER.test(state.version)) failures.push(`VERSION is not valid semantic versioning: ${state.version}`);
  if (state.packageVersion !== state.version) {
    failures.push(`package.json version ${state.packageVersion} does not match VERSION ${state.version}`);
  }
  if (state.manifestVersion !== state.version) {
    failures.push(`tsal.project.json tsal_version ${state.manifestVersion} does not match VERSION ${state.version}`);
  }
  return failures;
}

export function compareSemver(a, b) {
  const parse = (value) => {
    const match = SEMVER.exec(value);
    if (!match) throw new Error(`invalid semantic version: ${value}`);
    return match.slice(1, 4).map(Number);
  };
  const av = parse(a);
  const bv = parse(b);
  for (let index = 0; index < 3; index += 1) {
    if (av[index] !== bv[index]) return av[index] > bv[index] ? 1 : -1;
  }
  return 0;
}

export function requiresVersionBump(changedFiles) {
  return changedFiles.some((file) => !VERSION_SURFACES.has(file));
}

function git(root, args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed`);
  }
  return result.stdout.trim();
}

function checkSync(root) {
  const state = getVersionState(root);
  const failures = validateVersionSync(state);
  if (failures.length) {
    console.error('TSAL VERSION POLICY: FAIL');
    for (const failure of failures) console.error(`- ${failure}`);
    return 1;
  }
  console.log(`TSAL VERSION POLICY: PASS — ${state.version}`);
  return 0;
}

function checkPullRequest(root, baseRef) {
  const syncStatus = checkSync(root);
  if (syncStatus !== 0) return syncStatus;
  if (!baseRef) {
    console.error('TSAL VERSION POLICY: FAIL');
    console.error('- base ref is required for pull-request version enforcement');
    return 1;
  }

  const changedFiles = git(root, ['diff', '--name-only', `${baseRef}...HEAD`])
    .split('\n')
    .filter(Boolean);

  if (!requiresVersionBump(changedFiles)) {
    console.log('TSAL VERSION BUMP: NOT REQUIRED — only version surfaces changed');
    return 0;
  }

  const baseVersion = git(root, ['show', `${baseRef}:VERSION`]).trim();
  const currentVersion = getVersionState(root).version;

  if (currentVersion === baseVersion) {
    console.error('TSAL VERSION BUMP: FAIL');
    console.error(`- repository content changed but VERSION remained ${currentVersion}`);
    return 1;
  }

  if (compareSemver(currentVersion, baseVersion) <= 0) {
    console.error('TSAL VERSION BUMP: FAIL');
    console.error(`- VERSION must increase from ${baseVersion}; candidate is ${currentVersion}`);
    return 1;
  }

  console.log(`TSAL VERSION BUMP: PASS — ${baseVersion} -> ${currentVersion}`);
  return 0;
}

function main() {
  const [, , mode = 'sync', baseRef] = process.argv;
  const root = process.cwd();
  if (mode === 'sync') return checkSync(root);
  if (mode === 'pr') return checkPullRequest(root, baseRef);
  console.error(`TSAL VERSION POLICY: FAIL — unknown mode ${mode}`);
  return 1;
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) process.exitCode = main();
