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

- PATCH (`0.3.2` -> `0.3.3`): bug fixes, hardening, stronger validation, documentation corrections/clarifications, regression tests, and backward-compatible tooling improvements.
- MINOR (`0.3.x` -> `0.4.0`): backward-compatible new capabilities, new conformance concepts, new commands, or material contract-model extensions.
- MAJOR: incompatible changes to stable TSAL contracts or guarantees once TSAL reaches a maturity level where those guarantees are declared stable.

## TSAL version is not schema version

TSAL release version and artifact schema versions are independent.

A TSAL patch may improve tooling or clarify normative architecture without changing a schema. A schema data-contract change MUST update that schema's own version/compatibility declaration.

Current 0.3.3 release:

```text
TSAL release                 0.3.3
Project manifest schema      0.3
Automation contract schema   0.2
Evidence schema              0.3
Conformance report schema    0.3
Incident schema              0.2
```

Legacy schemas remain under `schemas/legacy/`. Compatibility support does not allow an older schema to prove requirements that did not exist in that version.

## Standard version versus workload version

TSAL versions and workload/application versions MUST be treated as separate release lines.

A new TSAL release does not automatically create a new workload release and MUST NOT silently mutate a workload repository.

The expected flow is:

```text
TSAL release changes
        │
        ▼
compatibility assessment
   ┌────┴──────────────┐
   │                   │
unaffected          adoption needed
   │                   │
no workload         explicit workload candidate
change                 │
                       ▼
                  tests + evidence + audit
                       │
                       ▼
                  workload version decision
```

A workload release that was previously proven against TSAL remains immutable historical evidence. A newer TSAL release does not retroactively redefine that workload release.

If adopting a newer TSAL release changes committed workload content, the workload follows its own versioning policy and MUST be treated as a new exact candidate. The workload SHOULD use the smallest truthful semantic version increase for the scope of that project change.

Detection of a newer TSAL release MAY be automated by TOS, CI, or another consumer. Detection is not adoption. Compatibility evaluation, candidate construction, verification, and release authority remain separate steps.

## Repair is not necessarily a release

Restoring already-approved external/runtime state to the exact declared configuration is not inherently a software version change. For example, repairing provider drift to an existing approved cron or deployment may be an operational repair if no repository candidate changes.

If the repair requires committed code/configuration changes, it becomes a new workload candidate and follows project versioning and release policy.

## Candidate rule

Release evidence is valid only for the exact candidate commit tested. If the candidate changes, required CI and verification MUST run again before merge.
