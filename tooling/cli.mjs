#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditExitCode, auditProject, formatAudit } from './audit.mjs';
import { loadProject, readJson } from './project-model.mjs';

const [command = 'help', ...rest] = process.argv.slice(2);
const targetArg = rest.find((arg) => !arg.startsWith('--')) ?? '.';
const jsonOutput = rest.includes('--json');
const strictAudit = rest.includes('--strict');
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

function resolveTarget(target) {
  return path.resolve(process.cwd(), target);
}

function doctor(target) {
  const project = loadProject(resolveTarget(target));
  if (project.errors.length) {
    for (const error of project.errors) console.error(`- ${error}`);
    return fail(`${project.errors.length} blocking project-model finding(s)`);
  }

  const { manifest } = project;
  pass(`${manifest.project.id} is structurally TSAL-aware`);
  console.log(`Project: ${manifest.project.name}`);
  console.log(`TSAL: ${manifest.tsal_version}`);
  console.log(`Manifest schema: ${manifest.schema_version}`);
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
    schema_version: '0.3',
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

  writeIfMissing(path.join(root, 'evidence', 'README.md'), '# Evidence\n\nStore durable TSAL evidence records for this project here.\n');
  writeIfMissing(
    path.join(root, 'docs', 'incidents', 'README.md'),
    '# Incidents\n\nStore durable incident records and promoted lessons for this project here.\n'
  );
  copyTemplateIfMissing('RUNBOOK.md', path.join(root, 'docs', 'RUNBOOK.md'));
  copyTemplateIfMissing('ARCHITECTURE.md', path.join(root, 'docs', 'ARCHITECTURE.md'));

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });

  pass(`initialized ${manifestPath}`);
  console.log('Next: set project.owner, add automation contract(s), add evidence as claims are proven, then run `tsal audit <project>`.');
}

function inspect(target) {
  const root = resolveTarget(target);
  const manifestPath = path.join(root, 'tsal.project.json');
  if (!fs.existsSync(manifestPath)) return fail(`missing ${manifestPath}`);
  const manifest = readJson(manifestPath);
  console.log(JSON.stringify({
    project: manifest.project,
    manifest_schema: manifest.schema_version,
    tsal_version: manifest.tsal_version,
    automations: manifest.automations,
    adapters: manifest.integration?.adapters ?? [],
    control_plane: manifest.integration?.control_plane ?? { enabled: false }
  }, null, 2));
}

function audit(target) {
  const report = auditProject(resolveTarget(target));
  console.log(jsonOutput ? JSON.stringify(report, null, 2) : formatAudit(report));
  process.exitCode = auditExitCode(report, strictAudit);
}

function help() {
  console.log(`TSAL local tooling\n\nUsage:\n  tsal init <project-directory>\n  tsal doctor <project-directory>\n  tsal inspect <project-directory>\n  tsal audit <project-directory> [--json] [--strict]\n\nAudit exit behavior:\n  default: nonzero only for BLOCKING conformance\n  --strict: nonzero unless conformance is PROVEN\n\nThe CLI is local-first. It does not require AI, a backend, or TOS.`);
}

switch (command) {
  case 'init': init(targetArg); break;
  case 'doctor': doctor(targetArg); break;
  case 'inspect': inspect(targetArg); break;
  case 'audit': audit(targetArg); break;
  case 'help':
  case '--help':
  case '-h': help(); break;
  default:
    fail(`unknown command: ${command}`);
    help();
}
