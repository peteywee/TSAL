import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditProject } from '../tooling/audit.mjs';

function copyR0Example() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tsal-evidence-discovery-'));
  const project = path.join(root, 'project');
  fs.cpSync(path.resolve('examples/r0-readonly'), project, { recursive: true });
  return project;
}

test('audit ignores project-native JSON that does not identify itself as TSAL evidence', () => {
  const project = copyR0Example();
  const nativeEvidence = {
    generated_at: '2026-09-05T20:00:00Z',
    matrix: [{ input: 'eligible', local: true, remote: true }]
  };

  fs.writeFileSync(
    path.join(project, 'evidence', 'eligibility-parity-matrix.json'),
    `${JSON.stringify(nativeEvidence, null, 2)}\n`
  );

  const report = auditProject(project);
  assert.equal(report.result, 'proven');
  assert.equal(report.summary.blocking, 0);
  assert.equal(report.checks.some((item) => item.id === 'evidence.integrity'), false);
});

test('audit still blocks malformed JSON that identifies itself as TSAL evidence', () => {
  const project = copyR0Example();
  const malformedTsalEvidence = {
    schema_version: '9.9',
    evidence_id: 'malformed-tsal-evidence'
  };

  fs.writeFileSync(
    path.join(project, 'evidence', 'malformed-tsal-evidence.json'),
    `${JSON.stringify(malformedTsalEvidence, null, 2)}\n`
  );

  const report = auditProject(project);
  assert.equal(report.result, 'blocking');
  assert.ok(report.blocking_findings.some((finding) => /unsupported evidence schema_version/.test(finding)));
});
