import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compareSemver,
  getVersionState,
  requiresVersionBump,
  validateVersionSync
} from '../tooling/version-policy.mjs';

test('canonical TSAL version surfaces are synchronized', () => {
  const state = getVersionState();
  assert.deepEqual(validateVersionSync(state), []);
  assert.match(state.version, /^\d+\.\d+\.\d+(?:[-+].*)?$/);
});

test('version sync detects mismatched package and manifest versions', () => {
  const failures = validateVersionSync({
    version: '0.2.1',
    packageVersion: '0.2.0',
    manifestVersion: '0.3.0'
  });

  assert.equal(failures.length, 2);
  assert.match(failures[0], /package\.json version 0\.2\.0 does not match VERSION 0\.2\.1/);
  assert.match(failures[1], /tsal\.project\.json tsal_version 0\.3\.0 does not match VERSION 0\.2\.1/);
});

test('repository content changes require a version bump', () => {
  assert.equal(requiresVersionBump(['tooling/cli.mjs']), true);
  assert.equal(requiresVersionBump(['README.md', 'VERSION']), true);
  assert.equal(requiresVersionBump(['VERSION', 'package.json', 'tsal.project.json']), false);
});

test('semantic version comparison rejects non-increasing candidates', () => {
  assert.equal(compareSemver('0.2.1', '0.2.0'), 1);
  assert.equal(compareSemver('0.2.1', '0.2.1'), 0);
  assert.equal(compareSemver('0.2.0', '0.2.1'), -1);
});
