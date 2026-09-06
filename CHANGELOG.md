# Changelog

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
