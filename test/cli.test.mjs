import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const cli = path.resolve('tooling/cli.mjs');
const canonicalVersion = fs.readFileSync(path.resolve('VERSION'), 'utf8').trim();

function run(args) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
}

function initializeProject(prefix = 'tsal-init-') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const project = path.join(root, 'sample-automation');
  const initialized = run(['init', project]);
  assert.equal(initialized.status, 0, initialized.stderr);

  const manifestPath = path.join(project, 'tsal.project.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.project.owner = 'test-owner';
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { project, manifestPath, manifest };
}

test('init materializes every declared project artifact and doctor accepts it', () => {
  const { project, manifest } = initializeProject();

  assert.equal(manifest.tsal_version, canonicalVersion);

  const expectedDirectories = [
    manifest.artifacts.evidence_directory,
    manifest.artifacts.incidents_directory
  ];
  for (const relative of expectedDirectories) {
    const absolute = path.join(project, ...relative.split('/'));
    assert.equal(fs.statSync(absolute).isDirectory(), true, `${relative} should be a directory`);
    assert.equal(fs.existsSync(path.join(absolute, 'README.md')), true, `${relative} should be Git-trackable`);
  }

  for (const relative of [manifest.artifacts.runbook, manifest.artifacts.architecture]) {
    const absolute = path.join(project, ...relative.split('/'));
    assert.equal(fs.statSync(absolute).isFile(), true, `${relative} should be a file`);
  }

  const doctor = run(['doctor', project]);
  assert.equal(doctor.status, 0, doctor.stderr);
  assert.match(doctor.stdout, /TSAL: PASS/);
});

test('doctor fails when a declared automation contract is missing', () => {
  const { project, manifestPath, manifest } = initializeProject('tsal-contract-');
  manifest.automations.push({ id: 'broken.publisher', contract: 'automation.contract.json', enabled: true, risk: 'R3' });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const doctor = run(['doctor', project]);
  assert.notEqual(doctor.status, 0);
  assert.match(doctor.stderr, /contract not found/);
});

test('doctor fails when a declared artifact path does not exist', () => {
  const { project } = initializeProject('tsal-artifact-');
  fs.rmSync(path.join(project, 'docs', 'RUNBOOK.md'));

  const doctor = run(['doctor', project]);
  assert.notEqual(doctor.status, 0);
  assert.match(doctor.stderr, /declared artifact not found: artifacts\.runbook -> docs\/RUNBOOK\.md/);
});

test('doctor fails when a declared artifact path is not canonical', () => {
  const { project, manifestPath, manifest } = initializeProject('tsal-path-');
  manifest.artifacts.incidents_directory = 'docs/incidents/';
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const doctor = run(['doctor', project]);
  assert.notEqual(doctor.status, 0);
  assert.match(doctor.stderr, /artifacts\.incidents_directory must not have a trailing slash/);
});

test('doctor fails when an artifact declares the wrong filesystem type', () => {
  const { project, manifestPath, manifest } = initializeProject('tsal-type-');
  manifest.artifacts.runbook = 'docs/incidents';
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const doctor = run(['doctor', project]);
  assert.notEqual(doctor.status, 0);
  assert.match(doctor.stderr, /declared artifact must be a file: artifacts\.runbook -> docs\/incidents/);
});
