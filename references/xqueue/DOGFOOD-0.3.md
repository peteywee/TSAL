# XQueue -> TSAL 0.3 Dogfood Promotion

This record captures the second-order lessons discovered while attaching TSAL 0.2.x to XQueue and auditing the contract against the real automation.

## Finding 1 — repository configuration is not runtime evidence

A repository can prove what cadence, authority, identity, or deployment configuration is intended. It cannot prove that the same configuration is currently deployed and active.

Promoted control:

```text
specification != implementation != candidate != deployment != runtime
```

TSAL 0.3 therefore classifies evidence by proof layer and requires deployment/runtime evidence for higher-risk claims instead of allowing configuration files to stand in for live truth.

## Finding 2 — conformance is not binary

XQueue's contract contained many claims already supported by code/tests, while some production-state claims still required live evidence. A binary pass/fail result would either understate proven controls or overstate unproven runtime state.

Promoted control:

- `PROVEN`
- `PARTIAL`
- `UNPROVEN`
- `BLOCKING`
- `NOT_APPLICABLE` per check

`tsal audit` now evaluates claim-level conformance and can operate in advisory or strict mode.

## Finding 3 — retry was overloaded

XQueue showed that these are separate decisions:

1. retry the same dispatch inside one execution;
2. let a future scheduler invocation reevaluate the item;
3. retry after an ambiguous external result.

Automation-contract schema 0.1 could describe the distinction only in prose because it had one `maximum_attempts` field.

Promoted control: automation-contract schema 0.2 separates `dispatch`, `scheduler_reevaluation`, and `ambiguous_outcome` semantics.

## Finding 4 — old evidence must not be rewritten into new certainty

XQueue was adopted under manifest 0.2 / contract 0.1. TSAL 0.3 must not rewrite that historical record as though it had always used 0.3 evidence classes.

Promoted control:

- exact legacy schema blobs are retained under `schemas/legacy/`;
- legacy inputs remain auditable;
- missing newer semantics are reported `PARTIAL` or `UNPROVEN`, not silently inferred.

## Finding 5 — a failed proof should block promotion

When the latest qualifying evidence for a required claim reports failure, the project must not be promoted merely because the contract is well-written or an older test passed.

Promoted control: current qualifying `FAIL` evidence produces `BLOCKING` conformance.

## Finding 6 — runtime evidence can expire

A runtime-health observation is time-sensitive. Evidence that was true yesterday may not prove current safety.

Promoted control: evidence schema 0.3 supports `valid_until`; expired evidence is not accepted as current proof.

## Result

The XQueue dogfood loop now looks like:

```text
real automation
    -> contract
    -> claim audit
    -> evidence gap
    -> TSAL control
    -> negative test
    -> versioned release
```

This is A10/A11 operating as intended: lessons are not merely documented; reusable lessons become deterministic controls and regression tests.
