# TSAL

**Top Shelf Automation Lifecycle**

TSAL is a local-first, technology-agnostic automation engineering standard with machine-readable project, evidence, incident, and integration boundaries.

> **Can this task be automated with bounded authority, truthful state, controlled failure, recoverability, and evidence?**

Current version: **0.2.0 — platform foundation**

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

Read [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) and [`docs/INTEGRATION-MODEL.md`](./docs/INTEGRATION-MODEL.md).

## Stable project socket

Projects do **not** clone TSAL. They connect to it by exposing:

```text
tsal.project.json
```

That manifest identifies the project, targeted TSAL version, automation contracts, evidence/incident locations, adapters, and optional control-plane connection.

```text
my-automation/
├── tsal.project.json
├── automation.contract.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── RUNBOOK.md
│   └── incidents/
└── evidence/
```

A future TOS control plane, CI pipeline, AI assistant, or local tool can consume the same interface.

## Local-first tooling

No AI or backend is required.

```bash
node tooling/cli.mjs init ./my-automation
node tooling/cli.mjs doctor ./my-automation
node tooling/cli.mjs inspect ./my-automation
npm run verify
```

AI MAY help draft, explain, classify, and inspect. Deterministic checks SHOULD enforce anything that can be mechanically proven.

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

```text
AUTOMATION-CONTRACT.schema.json
schemas/
├── PROJECT-MANIFEST.schema.json
├── EVIDENCE.schema.json
├── INCIDENT.schema.json
└── CONFORMANCE-REPORT.schema.json
```

These deliberately separate promises, project identity, proof, incidents, and evaluations instead of collapsing operational truth into one giant state object.

## Integration boundaries

- [`interfaces/ADAPTER-CONTRACT.md`](./interfaces/ADAPTER-CONTRACT.md) defines provider/project adapters.
- [`interfaces/CONTROL-PLANE-PROTOCOL.md`](./interfaces/CONTROL-PLANE-PROTOCOL.md) defines neutral semantics a future TOS control plane can implement.

Intended dependency direction:

```text
TOS/control plane -> TSAL interfaces -> project facts
```

not:

```text
TSAL core -> TOS implementation
```

## Repository structure

```text
TSAL/
├── README.md
├── VERSION
├── tsal.project.json
├── AUTOMATION-LIFECYCLE.md
├── AUTOMATION-CONTRACT.schema.json
├── FAILURE-TEST-MATRIX.md
├── docs/
├── interfaces/
├── schemas/
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

## Risk classes

| Class | Typical consequence | Direction |
|---|---|---|
| R0 | Read-only | validation, observability |
| R1 | Local/reversible mutation | state, rollback |
| R2 | External/reversible mutation | authority, idempotency, bounded retry/reconciliation |
| R3 | Public, financial, destructive, security-sensitive, difficult-to-reverse | strong preflight, adversarial testing, evidence, recovery, owner-reserved boundaries |

## XQueue

XQueue is the first reference workload, not a dependency. [`references/xqueue/LESSONS-LEARNED.md`](./references/xqueue/LESSONS-LEARNED.md) records which lessons were promoted and which implementation choices stayed project-specific.

## Evolution rule

TSAL should grow like a tree: preserve the trunk, add branches through stable interfaces, and only thicken the trunk when operational evidence demands it.
