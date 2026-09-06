#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , command = 'help', targetArg = '.'] = process.argv;
const toolingDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(toolingDir, '..');
const TSAL_VERSION = fs.readFileSync(path.join(packageRoot, 'VERSION'), 'utf8').trim();

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

function canonicalRelativePathError(value) {
  if (typeof value !== 'string' || value.length === 0) return 'must be a non-empty relative path';
  if (value !== value.trim()) return 'must not contain leading or trailing whitespace';
  if (value.includes('\\')) return 'must use forward slashes';
  if (path.posix.isAbsolute(value)) return 'must be relative';
  if (value.endsWith('/')) return 'must not have a trailing slash';

  const segments = value.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    return 'must not contain empty, dot, or parent segments';
  }
  if (path.posix.normalize(value) !== value) return 'must be normalized';
  return null;
}

function resolveDeclaredPath(root, value) {
  return path.resolve(root, ...value.split('/'));
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

function validateDeclaredArtifacts(root, manifest, errors) {
  const specs = [
    ['evidence_directory', 'directory'],
    ['incidents_directory', 'directory'],
    ['runbook', 'file'],
    ['architecture', 'file']
  ];

  for (const [key, expectedType] of specs) {
    const value = manifest?.artifacts?.[key];
    if (value === undefined) continue;

    const pathError = canonicalRelativePathError(value);
    if (pathError) {
      errors.push(`artifacts.${key} ${pathError}: ${String(value)}`);
      continue;
    }

    const artifactPath = resolveDeclaredPath(root, value);
    if (!fs.existsSync(artifactPath)) {
      errors.push(`declared artifact not found: artifacts.${key} -> ${value}`);
      continue;
    }

    const stat = fs.statSync(artifactPath);
    if (expectedType === 'directory' && !stat.isDirectory()) {
      errors.push(`declared artifact must be a directory: artifacts.${key} -> ${value}`);
    }
    if (expectedType === 'file' && !stat.isFile()) {
      errors.push(`declared artifact must be a file: artifacts.${key} -> ${value}`);
    }
  }
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
  validateDeclaredArtifacts(root, manifest, errors);

  if (Array.isArray(manifest.automations)) {
    for (const automation of manifest.automations) {
      if (!automation?.contract) {
        errors.push(`automation ${automation?.id ?? '<unknown>'} has no contract path`);
        continue;
      }

      const pathError = canonicalRelativePathError(automation.contract);
      if (pathError) {
        errors.push(`automation ${automation?.id ?? '<unknown>'} contract path ${pathError}: ${automation.contract}`);
        continue;
      }

      const contractPath = resolveDeclaredPath(root, automation.contract);
      if (!fs.existsSync(contractPath)) {
        errors.push(`automation ${automation.id} contract not found: ${automation.contract}`);
        continue;
      }
      if (!fs.statSync(contractPath).isFile()) {
        errors.push(`automation ${automation.id} contract is not a file: ${automation.contract}`);
        continue;
      }
      try {
        readJson(contractPath);
      } catch (error) {
        errors.push(`automation ${automation.id} contract is invalid JSON: ${error.message}`);
      }
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

function writeIfMissing(file, content) {
  if (fs.existsSync(file)) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, { flag: 'wx' });
}

function copyTemplateIfMissing(templateName, destination) {
  const source = path.join(packageRoot, 'templates', templateName);
  writeIfMissing(destination, fs.readFileSync(source, 'utf8'));
}

function init(target) {
  const root = resolveTarget(target);
  fs.mkdirSync(root, { recursive: true });
  const manifestPath = path.join(root, 'tsal.project.json');
  if (fs.existsSync(manifestPath)) return fail(`${manifestPath} already exists`);

  const id = path.basename(root).toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  const manifest = {
    schema_version: '0.2',
    tsal_version: TSAL_VERSION,
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

  writeIfMissing(path.join(root, 'evidence', 'README.md'), '# Evidence\n\nStore durable TSAL evidence records for this project here.\n');
  writeIfMissing(
    path.join(root, 'docs', 'incidents', 'README.md'),
    '# Incidents\n\nStore durable incident records and promoted lessons for this project here.\n'
  );
  copyTemplateIfMissing('RUNBOOK.md', path.join(root, 'docs', 'RUNBOOK.md'));
  copyTemplateIfMissing('ARCHITECTURE.md', path.join(root, 'docs', 'ARCHITECTURE.md'));

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
