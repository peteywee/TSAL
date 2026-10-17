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

function writeEvidence(root, { suffix, evidenceClass, result = 'pass', producedAt = '2026-09-05T20:00:00Z', validUntil = null, candidate = null }) {
  const evidenceId = `ev-${suffix.replace(/\./g, '-')}-${evidenceClass}`;
  const record = {
    schema_version: '0.3',
    evidence_id: evidenceId,
    project_id: 'test.r3',
    automation_id: 'test.publisher',
    tsal_version: '0.3.0',
    candidate,
    produced_at: producedAt,
    valid_until: validUntil,
    claim_id: `test.publisher.${suffix}`,
    claim: `Proof for ${suffix}`,
    result,
    evidence_class: evidenceClass,
    evidence_type: evidenceClass === 'runtime' ? 'runtime_observation' : 'test',
    details: {},
    provenance: { producer: 'test', source: 'audit regression', run_id: null, actor: null }
  };
  writeText(path.join(root, 'evidence', `${evidenceId}.json`), `${JSON.stringify(record, null, 2)}\n`);
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

test('current R3 contract becomes PROVEN only with qualifying evidence at each required layer', () => {
  const root = makeProject();
  writeEvidence(root, { suffix: 'authority.enforced', evidenceClass: 'candidate' });
  writeEvidence(root, { suffix: 'retry.bounded', evidenceClass: 'implementation' });
  writeEvidence(root, { suffix: 'ambiguity.fail_closed', evidenceClass: 'candidate' });
  writeEvidence(root, { suffix: 'recovery.verified', evidenceClass: 'reconciliation' });
  writeEvidence(root, { suffix: 'runtime.safe', evidenceClass: 'runtime', validUntil: '2099-01-01T00:00:00Z' });
  writeEvidence(root, { suffix: 'deployment.authority', evidenceClass: 'deployment' });

  const report = auditProject(root);
  assert.equal(report.result, 'proven');
  assert.equal(report.summary.blocking, 0);
  assert.equal(report.summary.unproven, 0);
  assert.equal(auditExitCode(report, true), 0);
});

test('latest qualifying FAIL evidence is BLOCKING', () => {
  const root = makeProject();
  writeEvidence(root, { suffix: 'authority.enforced', evidenceClass: 'candidate', result: 'fail' });

  const report = auditProject(root);
  assert.equal(report.result, 'blocking');
  assert.ok(report.checks.some((item) => item.id === 'test.publisher.authority.enforced' && item.result === 'blocking'));
  assert.equal(auditExitCode(report, false), 1);
});

test('expired runtime evidence does not prove current runtime safety', () => {
  const root = makeProject();
  writeEvidence(root, { suffix: 'authority.enforced', evidenceClass: 'candidate' });
  writeEvidence(root, { suffix: 'retry.bounded', evidenceClass: 'candidate' });
  writeEvidence(root, { suffix: 'ambiguity.fail_closed', evidenceClass: 'candidate' });
  writeEvidence(root, { suffix: 'recovery.verified', evidenceClass: 'candidate' });
  writeEvidence(root, { suffix: 'deployment.authority', evidenceClass: 'deployment' });
  writeEvidence(root, { suffix: 'runtime.safe', evidenceClass: 'runtime', producedAt: '2019-12-31T00:00:00Z', validUntil: '2020-01-01T00:00:00Z' });

  const report = auditProject(root);
  assert.equal(report.result, 'partial');
  assert.ok(report.checks.some((item) => item.id === 'test.publisher.runtime.safe' && item.result === 'unproven'));
});

test('malformed declared evidence paths fail closed instead of being traversed', () => {
  const root = makeProject();
  const manifestPath = path.join(root, 'tsal.project.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.artifacts.evidence_directory = '../outside';
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const report = auditProject(root);
  assert.equal(report.result, 'blocking');
  assert.ok(report.blocking_findings.some((finding) => finding.includes('parent segments')));
});

function completeEvidence(root, candidate, producedAt = '2026-09-05T20:00:00Z') {
  for (const [suffix, evidenceClass] of [
    ['authority.enforced', 'candidate'], ['retry.bounded', 'implementation'],
    ['ambiguity.fail_closed', 'candidate'], ['recovery.verified', 'reconciliation'],
    ['runtime.safe', 'runtime'], ['deployment.authority', 'deployment']
  ]) writeEvidence(root, { suffix, evidenceClass, candidate, producedAt });
}

test('F6: future observations cannot produce PROVEN or strict success', () => {
  const root = makeProject();
  completeEvidence(root, { type: 'git_commit', id: 'old', immutable: true }, '2099-01-01T00:00:00Z');
  const report = auditProject(root);
  assert.equal(report.result, 'blocking');
  assert.equal(auditExitCode(report, true), 1);
  assert.ok(report.blocking_findings.some(f => /in the future/.test(f)));
});

test('an explicit matching immutable candidate supports bound acceptance', () => {
  const root = makeProject();
  const candidate = { type: 'git_commit', id: 'exact-candidate', immutable: true };
  completeEvidence(root, candidate);
  const report = auditProject(root, { candidate });
  assert.equal(report.result, 'proven');
  assert.equal(report.candidate, candidate.id); // Preserve conformance schema string/null.
  assert.equal(auditExitCode(report, true), 0);
  assert.equal(report.warnings.some(w => /No candidate target/.test(w)), false);
});

test('wrong, missing, non-immutable and wrong-type candidate evidence cannot prove a requested target', () => {
  const expected = { type: 'git_commit', id: 'exact-candidate', immutable: true };
  for (const candidate of [null, { ...expected, id: 'old' }, { ...expected, immutable: false }, { ...expected, type: 'other' }]) {
    const root = makeProject(); completeEvidence(root, candidate);
    const report = auditProject(root, { candidate: expected });
    assert.notEqual(report.result, 'proven');
    assert.notEqual(auditExitCode(report, true), 0);
  }
});

test('unbound audits disclose the absence of exact-candidate acceptance', () => {
  const report = auditProject(makeProject());
  assert.equal(report.candidate, null);
  assert.ok(report.warnings.some(w => /not exact-candidate acceptance/.test(w)));
  assert.throws(() => auditProject(makeProject(), { candidate: { id: 'x' } }), /immutable candidate/);
});

test('candidate CLI options bind JSON output and cannot consume the project path', () => {
  const root = makeProject();
  const candidate = { type: 'git_commit', id: 'exact-candidate', immutable: true };completeEvidence(root, candidate);
  const good = spawnSync(process.execPath, [cli, 'audit', '--candidate', candidate.id, root, '--json', '--strict'], { encoding: 'utf8' });
  assert.equal(good.status, 0, good.stderr);
  assert.equal(JSON.parse(good.stdout).candidate, candidate.id);
  for (const args of [['--candidate'], ['--candidate-type', 'other'], ['--candidate', 'a', '--candidate', 'b']]) {
    const result = spawnSync(process.execPath, [cli, 'audit', root, ...args], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
  }
});


test('malformed timestamps and contradictory expiry fail closed', () => {
  for (const producedAt of [false, 0, [], ['2026-09-05T20:00:00Z'], '2026-09-05', '2026-02-30T10:00:00Z', '2026-01-01T24:00:00Z']) {
    const root = makeProject(); completeEvidence(root, null, producedAt);
    assert.equal(auditProject(root).result, 'blocking', JSON.stringify(producedAt));
  }
  for (const validUntil of [false, 0, [], '', '2026-02-30T10:00:00Z', '2025-01-01T00:00:00Z']) {
    const root = makeProject();
    writeEvidence(root, { suffix: 'runtime.safe', evidenceClass: 'runtime', validUntil });
    assert.equal(auditProject(root).result, 'blocking', JSON.stringify(validUntil));
  }
});

test('candidate selection preserves newer or tied unbound non-PASS evidence', () => {
  const candidate = { type: 'git_commit', id: 'exact-candidate', immutable: true };
  for (const result of ['fail', 'unknown', 'informational']) {
    for (const producedAt of ['2026-09-06T20:00:00Z', '2026-09-05T20:00:00Z']) {
      const root = makeProject(); completeEvidence(root, candidate);
      const recordPath = path.join(root, 'evidence', 'ev-deployment-authority-deployment.json');
      const record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
      record.evidence_id = 'unbound-deployment'; record.candidate = null; record.result = result; record.produced_at = producedAt;
      writeText(path.join(root, 'evidence', 'unbound.json'), JSON.stringify(record));
      const report = auditProject(root, { candidate });
      assert.notEqual(report.result, 'proven', `${result}/${producedAt}`);
      assert.notEqual(auditExitCode(report, true), 0);
    }
  }
});

test('CLI equals syntax is bound and unknown or malformed options fail closed', () => {
  const root = makeProject();
  completeEvidence(root, { type: 'git_commit', id: 'exact-candidate', immutable: true });
  const run = (...args) => spawnSync(process.execPath, [cli, 'audit', root, '--json', '--strict', ...args], { encoding: 'utf8' });
  const good = run('--candidate=exact-candidate', '--candidate-type=git_commit');
  assert.equal(good.status, 0, good.stderr); assert.equal(JSON.parse(good.stdout).candidate, 'exact-candidate');
  for (const args of [['--candidate=wrong'], ['--candidate=exact-candidate', '--candidate-type=artifact'], ['--candidate='], ['--candidate', ''], ['--candidate=x', '--candidate', 'y'], ['--canddate=x'], ['--candidate-type=git_commit'], ['--strict=true']]) {
    const result = run(...args); assert.notEqual(result.status, 0, args.join(' '));
  }
});


test('partial and non-immutable identities cannot hide unresolved evidence; tied FAIL wins', () => {
  const candidate = { type: 'git_commit', id: 'exact-candidate', immutable: true };
  for (const identity of [{}, { id: 'x' }, { type: 'git_commit', id: 'x', immutable: false }, { type: '', id: 'x', immutable: true }]) {
    const root = makeProject(); completeEvidence(root, candidate);
    const record = JSON.parse(fs.readFileSync(path.join(root, 'evidence', 'ev-deployment-authority-deployment.json'), 'utf8'));
    record.evidence_id = 'unresolved'; record.candidate = identity; record.result = 'fail'; record.produced_at = '2026-09-06T20:00:00Z';
    writeText(path.join(root, 'evidence', 'unresolved.json'), JSON.stringify(record));
    const unknown = { ...record, evidence_id: 'unknown', result: 'unknown' };
    writeText(path.join(root, 'evidence', 'a-unknown.json'), JSON.stringify(unknown));
    assert.equal(auditProject(root, { candidate }).result, 'blocking');
  }
});
