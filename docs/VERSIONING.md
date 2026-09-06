# TSAL Versioning Policy

TSAL uses semantic versioning for the canonical standard and tooling release.

## Canonical release version

The canonical TSAL version MUST be identical in all three release surfaces:

- `VERSION`
- `package.json` -> `version`
- `tsal.project.json` -> `tsal_version`

`npm run verify` MUST fail when these values diverge.

## Every repository change requires a version bump

A pull request that changes TSAL repository content beyond the three version surfaces MUST increase the canonical TSAL version relative to the pull request base.

This includes changes to:

- lifecycle or normative documentation;
- schemas;
- interfaces;
- templates;
- local tooling;
- tests and verification behavior;
- examples and reference material;
- CI or repository governance files.

This rule intentionally favors explicit release history over silent mutation of the canonical standard.

## Release size

Use the smallest semantic version increase that truthfully describes the compatibility impact:

- PATCH (`0.2.0` -> `0.2.1`): bug fixes, hardening, stronger validation, documentation corrections, regression tests, and backward-compatible tooling improvements.
- MINOR (`0.2.x` -> `0.3.0`): backward-compatible new capabilities, new conformance concepts, new commands, or material contract-model extensions.
- MAJOR: incompatible changes to stable TSAL contracts or guarantees once TSAL reaches a maturity level where those guarantees are declared stable.

## TSAL version is not schema version

TSAL release version and artifact schema versions are independent.

A TSAL patch may improve tooling without changing a schema. A future schema change MUST update that schema's own version/compatibility declaration when its data contract changes.

Example:

```text
TSAL release                 0.2.1
Project manifest schema      0.2
Automation contract schema   0.1
```

This is valid when the 0.2.1 release changes implementation or validation behavior without changing those schema structures.

## Candidate rule

Release evidence is valid only for the exact candidate commit tested. If the candidate changes, required CI and verification MUST run again before merge.
