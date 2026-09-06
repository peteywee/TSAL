# Changelog

## 0.3.0 — Evidence-driven conformance

This minor release promotes the deeper model lessons discovered while dogfooding TSAL against XQueue. It distinguishes declared configuration from implementation, candidate, deployment, and runtime truth; introduces a real local `tsal audit`; and replaces the overloaded retry model from automation-contract schema 0.1.

### Added

- `tsal audit <project>` with human-readable and `--json` output.
- `--strict` audit mode for release/CI gates.
- Claim-level conformance statuses: `PROVEN`, `PARTIAL`, `UNPROVEN`, `BLOCKING`, and per-check `NOT_APPLICABLE`.
- Evidence classes: specification, implementation, candidate, deployment, runtime, reconciliation, and attestation.
- Stable behavioral claim IDs for authority, retry, ambiguity, recovery, deployment authority, and runtime safety.
- Evidence freshness support through optional `valid_until`.
- Shared project model loader used by Doctor and Audit.
- `docs/CONFORMANCE-MODEL.md` and `docs/RETRY-MODEL.md`.
- Exact legacy schema preservation under `schemas/legacy/`.
- Audit regression tests proving current R0 conformance, legacy R3 partial conformance, strict-mode behavior, and blocking failed evidence.

### Changed

- Project manifest schema advances from 0.2 to 0.3.
- Evidence schema advances from 0.2 to 0.3.
- Conformance report schema advances from 0.2 to 0.3.
- Automation contract schema advances from 0.1 to 0.2.
- Automation-contract retry semantics now separate immediate dispatch retry, later scheduler reevaluation, and ambiguous-outcome retry/reconciliation.
- `tsal init` creates manifest schema 0.3 projects targeting the current TSAL release.
- `npm run verify` now runs strict audit against TSAL itself and the R0 reference example.

### Compatibility

- `tsal doctor` and `tsal audit` continue to accept project manifest schema 0.2 and automation contract schema 0.1.
- Legacy automation-contract 0.1 is intentionally reported `PARTIAL` for separated retry semantics rather than falsely promoted to full proof.
- Legacy evidence schema 0.2 remains readable but cannot automatically prove 0.3 claim-level checks because it lacks `claim_id` and `evidence_class`.
- No TOS dependency, backend requirement, or AI requirement is introduced.

## 0.2.1 — XQueue dogfood hardening

This patch release converts defects discovered while attaching TSAL 0.2.0 to XQueue into deterministic controls.

### Fixed

- `tsal doctor` now validates declared artifact paths, existence, and expected filesystem type.
- Declared paths must use canonical relative POSIX-style form; trailing slashes, parent segments, empty segments, absolute paths, and backslashes are rejected.
- Automation contract paths receive the same canonical-path checks.
- `tsal init` now uses the canonical TSAL version from `VERSION` instead of a hard-coded value.
- `tsal init` now materializes every artifact it declares: evidence, incidents, runbook, and architecture.
- Generated evidence and incident directories contain tracked README files so Git does not silently discard them.
- TSAL itself now materializes its own declared evidence and incident paths and is checked by its own Doctor during verification.

### Added

- Project architecture template.
- Negative regression tests for missing artifacts, non-canonical paths, wrong filesystem types, and missing automation contracts.
- Enforced TSAL version synchronization across `VERSION`, `package.json`, and `tsal.project.json`.
- Pull-request CI rule requiring a higher TSAL version whenever repository content changes.
- Normative versioning policy in `docs/VERSIONING.md`.

### Compatibility

- TSAL release version: `0.2.1`.
- Project manifest schema remains `0.2`.
- Automation contract schema remains `0.1`.
- No TOS dependency, backend requirement, or AI requirement is introduced.

## 0.2.0 — Platform foundation

Established the local-first TSAL platform skeleton with project, evidence, incident, adapter, control-plane, template, CLI, example, and CI foundations.
