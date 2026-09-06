# Changelog

## 0.3.3 — Control-plane/workload boundary

This patch release codifies the architectural model validated by XQueue 1.1.0 and establishes the responsibility boundary future TOS work must build around.

### Added

- Normative TSAL/TOS/workload responsibility split: TSAL defines correctness and proof; a control plane such as TOS observes change, evaluates policy, executes bounded actions, verifies outcomes, and escalates; workloads retain domain behavior and local safety controls.
- Explicit rule that TSAL is not runtime middleware and that workloads must remain independently safe when TSAL or TOS is unavailable.
- Explicit rule that loss of a control plane cannot expand workload authority.
- Standard-adoption flow separating detection, compatibility assessment, candidate construction, verification, and project release authority.
- Decision boundary for keeping project-specific behavior in workloads while promoting reusable automation/governance rules into TSAL and autonomous cross-project action into TOS.

### Changed

- Integration guidance now states that a new TSAL release does not silently mutate projects.
- Versioning guidance now separates TSAL standard versions from workload/application versions and preserves previously proven workload releases as immutable historical evidence.
- Operational repair of already-approved external state is distinguished from software release/version changes when repository content does not change.
- README fundamental rules now include control-plane responsibility, workload independent safety, detection-vs-adoption, and immutable project-release evidence.

### Compatibility

- TSAL release version advances to `0.3.3`.
- Project manifest remains schema `0.3`.
- Automation contract remains schema `0.2`.
- Evidence and conformance report remain schema `0.3`.
- Incident schema remains `0.2`.
- No new backend, AI, provider, or TOS runtime dependency is introduced.
- Existing TSAL 0.3.2-aware projects are not automatically modified by this release.

## 0.3.2 — External state preservation

This patch release promotes a production lesson discovered while reconciling XQueue against Cloudflare control-plane state.

### Added

- Normative external-state preservation policy in `docs/EXTERNAL-STATE-PRESERVATION.md`.
- Destructive-absence rule: empty, null, default, or omission-like configuration values must not be assumed non-mutating when provider semantics can delete, revoke, replace, or reset external state.
- Authority-preserving deployment rule: non-authoritative deploy paths must preserve external authority state rather than implicitly mutate it.
- Explicit separation between ordinary deployment authority and control-plane authority mutation.
- Post-deploy reconciliation requirement for material R3 external authority surfaces.
- Failure-matrix coverage for destructive empty/default configuration and provider replacement semantics.

### Changed

- Conformance guidance now makes authoritative provider-state reconciliation part of `deployment` evidence for R3 control-plane authority.
- Repository verification now requires the external-state preservation policy artifact.
- XQueue reference guidance now records the 0.3.2 lesson that successful code/configuration checks cannot substitute for authoritative external deployment state.

### Compatibility

- TSAL release version advances to `0.3.2`.
- Project manifest remains schema `0.3`.
- Automation contract remains schema `0.2`.
- Evidence and conformance report remain schema `0.3`.
- Incident schema remains `0.2`.
- No new backend, AI, provider, or TOS dependency is introduced.

## 0.3.1 — Evidence discovery compatibility

This patch release fixes a dogfooding defect discovered while migrating XQueue to TSAL 0.3.0.

### Fixed

- `tsal audit` no longer assumes every `.json` file inside a declared evidence directory is a TSAL evidence record.
- Project-native JSON evidence can coexist with TSAL claim-level evidence without causing false `BLOCKING` conformance.
- JSON that identifies itself as TSAL evidence through a supported TSAL evidence schema or TSAL evidence identity fields is still validated fail-closed.

### Added

- Regression coverage proving XQueue-style native evidence JSON is ignored by the TSAL record parser while malformed TSAL-shaped evidence remains blocking.

### Compatibility

- TSAL release version advances to `0.3.1`.
- Project manifest remains schema `0.3`.
- Automation contract remains schema `0.2`.
- Evidence and conformance report remain schema `0.3`.
- Incident schema remains `0.2`.

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
