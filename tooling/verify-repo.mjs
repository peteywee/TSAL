import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'README.md',
  'CHANGELOG.md',
  'VERSION',
  'package.json',
  'AUTOMATION-LIFECYCLE.md',
  'AUTOMATION-CONTRACT.schema.json',
  'FAILURE-TEST-MATRIX.md',
  'docs/ARCHITECTURE.md',
  'docs/INTEGRATION-MODEL.md',
  'docs/CONFORMANCE-MODEL.md',
  'docs/EXTERNAL-STATE-PRESERVATION.md',
  'docs/RETRY-MODEL.md',
  'docs/VERSIONING.md',
  'docs/incidents/README.md',
  'evidence/README.md',
  'interfaces/ADAPTER-CONTRACT.md',
  'interfaces/CONTROL-PLANE-PROTOCOL.md',
  'schemas/PROJECT-MANIFEST.schema.json',
  'schemas/EVIDENCE.schema.json',
  'schemas/INCIDENT.schema.json',
  'schemas/CONFORMANCE-REPORT.schema.json',
  'schemas/legacy/README.md',
  'schemas/legacy/AUTOMATION-CONTRACT-0.1.schema.json',
  'schemas/legacy/PROJECT-MANIFEST-0.2.schema.json',
  'schemas/legacy/EVIDENCE-0.2.schema.json',
  'schemas/legacy/CONFORMANCE-REPORT-0.2.schema.json',
  'templates/ARCHITECTURE.md',
  'templates/RUNBOOK.md',
  'tooling/audit.mjs',
  'tooling/cli.mjs',
  'tooling/project-model.mjs',
  'tooling/version-policy.mjs',
  'examples/r0-readonly/automation.contract.json',
  'examples/r0-readonly/tsal.project.json',
  'test/audit.test.mjs',
  'tsal.project.json'
];

const failures = [];
for (const relative of required) {
  if (!fs.existsSync(path.join(root, relative))) failures.push(`missing ${relative}`);
}

for (const relative of required.filter((p) => p.endsWith('.json'))) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) continue;
  try {
    JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    failures.push(`invalid JSON ${relative}: ${error.message}`);
  }
}

if (failures.length) {
  console.error('TSAL REPOSITORY VERIFY: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('TSAL REPOSITORY VERIFY: PASS');
