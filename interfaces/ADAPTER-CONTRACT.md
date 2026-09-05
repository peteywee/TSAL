# TSAL Adapter Contract

Adapters connect provider- or project-specific systems to TSAL without changing TSAL core.

## Adapter responsibilities

An adapter MUST declare:
- adapter identity and version;
- direction: read, write, or read/write;
- systems touched;
- data read;
- side effects, if any;
- authentication boundary;
- failure semantics;
- ambiguity semantics;
- evidence produced;
- whether the adapter can hold execution authority.

## Required behavior

1. An adapter MUST NOT silently convert `unknown` into `failed` or `succeeded`.
2. An adapter MUST preserve provider identifiers needed for reconciliation when available.
3. A write-capable adapter MUST declare its side effects before it can be used by an R2/R3 automation.
4. A write-capable adapter MUST expose a non-mutating health/readiness path where technically possible.
5. Adapter output MUST identify provenance.
6. Adapter failure MUST fail closed when continuing could expand authority or duplicate an ambiguous side effect.
7. An adapter MUST NOT grant itself authority merely because credentials exist.

## Logical interface

Implementations may use functions, classes, CLI processes, HTTP, RPC, or another transport. The semantic interface is:

```text
identity() -> adapter metadata
health() -> ready | degraded | unavailable
read(query) -> facts + provenance
plan(operation) -> non-mutating execution intent
execute(operation, authority_context) -> known result | unknown result
reconcile(operation) -> observed remote state
collect_evidence(context) -> evidence records
```

Not every adapter implements every method. Unsupported capabilities MUST be explicit.

## Authority context

A mutating call SHOULD receive an authority context containing at least:

```text
project_id
automation_id
candidate/work_item identity
risk class
authority grant or execution token
bounded scope
correlation/run id
```

Credentials prove authentication. Authority context proves permission within TSAL policy. They are not the same thing.

## Adapter registration

Projects declare adapters in `tsal.project.json`. A future registry or TOS control plane MAY enrich that declaration with runtime details, but project-local declarations remain authoritative for what the project expects.

## AI adapters

An AI adapter MAY:
- draft contracts;
- classify risk for review;
- explain failed checks;
- summarize incidents;
- propose tests;
- inspect implementation for likely gaps.

An AI adapter MUST NOT be treated as deterministic proof when a requirement can be mechanically checked. R3 owner-reserved decisions MUST remain owner-reserved unless policy explicitly defines another bounded authority path.
