#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const [, , command = 'help', targetArg = '.'] = process.argv;

function fail(message) {
  console.error(`TSAL: FAIL — ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`TSAL: PASS — ${message}`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function resolveTarget(target) {
  return path.resolve(process.cwd(), target);
}

function validateManifestShape(manifest) {
  const errors = [];
  if (manifest?.schema_version !== '0.2') errors.push('schema_version must be 0.2');
  if (typeof manifest?.tsal_version !== 'string' || !manifest.tsal_version.startsWith('0.2')) errors.push('tsal_version must target 0.2');
  for (const key of ['id', 'name', 'owner', 'kind']) {
    if (!manifest?.project?.[key]) errors.push(`project.${key} is required`);
  }
  if (!Array.isArray(manifest?.automations)) errors.push('automations must be an array');
  if (!Array.isArray(manifest?.integration?.adapters)) errors.push('integration.adapters must be an array');
  if (typeof manifest?.integration?.control_plane?.enabled !== 'boolean') errors.push('integration.control_plane.enabled must be boolean');
  return errors;
}

function doctor(target) {
  const root = resolveTarget(target);
  const manifestPath = path.join(root, 'tsal.project.json');
  if (!fs.existsSync(manifestPath)) return fail(`missing ${manifestPath}`);

  let manifest;
  try {
    manifest = readJson(manifestPath);
  } catch (error) {
    return fail(`cannot parse tsal.project.json: ${error.message}`);
  }

  const errors = validateManifestShape(manifest);
  for (const automation of manifest.automations ?? []) {
    if (!automation?.contract) {
      errors.push(`automation ${automation?.id ?? '<unknown>'} has no contract path`);
      continue;
    }
    const contractPath = path.resolve(root, automation.contract);
    if (!fs.existsSync(contractPath)) {
      errors.push(`automation ${automation.id} contract not found: ${automation.contract}`);
      continue;
    }
    try {
      readJson(contractPath);
    } catch (error) {
      errors.push(`automation ${automation.id} contract is invalid JSON: ${error.message}`);
    }
  }

  if (errors.length) {
    for (const error of errors) console.error(`- ${error}`);
    return fail(`${errors.length} blocking project-manifest finding(s)`);
  }

  pass(`${manifest.project.id} is structurally TSAL-aware`);
  console.log(`Project: ${manifest.project.name}`);
  console.log(`TSAL: ${manifest.tsal_version}`);
  console.log(`Automations: ${manifest.automations.length}`);
  console.log(`Control plane: ${manifest.integration.control_plane.enabled ? 'enabled' : 'disabled'}`);
}

function init(target) {
  const root = resolveTarget(target);
  fs.mkdirSync(root, { recursive: true });
  const manifestPath = path.join(root, 'tsal.project.json');
  if (fs.existsSync(manifestPath)) return fail(`${manifestPath} already exists`);

  const id = path.basename(root).toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  const manifest = {
    schema_version: '0.2',
    tsal_version: '0.2.0',
    project: {
      id,
      name: path.basename(root),
      owner: 'UNSET',
      kind: 'automation',
      repository: null,
      description: ''
    },
    automations: [],
    artifacts: {
      evidence_directory: 'evidence',
      incidents_directory: 'docs/incidents',
      runbook: 'docs/RUNBOOK.md',
      architecture: 'docs/ARCHITECTURE.md'
    },
    integration: {
      adapters: [],
      control_plane: {
        enabled: false,
        type: null,
        endpoint: null,
        project_key: null
      }
    },
    metadata: {}
  };

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
  fs.mkdirSync(path.join(root, 'evidence'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs', 'incidents'), { recursive: true });
  pass(`initialized ${manifestPath}`);
  console.log('Next: set project.owner, add automation contract(s), then run `tsal doctor <project>`');
}

function inspect(target) {
  const root = resolveTarget(target);
  const manifestPath = path.join(root, 'tsal.project.json');
  if (!fs.existsSync(manifestPath)) return fail(`missing ${manifestPath}`);
  const manifest = readJson(manifestPath);
  console.log(JSON.stringify({
    project: manifest.project,
    tsal_version: manifest.tsal_version,
    automations: manifest.automations,
    adapters: manifest.integration?.adapters ?? [],
    control_plane: manifest.integration?.control_plane ?? { enabled: false }
  }, null, 2));
}

function help() {
  console.log(`TSAL local tooling\n\nUsage:\n  tsal init <project-directory>\n  tsal doctor <project-directory>\n  tsal inspect <project-directory>\n\nThe CLI is intentionally local-first. It does not require AI, a backend, or TOS.`);
}

switch (command) {
  case 'init': init(targetArg); break;
  case 'doctor': doctor(targetArg); break;
  case 'inspect': inspect(targetArg); break;
  case 'help':
  case '--help':
  case '-h': help(); break;
  default:
    fail(`unknown command: ${command}`);
    help();
}
