import fs from 'node:fs';
import path from 'node:path';
import { loadProject, resolveDeclaredPath } from './project-model.mjs';

const CURRENT_EVIDENCE_SCHEMA = '0.3';
const LEGACY_EVIDENCE_SCHEMA = '0.2';
const VALID_EVIDENCE_CLASSES = new Set([
  'specification',
  'implementation',
  'candidate',
  'deployment',
  'runtime',
  'reconciliation',
  'attestation'
]);

function check(id, requirement, result, options = {}) {
  return {
    id,
    requirement,
    result,
    required_evidence_classes: options.requiredEvidenceClasses ?? [],
    evidence_refs: options.evidenceRefs ?? [],
    notes: options.notes ?? ''
  };
}

function listJsonFiles(root) {
  if (!root || !fs.existsSync(root) || !fs.statSync(root).isDirectory()) return [];
  const files = [];
  const stack = [root];

  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name.endsWith('.json')) files.push(full);
    }
  }

  return files.sort();
}

function loadEvidence(project) {
  const records = [];
  const errors = [];
  const warnings = [];
  const directory = project.manifest?.artifacts?.evidence_directory;
  if (!directory) return { records, errors, warnings };

  const evidenceRoot = resolveDeclaredPath(project.root, directory);
  for (const file of listJsonFiles(evidenceRoot)) {
    let record;
    try {
      record = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      errors.push(`invalid evidence JSON ${path.relative(project.root, file)}: ${error.message}`);
      continue;
    }

    const relative = path.relative(project.root, file).split(path.sep).join('/');
    if (record?.schema_version === LEGACY_EVIDENCE_SCHEMA) {
      warnings.push(`legacy evidence ${relative} uses schema 0.2 and cannot prove claim-level 0.3 checks without claim_id/evidence_class`);
      records.push({ ...record, _file: relative, _legacy: true });
      continue;
    }

    if (record?.schema_version !== CURRENT_EVIDENCE_SCHEMA) {
      errors.push(`unsupported evidence schema_version in ${relative}: ${String(record?.schema_version)}`);
      continue;
    }

    for (const key of ['evidence_id', 'project_id', 'produced_at', 'claim_id', 'claim', 'result', 'evidence_class', 'provenance']) {
      if (record?.[key] === undefined || record?.[key] === null || record?.[key] === '') {
        errors.push(`evidence ${relative} missing required field ${key}`);
      }
    }
    if (record?.project_id && record.project_id !== project.manifest.project.id) {
      errors.push(`evidence ${relative} project_id ${record.project_id} does not match ${project.manifest.project.id}`);
    }
    if (record?.evidence_class && !VALID_EVIDENCE_CLASSES.has(record.evidence_class)) {
      errors.push(`evidence ${relative} has invalid evidence_class ${record.evidence_class}`);
    }
    if (record?.result && !['pass', 'fail', 'unknown', 'informational'].includes(record.result)) {
      errors.push(`evidence ${relative} has invalid result ${record.result}`);
    }

    records.push({ ...record, _file: relative, _legacy: false });
  }

  return { records, errors, warnings };
}

function evidenceTime(record) {
  const value = Date.parse(record?.produced_at ?? '');
  return Number.isFinite(value) ? value : 0;
}

function currentEvidence(records, automationId, claimId, allowedClasses) {
  const now = Date.now();
  return records
    .filter((record) => !record._legacy)
    .filter((record) => record.automation_id === automationId)
    .filter((record) => record.claim_id === claimId)
    .filter((record) => allowedClasses.includes(record.evidence_class))
    .filter((record) => !record.valid_until || Date.parse(record.valid_until) >= now)
    .sort((a, b) => evidenceTime(b) - evidenceTime(a))[0] ?? null;
}

function evidenceCheck(records, automationId, claimSuffix, requirement, allowedClasses) {
  const claimId = `${automationId}.${claimSuffix}`;
  const record = currentEvidence(records, automationId, claimId, allowedClasses);

  if (!record) {
    return check(claimId, requirement, 'unproven', {
      requiredEvidenceClasses: allowedClasses,
      notes: `No current machine-readable evidence found for ${claimId}.`
    });
  }

  if (record.result === 'fail') {
    return check(claimId, requirement, 'blocking', {
      requiredEvidenceClasses: allowedClasses,
      evidenceRefs: [record.evidence_id],
      notes: `Latest qualifying evidence reports FAIL (${record._file}).`
    });
  }
  if (record.result === 'pass') {
    return check(claimId, requirement, 'proven', {
      requiredEvidenceClasses: allowedClasses,
      evidenceRefs: [record.evidence_id],
      notes: `Proven by ${record.evidence_class} evidence ${record.evidence_id}.`
    });
  }

  return check(claimId, requirement, 'unproven', {
    requiredEvidenceClasses: allowedClasses,
    evidenceRefs: [record.evidence_id],
    notes: `Latest qualifying evidence result is ${record.result}.`
  });
}

function contractChecks(entry, evidence) {
  const { automation, contract } = entry;
  const id = automation.id;
  const risk = contract?.risk?.class ?? automation?.risk ?? null;
  const checks = [];

  checks.push(check(
    `${id}.contract.structure`,
    'The automation contract is readable, uses a supported schema, and identifies the same automation as the project manifest.',
    'proven',
    { notes: `Contract schema ${contract.schema_version}.` }
  ));

  const sourceTruthComplete = Boolean(
    contract?.source_of_truth?.description &&
    contract?.source_of_truth?.location &&
    contract?.source_of_truth?.owner
  );
  checks.push(check(
    `${id}.source_of_truth.declared`,
    'The automation declares an authoritative source of truth and owner.',
    sourceTruthComplete ? 'proven' : 'blocking'
  ));

  const bounded = Number.isInteger(contract?.work_item?.maximum_per_execution) && contract.work_item.maximum_per_execution >= 1;
  checks.push(check(
    `${id}.work.bounded`,
    'Mutation/work selection has an explicit per-execution bound.',
    bounded ? 'proven' : (risk === 'R0' ? 'partial' : 'blocking'),
    { notes: bounded ? `maximum_per_execution=${contract.work_item.maximum_per_execution}` : 'No explicit maximum_per_execution.' }
  ));

  const authority = contract?.authority ?? {};
  const authorityComplete = Boolean(
    authority.executor && authority.production_authority && authority.concurrency_model && authority.revocation_mechanism &&
    (authority.concurrency_model !== 'coordinated_multi' || authority.coordination_mechanism)
  );
  checks.push(check(
    `${id}.authority.specified`,
    'Execution authority, concurrency model, revocation, and required coordination are explicitly specified.',
    authorityComplete ? 'proven' : 'blocking'
  ));

  const sideEffects = Array.isArray(contract?.side_effects) ? contract.side_effects : [];
  const ambiguityPossible = sideEffects.some((effect) => effect?.ambiguity_possible === true);
  if (['R2', 'R3'].includes(risk) && sideEffects.length === 0) {
    checks.push(check(
      `${id}.side_effects.declared`,
      'R2/R3 automations declare at least one external side effect.',
      'blocking'
    ));
  } else {
    checks.push(check(
      `${id}.side_effects.declared`,
      'Side effects are declared consistently with the risk class.',
      'proven'
    ));
  }

  if (ambiguityPossible) {
    let ambiguitySafe = contract?.ambiguity?.possible === true;
    if (contract?.schema_version === '0.1') {
      ambiguitySafe = ambiguitySafe && contract?.ambiguity?.automatic_retry_allowed_when_unknown === false;
    } else {
      ambiguitySafe = ambiguitySafe &&
        contract?.retry?.ambiguous_outcome?.automatic_retry_allowed === false &&
        contract?.retry?.ambiguous_outcome?.requires_reconciliation === true;
    }
    checks.push(check(
      `${id}.ambiguity.specified`,
      'Ambiguous external outcomes fail closed and require reconciliation before automatic retry.',
      ambiguitySafe ? 'proven' : 'blocking'
    ));
  } else {
    checks.push(check(
      `${id}.ambiguity.specified`,
      'Ambiguous side-effect handling is required only when ambiguity is possible.',
      'not_applicable'
    ));
  }

  if (contract?.schema_version === '0.2') {
    const separated = Boolean(
      contract?.retry?.dispatch &&
      contract?.retry?.scheduler_reevaluation &&
      contract?.retry?.ambiguous_outcome &&
      Number.isInteger(contract.retry.dispatch.maximum_retry_attempts)
    );
    checks.push(check(
      `${id}.retry.separated`,
      'Dispatch retry, later scheduler reevaluation, and ambiguous-outcome retry are modeled separately.',
      separated ? 'proven' : 'blocking'
    ));
  } else {
    checks.push(check(
      `${id}.retry.separated`,
      'Dispatch retry, later scheduler reevaluation, and ambiguous-outcome retry are modeled separately.',
      'partial',
      { notes: 'Legacy automation-contract schema 0.1 uses one overloaded retry object; migrate to schema 0.2 for full proof.' }
    ));
  }

  if (['R1', 'R2', 'R3'].includes(risk)) {
    checks.push(evidenceCheck(
      evidence,
      id,
      'authority.enforced',
      'Implementation/candidate evidence proves that execution authority is enforced.',
      ['implementation', 'candidate']
    ));
    checks.push(evidenceCheck(
      evidence,
      id,
      'retry.bounded',
      'Implementation/candidate evidence proves retry behavior is bounded and policy-conformant.',
      ['implementation', 'candidate']
    ));
  } else {
    checks.push(check(`${id}.authority.enforced`, 'Implementation authority evidence.', 'not_applicable'));
    checks.push(check(`${id}.retry.bounded`, 'Implementation retry evidence.', 'not_applicable'));
  }

  if (ambiguityPossible) {
    checks.push(evidenceCheck(
      evidence,
      id,
      'ambiguity.fail_closed',
      'Implementation/candidate evidence proves ambiguous external outcomes fail closed.',
      ['implementation', 'candidate']
    ));
  } else {
    checks.push(check(`${id}.ambiguity.fail_closed`, 'Ambiguity implementation evidence.', 'not_applicable'));
  }

  if (['R2', 'R3'].includes(risk)) {
    checks.push(evidenceCheck(
      evidence,
      id,
      'recovery.verified',
      'Candidate or reconciliation evidence proves the documented recovery path works.',
      ['candidate', 'reconciliation']
    ));
    checks.push(evidenceCheck(
      evidence,
      id,
      'runtime.safe',
      'Current runtime evidence supports safe operation.',
      ['runtime']
    ));
  } else {
    checks.push(check(`${id}.recovery.verified`, 'Recovery evidence.', 'not_applicable'));
    checks.push(check(`${id}.runtime.safe`, 'Runtime safety evidence.', 'not_applicable'));
  }

  if (risk === 'R3') {
    checks.push(evidenceCheck(
      evidence,
      id,
      'deployment.authority',
      'Deployment evidence proves the intended production authority configuration.',
      ['deployment']
    ));
  } else {
    checks.push(check(`${id}.deployment.authority`, 'Production deployment authority evidence.', 'not_applicable'));
  }

  return checks;
}

function summarize(checks) {
  const counts = {
    proven: 0,
    partial: 0,
    unproven: 0,
    blocking: 0,
    not_applicable: 0
  };
  for (const item of checks) counts[item.result] += 1;

  let result;
  if (counts.blocking > 0) result = 'blocking';
  else if (counts.partial === 0 && counts.unproven === 0) result = 'proven';
  else if (counts.proven === 0) result = 'unproven';
  else result = 'partial';

  return { result, counts };
}

export function auditProject(target) {
  const root = path.resolve(target);
  const project = loadProject(root);
  const checks = [];
  const blockingFindings = [];
  const warnings = [...project.warnings];

  if (project.errors.length > 0) {
    for (const error of project.errors) {
      checks.push(check('project.structure', 'Project manifest, declared artifacts, and automation contracts are structurally coherent.', 'blocking', { notes: error }));
      blockingFindings.push(error);
    }
  } else {
    checks.push(check('project.structure', 'Project manifest, declared artifacts, and automation contracts are structurally coherent.', 'proven'));
  }

  const evidence = project.manifest ? loadEvidence(project) : { records: [], errors: [], warnings: [] };
  warnings.push(...evidence.warnings);
  for (const error of evidence.errors) {
    checks.push(check('evidence.integrity', 'Machine-readable evidence records are parseable and structurally usable.', 'blocking', { notes: error }));
    blockingFindings.push(error);
  }

  if (project.errors.length === 0) {
    for (const entry of project.contracts) {
      checks.push(...contractChecks(entry, evidence.records));
    }
  }

  const { result, counts } = summarize(checks);
  return {
    schema_version: '0.3',
    project_id: project.manifest?.project?.id ?? path.basename(root),
    automation_id: null,
    tsal_version: project.manifest?.tsal_version ?? 'unknown',
    candidate: null,
    evaluated_at: new Date().toISOString(),
    evaluator: 'tsal audit',
    result,
    summary: counts,
    checks,
    blocking_findings: blockingFindings,
    warnings
  };
}

export function formatAudit(report) {
  const lines = [];
  lines.push(`TSAL AUDIT — ${report.project_id}`);
  lines.push(`TSAL target: ${report.tsal_version}`);
  lines.push('');
  for (const item of report.checks) {
    const status = item.result.toUpperCase().padEnd(14);
    lines.push(`${status} ${item.id}`);
    if (item.notes) lines.push(`               ${item.notes}`);
  }
  lines.push('');
  lines.push(`CONFORMANCE: ${report.result.toUpperCase()}`);
  lines.push(`Counts: proven=${report.summary.proven} partial=${report.summary.partial} unproven=${report.summary.unproven} blocking=${report.summary.blocking} n/a=${report.summary.not_applicable}`);
  if (report.warnings.length) {
    lines.push('');
    lines.push('Warnings:');
    for (const warning of report.warnings) lines.push(`- ${warning}`);
  }
  return lines.join('\n');
}

export function auditExitCode(report, strict = false) {
  if (report.result === 'blocking') return 1;
  if (strict && report.result !== 'proven') return 2;
  return 0;
}
