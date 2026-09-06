# TSAL Adapter Contract

Adapters connect provider- or project-specific systems to TSAL without changing TSAL core.

Normative terms are defined in [`../docs/TERMINOLOGY.md`](../docs/TERMINOLOGY.md).

## Adapter responsibilities

An adapter MUST declare:
- adapter identity and version;
- direction: read, write, or read/write;
- systems and exact resource identities touched;
- data read;
- side effects, if any;
- authentication boundary;
- required authority/capability context for mutation;
- provider replacement/omission/deletion semantics when relevant;
- failure semantics;
- ambiguity semantics;
- post-action reconciliation semantics where required;
- evidence produced;
- whether the adapter can technically hold credentials or execution tokens.

Technical ability to hold credentials does not make the adapter an authority source.

## Required behavior

1. An adapter MUST NOT silently convert `unknown` into `failed` or `succeeded`.
2. An adapter MUST preserve provider identifiers needed for reconciliation when available.
3. A write-capable adapter MUST declare its side effects before it can be used by an R2/R3 automation.
4. A write-capable adapter MUST expose a non-mutating health/readiness path where technically possible.
5. Adapter output MUST identify provenance.
6. Adapter failure MUST fail closed when continuing could expand authority or duplicate/destructively repeat an ambiguous side effect.
7. An adapter MUST NOT grant itself authority merely because credentials exist.
8. A mutating adapter MUST preserve the capability, target, scope, and conditions of the admitted bounded action; it MUST NOT broaden them.
9. A mutating adapter used behind a control-plane privileged-admission boundary MUST reject missing/invalid admission context rather than silently falling back to provider permissions.
10. A denial MUST NOT be bypassed by calling the same protected capability through an alternate TOS-managed adapter or tool path.
11. Empty, null, omitted, default, replace, reset, revoke, and delete semantics MUST remain distinct when provider behavior can mutate protected external state.
12. Provider command success MUST NOT substitute for authoritative post-action state when the contract requires reconciliation.
13. Preview/test/staging resource identity MUST NOT silently resolve to production identity.

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
requested capability
target/resource identity
risk class
authority grant or execution token
authority source
bounded scope and conditions
reserved-action disposition
correlation/run id
retry/repair budget when applicable
```

Credentials prove authentication/access possibility. Authority context proves permission within policy. They are not the same thing.

A control plane may produce this context through an execution kernel, policy engine, admission controller, or equivalent deterministic gate. The adapter MUST NOT manufacture missing admission fields from its own credentials or provider IAM reachability.

## Provider-state semantics

For any provider surface where omission/default values can mutate external state, the adapter contract SHOULD explicitly classify:

```text
omission: preserve | no-op | delete | replace | unknown
empty:    preserve | no-op | delete | replace | unknown
null:     preserve | no-op | delete | replace | unknown
```

`unknown` on a protected mutation is fail-closed until the semantics are proven or an explicit authority path accepts the risk.

## Reconciliation

A material R3 mutation SHOULD define an authoritative post-action read when technically possible. If observed provider state does not match the admitted intended state, the result is not proven even if the mutation command returned success.

Ambiguous side effects MUST be reconciled before automatic retry when replay could duplicate, publish, charge, delete, revoke, or otherwise produce unsafe additional effects.

## Adapter registration

Projects declare adapters in `tsal.project.json`. A registry or TOS control plane MAY enrich that declaration with runtime details, but project-local declarations remain authoritative for what the project expects.

## AI adapters

An AI adapter MAY:
- draft contracts;
- classify risk for review;
- explain failed checks;
- summarize incidents;
- propose tests;
- inspect implementation for likely gaps;
- propose bounded actions.

An AI adapter MUST NOT be treated as deterministic proof when a requirement can be mechanically checked. AI confidence MUST NOT create authority or override a deterministic admission denial. R3 owner-reserved decisions MUST remain owner-reserved unless policy explicitly defines another bounded authority path.
