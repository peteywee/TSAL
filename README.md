# TSAL

**Top Shelf Automation Lifecycle**

TSAL is a local-first, technology-agnostic automation engineering standard with machine-readable project, evidence, incident, conformance, and integration boundaries.

> **Can this task be automated with bounded authority, truthful state, controlled failure, recoverability, and evidence?**

Current version: **0.3.4 — privileged-admission and terminology hardening**

## Architecture

TSAL is deliberately split into a stable trunk and replaceable branches:

```text
                         OPTIONAL CONTROL PLANE
                     (TOS / registry / dashboard)
                                ▲
                                │
                      integration interfaces
                                │
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
     project manifest        evidence           incidents
            └───────────────────┼───────────────────┘
                                ▼
                       conformance/tooling
                                │
                                ▼
                            TSAL CORE
                    lifecycle + invariants
```

The core MUST NOT depend on TOS, AI, GitHub, Cloudflare, Supabase, a scheduler, or a language runtime.

### Constitutional responsibility boundary

```text
TSAL
  defines rules, terminology, contracts, evidence semantics, conformance, and compatibility expectations

Control plane / TOS userland
  detects change, observes, diagnoses, plans, coordinates, proposes, verifies, and escalates

Privileged-admission boundary / TOS execution kernel equivalent
  deterministically admits or denies protected TOS-managed mutation

Workload
  performs domain behavior and exposes truthful facts, evidence, and bounded actions
```

TSAL is not runtime middleware between TOS and a workload, not a TOS application, and not the TOS kernel. Workloads must remain independently safe if TSAL or TOS is unavailable. A new TSAL release may trigger compatibility assessment, but it must not silently mutate a workload; an adoption that changes committed workload content is a new workload candidate subject to that project's own version, tests, evidence, and release policy.

A control plane that claims autonomous privileged execution should separate discretionary reasoning from deterministic privileged admission. For R3 protected mutations, mechanically evaluable authority/safety controls must not be replaced by AI confidence, credentials, or alternate-tool reachability.

Read [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md), [`docs/TERMINOLOGY.md`](./docs/TERMINOLOGY.md), [`docs/INTEGRATION-MODEL.md`](./docs/INTEGRATION-MODEL.md), [`docs/CONFORMANCE-MODEL.md`](./docs/CONFORMANCE-MODEL.md), [`docs/EXTERNAL-STATE-PRESERVATION.md`](./docs/EXTERNAL-STATE-PRESERVATION.md), and [`docs/VERSIONING.md`](./docs/VERSIONING.md).

## Stable project socket

Projects do **not** clone TSAL. They connect to it by exposing:

```text
tsal.project.json
```

The manifest identifies the project, targeted TSAL version, automation contracts, evidence/incident locations, adapters, conformance policy, and optional control-plane connection.

```text
my-automation/
├── tsal.project.json
├── automation.contract.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── RUNBOOK.md
│   └── incidents/
│       └── README.md
└── evidence/
    ├── README.md
    └── *.json
```

A future TOS control plane, CI pipeline, AI assistant, or local tool can consume the same interface.

## Local-first tooling

No AI or backend is required.

```bash
node tooling/cli.mjs init ./my-automation
node tooling/cli.mjs doctor ./my-automation
node tooling/cli.mjs inspect ./my-automation
node tooling/cli.mjs audit ./my-automation
node tooling/cli.mjs audit ./my-automation --json
node tooling/cli.mjs audit ./my-automation --strict
npm run verify
```

`doctor` answers whether the project socket is structurally coherent. `audit` answers what is actually proven.

Default audit mode exits nonzero only for `BLOCKING` conformance. `--strict` exits nonzero unless overall conformance is `PROVEN` and is intended for CI/release gates.

As of 0.3.1, a declared evidence directory may contain both TSAL evidence records and project-native JSON evidence. Project-native JSON is ignored by the TSAL evidence parser unless it identifies itself as TSAL evidence; malformed TSAL-shaped evidence still fails closed.

AI MAY help draft, explain, classify, inspect, and propose. Deterministic checks SHOULD enforce anything that can be mechanically proven. AI confidence is not authority.

## Conformance is evidence-layered

TSAL 0.3 does not treat a repository declaration as proof of current production reality.

```text
specification
    ↓
implementation
    ↓
exact candidate
    ↓
deployment
    ↓
runtime
    ↓
reconciliation (when uncertainty exists)
```

Evidence classes are:

- `specification`
- `implementation`
- `candidate`
- `deployment`
- `runtime`
- `reconciliation`
- `attestation`

Conformance statuses are:

- `PROVEN`
- `PARTIAL`
- `UNPROVEN`
- `BLOCKING`
- `NOT_APPLICABLE` for individual checks

Repository configuration cannot prove deployed configuration, and deployed configuration cannot prove current runtime health. For R3 control-plane authority, deployment evidence must come from authoritative external state rather than from configuration intent alone. See [`docs/CONFORMANCE-MODEL.md`](./docs/CONFORMANCE-MODEL.md).

## External state preservation

TSAL 0.3.2 adds a normative rule for provider replacement semantics:

> **Preservation must be explicit when empty configuration can mutate external reality.**

A non-authoritative deployment path must preserve external authority state. Empty, null, default, or omission-like values must not be assumed harmless when a provider may interpret them as delete, revoke, replace, or reset operations. Authority-changing configuration should use a separately controlled path, and material R3 deployment state must be reconciled against authoritative provider state after deployment.

See [`docs/EXTERNAL-STATE-PRESERVATION.md`](./docs/EXTERNAL-STATE-PRESERVATION.md).

## Retry semantics

Automation-contract schema 0.2 separates three mechanisms that schema 0.1 overloaded into one retry object:

```text
dispatch retry
    !=
later scheduler reevaluation
    !=
ambiguous-outcome reconciliation/retry
```

For an ambiguous external side effect, automatic retry remains prohibited until reconciliation proves it safe. See [`docs/RETRY-MODEL.md`](./docs/RETRY-MODEL.md).

## Lifecycle

| Stage | Name | Purpose |
|---|---|---|
| A0 | Discover | Define problem, trigger, inputs, dependencies, side effects. |
| A1 | Define | State success and correct non-execution. |
| A2 | Model | Define work units, state, authority, ambiguity, failure semantics. |
| A3 | Classify Risk | Scale controls to consequence and reversibility. |
| A4 | Contract | Record the automation contract before production authority. |
| A5 | Implement | Build deterministic planning before mutation. |
| A6 | Verify | Prove behavior progressively. |
| A7 | Adversarial Test | Exercise failure, concurrency, crash, ambiguity, recovery. |
| A8 | Cut Over | Transfer authority only after exact-candidate gates. |
| A9 | Operate & Recover | Observe, reconcile, recover, resume safely. |
| A10 | Extract Lessons | Convert incidents into reusable lessons. |
| A11 | Improve Standard | Promote justified lessons into controls or rules. |

See [`AUTOMATION-LIFECYCLE.md`](./AUTOMATION-LIFECYCLE.md).

## Machine-readable foundation

Current schemas:

```text
AUTOMATION-CONTRACT.schema.json          # schema 0.2
schemas/
├── PROJECT-MANIFEST.schema.json         # schema 0.3
├── EVIDENCE.schema.json                 # schema 0.3
├── INCIDENT.schema.json                 # schema 0.2
├── CONFORMANCE-REPORT.schema.json       # schema 0.3
└── legacy/
```

TSAL release versions and individual schema versions are intentionally independent. Legacy schema blobs are preserved under [`schemas/legacy/`](./schemas/legacy/) so older project sockets remain auditable without rewriting history.

## Integration boundaries

- [`interfaces/ADAPTER-CONTRACT.md`](./interfaces/ADAPTER-CONTRACT.md) defines provider/project adapters.
- [`interfaces/CONTROL-PLANE-PROTOCOL.md`](./interfaces/CONTROL-PLANE-PROTOCOL.md) defines neutral semantics a future TOS control plane can implement.

Intended dependency direction:

```text
TOS/control plane -> TSAL interfaces -> project facts
TOS/control plane -> declared project actions
```

not:

```text
TSAL core -> TOS implementation
workload runtime -> TOS/TSAL service as a prerequisite for local safety
```

## Repository structure

```text
TSAL/
├── README.md
├── CHANGELOG.md
├── VERSION
├── tsal.project.json
├── AUTOMATION-LIFECYCLE.md
├── AUTOMATION-CONTRACT.schema.json
├── FAILURE-TEST-MATRIX.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── TERMINOLOGY.md
│   ├── CONFORMANCE-MODEL.md
│   ├── EXTERNAL-STATE-PRESERVATION.md
│   ├── INTEGRATION-MODEL.md
│   ├── RETRY-MODEL.md
│   └── VERSIONING.md
├── evidence/
├── interfaces/
├── schemas/
│   └── legacy/
├── templates/
├── tooling/
├── test/
├── examples/
└── references/xqueue/
```

## Fundamental rules

1. **Truth before convenience.** Operational state represents observed reality.
2. **Unknown is a real state.** Error is not proof that an external side effect did not occur.
3. **Reconcile before ambiguous retry.** Blind retry is prohibited unless safety is proven.
4. **One authority unless coordination is explicit.** Credentials are not execution authority.
5. **Missed work is not automatically catch-up work.** Stale work requires disposition policy.
6. **Bound the blast radius.** Bound work, retries, duration, scope, or equivalent dimensions.
7. **Separate policy from mechanism.** Rules remain inspectable apart from execution plumbing.
8. **Derived state should be reproducible.** Generated plans are not durable truth.
9. **Persist intent where escaped side effects can become ambiguous.**
10. **Production readiness is environment-aware.** Unit tests alone are insufficient.
11. **Owner-reserved actions remain reserved.** Failure does not expand autonomous authority.
12. **Incidents feed improvement.** Repeated failures should promote stronger controls when justified.
13. **AI assists; deterministic controls enforce.**
14. **TSAL core stays consumer-neutral.** New systems attach through interfaces.
15. **Canonical TSAL changes are versioned.** Repository changes beyond version metadata MUST increase the TSAL release version.
16. **Evidence classes are not interchangeable.** A lower truth layer cannot silently prove a higher one.
17. **Conformance is not authority.** Passing an audit does not itself grant production execution authority.
18. **Destructive absence is a side effect.** Empty/null/default configuration that can delete, revoke, replace, or reset external state is mutating authority, not neutral configuration.
19. **Non-authoritative deploys preserve authority.** A deployment path without authority to change an external control plane MUST preserve that external authority state.
20. **Deployment completion requires reconciliation.** Material R3 external authority must be independently observed after deployment before it is considered proven.
21. **TSAL defines correctness; control planes operate.** TOS may observe, decide, repair, verify, and escalate, but those responsibilities do not move into TSAL core.
22. **Workloads remain independently safe.** Loss of TSAL/TOS availability cannot expand workload authority or disable local fail-closed controls.
23. **Detection is not adoption.** A newer TSAL release may be detected automatically, but it cannot silently mutate a workload.
24. **Project releases remain immutable evidence.** If TSAL adoption changes committed workload content, it is a new workload candidate subject to that project's own version and release policy.
25. **Credential is not authority.** Technical reachability never substitutes for a capability grant.
26. **Observation is not mutation.** Read access does not create write authority.
27. **Privileged admission is non-bypassable.** A denial cannot be converted into authority by trying another TOS-managed adapter/tool path.
28. **AI reasoning does not outrank deterministic policy.** Mechanically evaluable privileged controls are enforced mechanically.
29. **Override is additive evidence.** Authorized override may change what happens next; it does not erase what happened before.
30. **Target architecture is not implementation proof.** Consumers must distinguish intended controls from controls actually implemented and evidenced.

## Risk classes

| Class | Typical consequence | Direction |
|---|---|---|
| R0 | Read-only | validation, observability |
| R1 | Local/reversible mutation | state, rollback, implementation evidence |
| R2 | External/reversible mutation | authority, idempotency, bounded retry/reconciliation, runtime evidence |
| R3 | Public, financial, destructive, security-sensitive, difficult-to-reverse | exact-candidate, deployment, runtime, recovery, owner-reserved boundaries, deterministic privileged admission where mechanically evaluable |

## XQueue

XQueue is the first reference workload, not a dependency. [`references/xqueue/LESSONS-LEARNED.md`](./references/xqueue/LESSONS-LEARNED.md) records which lessons were promoted and which implementation choices stayed project-specific.

XQueue dogfooding drove 0.2.1, 0.3.0, 0.3.1, 0.3.2, 0.3.3, and 0.3.4:

- 0.2.1: declared-path validation, complete Git-trackable project sockets, and enforced release versioning.
- 0.3.0: configuration-vs-runtime evidence separation, claim-level conformance, backward-compatible legacy audit, and separated retry semantics.
- 0.3.1: project-native evidence JSON can coexist with TSAL claim records without false blocking.
- 0.3.2: destructive-absence semantics, authority-preserving deployment, and authoritative post-deploy control-plane reconciliation.
- 0.3.3: explicit TSAL/TOS/workload responsibility boundaries and independent standard-versus-workload version evolution.
- 0.3.4: controlled authority terminology plus the generic separation between discretionary control-plane reasoning and deterministic privileged admission.

## Versioning

See [`docs/VERSIONING.md`](./docs/VERSIONING.md) for the enforced release policy and [`CHANGELOG.md`](./CHANGELOG.md) for release history.

## Evolution rule

TSAL should grow like a tree: preserve the trunk, add branches through stable interfaces, and only thicken the trunk when operational evidence demands it.
