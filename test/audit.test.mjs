import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { auditExitCode, auditProject } from '../tooling/audit.mjs';

const cli = path.resolve('tooling/cli.mjs');

function writeText(file, content = '') {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function makeProject({ manifestSchema = '0.3', tsalVersion = '0.3.0', contractSchema = '0.2', risk = 'R3' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tsal-audit-'));
  writeText(path.join(root, 'docs', 'RUNBOOK.md'), '# Runbook\n');
  writeText(path.join(root, 'docs', 'ARCHITECTURE.md'), '# Architecture\n');
  writeText(path.join(root, 'docs', 'incidents', 'README.md'), '# Incidents\n');
  writeText(path.join(root, 'evidence', 'README.md'), '# Evidence\n');

  const manifest = {
    schema_version: manifestSchema,
    tsal_version: tsalVersion,
    project: { id: 'test.r3', name: 'Test R3', owner: 'test-owner', kind: 'automation', repository: null, description: '' },
    automations: [{ id: 'test.publisher', contract: 'automation.contract.json', enabled: true, risk }],
    artifacts: {
      evidence_directory: 'evidence',
      incidents_directory: 'docs/incidents',
      runbook: 'docs/RUNBOOK.md',
      architecture: 'docs/ARCHITECTURE.md'
    },
    integration: { adapters: [], control_plane: { enabled: false, type: null, endpoint: null, project_key: null } },
    metadata: {}
  };
  writeText(path.join(root, 'tsal.project.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const retry = contractSchema === '0.1'
    ? {
        strategy: 'do not retry ambiguous create',
        maximum_attempts: 0,
        retryable_conditions: [],
        non_retryable_conditions: ['ambiguous outcome']
      }
    : {
        dispatch: {
          strategy: 'no immediate external retry',
          maximum_retry_attempts: 0,
          retryable_conditions: [],
          non_retryable_conditions: ['ambiguous outcome']
        },
        scheduler_reevaluation: {
          allowed: true,
          condition: 'Only after prior outcome is conclusively safe.'
        },
        ambiguous_outcome: {
          automatic_retry_allowed: false,
          requires_reconciliation: true
        }
      };

  const contract = {
    schema_version: contractSchema,
    automation: { id: 'test.publisher', name: 'Test Publisher', version: '1', owner: 'test-owner' },
    goal: { outcome: 'Publish one item.', success_condition: 'At most once.', correct_non_execution: 'Do nothing when unsafe.' },
    trigger: { type: 'schedule', description: 'Periodic.' },
    source_of_truth: { description: 'Queue', location: 'queue.json', owner: 'test-owner' },
    work_item: { definition: 'One item', identity_key: 'id', maximum_per_execution: 1 },
    risk: { class: risk, rationale: 'External public side effect.' },
    authority: {
      executor: 'worker',
      production_authority: 'explicit authority',
      concurrency_model: 'coordinated_multi',
      coordination_mechanism: 'lease and fencing',
      revocation_mechanism: 'disable authority'
    },
    side_effects: [{ system: 'remote', operation: 'create', reversible: false, ambiguity_possible: true }],
    state: { ledger: 'durable', durable: true, states: ['ready', 'posted'], write_safety: 'fenced', intent_recorded_before_side_effect: true },
    ambiguity: {
      possible: true,
      detection: 'remote result may be unknown',
      on_unknown: 'stop',
      reconciliation: 'inspect remote truth',
      ...(contractSchema === '0.1' ? { automatic_retry_allowed_when_unknown: false } : {})
    },
    retry,
    verification: { preflight: 'check', dry_run: 'simulate', postcondition: 'compare', runtime_health: 'healthy', evidence: 'records' },
    recovery: { procedure: 'reconcile and resume', fail_closed_conditions: ['unknown'], resume_gate: 'healthy' },
    owner_reserved_actions: ['resolve ambiguity']
  };
  writeText(path.join(root, 'automation.contract.json'), `${JSON.stringify(contract, null, 2)}\n`);
  return root;
}

test('R0 reference example is strictly PROVEN', () => {
  const report = auditProject(path.resolve('examples/r0-readonly'));
  assert.equal(report.result, 'proven');
  assert.equal(auditExitCode(report, true), 0);

  const cliResult = spawnSync(process.execPath, [cli, 'audit', 'examples/r0-readonly', '--strict'], { encoding: 'utf8' });
  assert.equal(cliResult.status, 0, cliResult.stderr);
  assert.match(cliResult.stdout, /CONFORMANCE: PROVEN/);
});

test('legacy R3 contract remains auditable but cannot be falsely promoted to PROVEN', () => {
  const root = makeProject({ manifestSchema: '0.2', tsalVersion: '0.2.0', contractSchema: '0.1' });
  const report = auditProject(root);

  assert.equal(report.result, 'partial');
  assert.equal(report.summary.blocking, 0);
  assert.ok(report.summary.unproven > 0);
  assert.ok(report.checks.some((item) => item.id === 'test.publisher.retry.separated' && item.result === 'partial'));
  assert.equal(auditExitCode(report, false), 0);
  assert.equal(auditExitCode(report, true), 2);
});

test('latest qualifying FAIL evidence is BLOCKING', () => {
  const root = makeProject();
  const evidence = {
    schema_version: '0.3',
    evidence_id: 'ev-authority-fail',
    project_id: 'test.r3',
    automation_id: 'test.publisher',
    tsal_version: '0.3.0',
    candidate: null,
    produced_at: '2026-09-05T20:00:00Z',
    valid_until: null,
    claim_id: 'test.publisher.authority.enforced',
    claim: 'Execution authority is enforced.',
    result: 'fail',
    evidence_class: 'candidate',
    evidence_type: 'test',
    details: {},
    provenance: { producer: 'test', source: 'negative test', run_id: null, actor: null }
  };
  writeText(path.join(root, 'evidence', 'authority.json'), `${JSON.stringify(evidence, null, 2)}\n`);

  const report = auditProject(root);
  assert.equal(report.result, 'blocking');
  assert.ok(report.checks.some((item) => item.id === 'test.publisher.authority.enforced' && item.result === 'blocking'));
  assert.equal(auditExitCode(report, false), 1);
});
