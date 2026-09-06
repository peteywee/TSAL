# TSAL Conformance Model

TSAL 0.3 separates **declared design** from **proved reality**.

A contract can prove that a project has specified an authority boundary, retry policy, source of truth, or recovery rule. It cannot by itself prove that the implementation, deployed candidate, production configuration, or current runtime obeys that declaration.

## Conformance statuses

- `PROVEN` — the requirement is supported by qualifying evidence.
- `PARTIAL` — part of the requirement is supported, but a stronger model or evidence layer is still missing.
- `UNPROVEN` — no current qualifying evidence proves the requirement.
- `BLOCKING` — structural contradiction, unsafe contract semantics, malformed TSAL evidence, or current qualifying evidence reports failure.
- `NOT_APPLICABLE` — the requirement does not apply to the automation/risk class.

Overall project conformance is:

1. `BLOCKING` if any check is blocking;
2. `PROVEN` if all applicable checks are proven;
3. `UNPROVEN` if no applicable check is proven and at least one remains unresolved;
4. otherwise `PARTIAL`.

## Evidence classes

Evidence class answers **which layer of truth the evidence can establish**.

| Class | What it can establish |
|---|---|
| `specification` | What policy, contract, or design declares. |
| `implementation` | What source code or deterministic implementation checks establish. |
| `candidate` | What an exact immutable candidate passed before promotion. |
| `deployment` | What configuration/artifact was actually deployed or granted authority. |
| `runtime` | What the currently operating system is observed doing now. |
| `reconciliation` | What remote/external truth was established after uncertainty. |
| `attestation` | Human or external assertion where deterministic proof is unavailable. |

Evidence classes are not interchangeable. In particular:

```text
repository configuration != deployed configuration != current runtime truth
```

A `candidate` test cannot prove current production authority. A `deployment` record cannot prove the service is still healthy. A contract cannot prove its implementation enforces the contract.

## Canonical claim IDs

`tsal audit` uses stable claim IDs so evidence can attach to a requirement without path-dependent coupling.

For automation `<id>` the current behavioral claims are:

- `<id>.authority.enforced`
- `<id>.retry.bounded`
- `<id>.ambiguity.fail_closed` when ambiguous side effects are possible
- `<id>.recovery.verified` for R2/R3
- `<id>.deployment.authority` for R3
- `<id>.runtime.safe` for R2/R3

Structural/specification checks are derived directly from the manifest and automation contract and do not require separate evidence records.

## Evidence discovery

The manifest's `artifacts.evidence_directory` may contain both TSAL claim-level evidence records and project-native evidence formats.

`tsal audit` MUST NOT assume that every JSON file in that directory is a TSAL evidence record. A JSON document is interpreted as TSAL evidence when it identifies itself through a supported TSAL evidence `schema_version` or TSAL evidence identity fields such as `evidence_id`, `claim_id`, or `evidence_class`.

Project-native JSON that does not identify itself as TSAL evidence is ignored by the TSAL evidence parser and remains available to project-specific tooling. Once a document identifies itself as TSAL evidence, malformed or unsupported TSAL evidence MUST fail closed rather than being silently ignored.

This permits existing evidence artifacts such as parity matrices, provider snapshots, test inventories, and project-specific diagnostics to coexist with machine-readable TSAL claim records without changing their original semantics.

## Evidence selection

For a claim, `tsal audit` selects the latest non-expired evidence record from a qualifying evidence class.

- latest `pass` -> `PROVEN`
- latest `fail` -> `BLOCKING`
- latest `unknown` or `informational` -> `UNPROVEN`
- no qualifying evidence -> `UNPROVEN`

A `valid_until` timestamp can bound runtime/deployment evidence freshness. Expired evidence does not prove a current claim.

## Legacy records

TSAL 0.3 keeps legacy schema artifacts under `schemas/legacy/` and accepts project manifest 0.2 and automation contract 0.1 inputs.

Legacy automation-contract 0.1 uses a single overloaded retry object, so `tsal audit` reports the retry-separation requirement as `PARTIAL` until the contract migrates to automation-contract schema 0.2.

Legacy evidence schema 0.2 lacks `claim_id` and `evidence_class`; it remains readable but cannot automatically prove claim-level 0.3 checks.

## CLI

```bash
node tooling/cli.mjs audit ./project
node tooling/cli.mjs audit ./project --json
node tooling/cli.mjs audit ./project --strict
```

Default mode exits nonzero only for `BLOCKING` conformance, which makes the command useful during adoption. `--strict` exits nonzero unless overall conformance is `PROVEN` and is intended for release gates.

## Authority rule

Conformance is observational and evaluative. Running an audit does not grant execution authority, production authority, override authority, or permission to mutate an external system.
