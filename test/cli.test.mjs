import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const cli = path.resolve('tooling/cli.mjs');

function run(args) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
}

test('init creates a local TSAL project socket and doctor accepts it', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tsal-init-'));
  const project = path.join(root, 'sample-automation');

  const initialized = run(['init', project]);
  assert.equal(initialized.status, 0, initialized.stderr);
  assert.equal(fs.existsSync(path.join(project, 'tsal.project.json')), true);

  const manifest = JSON.parse(fs.readFileSync(path.join(project, 'tsal.project.json'), 'utf8'));
  manifest.project.owner = 'test-owner';
  fs.writeFileSync(path.join(project, 'tsal.project.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const doctor = run(['doctor', project]);
  assert.equal(doctor.status, 0, doctor.stderr);
  assert.match(doctor.stdout, /TSAL: PASS/);
});

test('doctor fails when a declared automation contract is missing', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tsal-doctor-'));
  const project = path.join(root, 'broken-automation');
  assert.equal(run(['init', project]).status, 0);

  const manifestPath = path.join(project, 'tsal.project.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.project.owner = 'test-owner';
  manifest.automations.push({ id: 'broken.publisher', contract: 'automation.contract.json', enabled: true, risk: 'R3' });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const doctor = run(['doctor', project]);
  assert.notEqual(doctor.status, 0);
  assert.match(doctor.stderr, /contract not found/);
});
