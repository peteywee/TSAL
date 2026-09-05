import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'README.md',
  'VERSION',
  'AUTOMATION-LIFECYCLE.md',
  'AUTOMATION-CONTRACT.schema.json',
  'FAILURE-TEST-MATRIX.md',
  'docs/ARCHITECTURE.md',
  'docs/INTEGRATION-MODEL.md',
  'interfaces/ADAPTER-CONTRACT.md',
  'interfaces/CONTROL-PLANE-PROTOCOL.md',
  'schemas/PROJECT-MANIFEST.schema.json',
  'schemas/EVIDENCE.schema.json',
  'schemas/INCIDENT.schema.json',
  'schemas/CONFORMANCE-REPORT.schema.json',
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
