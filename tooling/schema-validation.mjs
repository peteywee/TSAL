import fs from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

// Legacy snapshots retain the current schema IDs. Compile each without global ID registration.
const ajv = new Ajv2020({ strictTypes: false, addUsedSchema: false, allErrors: true, ownProperties: true });
addFormats(ajv);

function compile(file) {
  return ajv.compile(JSON.parse(fs.readFileSync(new URL(file, import.meta.url), 'utf8')));
}

const validators = {
  manifest: new Map([
    ['0.2', compile('../schemas/legacy/PROJECT-MANIFEST-0.2.schema.json')],
    ['0.3', compile('../schemas/PROJECT-MANIFEST.schema.json')]
  ]),
  contract: new Map([
    ['0.1', compile('../schemas/legacy/AUTOMATION-CONTRACT-0.1.schema.json')],
    ['0.2', compile('../AUTOMATION-CONTRACT.schema.json')]
  ]),
  evidence: new Map([
    ['0.2', compile('../schemas/legacy/EVIDENCE-0.2.schema.json')],
    ['0.3', compile('../schemas/EVIDENCE.schema.json')]
  ])
};

export function schemaErrors(kind, input, source) {
  const validate = validators[kind].get(input?.schema_version);
  if (!validate) return [`${source}: unsupported ${kind} schema_version: ${String(input?.schema_version)}`];
  if (validate(input)) return [];
  return validate.errors.map(({ instancePath, message, params }) =>
    `${source}${instancePath}: ${message}${params.additionalProperty ? ' (' + params.additionalProperty + ')' : ''}`);
}
