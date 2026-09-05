# TSAL

**Top Shelf Automation Lifecycle**

TSAL is a technology-agnostic standard for designing, verifying, deploying, operating, recovering, and improving automations that may perform real-world side effects.

It exists to answer a harder question than “can this task be automated?”:

> **Can this task be automated with bounded authority, truthful state, controlled failure, recoverability, and evidence?**

TSAL was extracted from real operational failures and fixes rather than designed as a theory-first framework. Its first reference workload is XQueue, a production scheduled publisher whose failure modes forced explicit treatment of side effects, deterministic scheduling, concurrency, durable state, ambiguous remote outcomes, stale backlog, reconciliation, and production authority.

TSAL itself contains no X-, Cloudflare-, GitHub-, database-, language-, runtime-, or vendor-specific assumptions.

## Status

Current maturity: **v0.1 — bootstrap standard**

The standard is deliberately small. New rules should be promoted only when repeated evidence or high-impact incidents justify them.

## Core invariant

An automation MUST NOT receive more execution authority than can be bounded, observed, verified, and safely recovered.

A production automation therefore needs, as applicable:

- an explicit goal;
- a source of truth;
- explicit policy;
- defined work units;
- a state model;
- a single or explicitly coordinated execution authority;
- bounded side effects;
- idempotency or equivalent duplicate protection;
- explicit handling of ambiguous outcomes;
- verification and evidence;
- recovery and reconciliation procedures;
- owner-reserved actions where automation cannot decide safely.

## Canonical model

```text
GOAL
  ↓
POLICY
  ↓
SOURCE OF TRUTH
  ↓
PLAN
  ↓
PRECONDITIONS / PREFLIGHT
  ↓
NON-MUTATING SIMULATION
  ↓
AUTHORITY GATE
  ↓
RECORD INTENT
  ↓
EXECUTE BOUNDED WORK
  ↓
┌───────────────┬─────────────────┐
│ KNOWN OUTCOME │ UNKNOWN OUTCOME │
└───────┬───────┴────────┬────────┘
        ↓                ↓
   RECORD RESULT     RECONCILE
        └────────┬───────┘
                 ↓
              VERIFY
                 ↓
          UPDATE LEDGER
                 ↓
          HEALTH / EVIDENCE
                 ↓
          EXTRACT LESSONS
                 ↓
        IMPROVE THE STANDARD
```

## Lifecycle

TSAL defines these stages:

| Stage | Name | Purpose |
|---|---|---|
| A0 | Discover | Define the human/business problem, trigger, inputs, dependencies, and side effects. |
| A1 | Define | State measurable success and correct non-execution. |
| A2 | Model | Define work units, state transitions, authority, and failure semantics. |
| A3 | Classify Risk | Scale controls to consequence and reversibility. |
| A4 | Contract | Record the automation contract before production authority is granted. |
| A5 | Implement | Build deterministic planning before external mutation. |
| A6 | Verify | Prove behavior progressively from static checks through live postconditions. |
| A7 | Adversarial Test | Intentionally exercise failure, concurrency, ambiguity, crash, and recovery paths. |
| A8 | Cut Over | Transfer production authority only after the exact candidate passes gates. |
| A9 | Operate & Recover | Observe invariants, fail closed where required, reconcile, and recover safely. |
| A10 | Extract Lessons | Convert incidents and discoveries into reusable lessons. |
| A11 | Improve Standard | Promote justified lessons into tests, controls, or TSAL rules. |

See [`AUTOMATION-LIFECYCLE.md`](./AUTOMATION-LIFECYCLE.md).

## Repository structure

```text
TSAL/
├── README.md
├── AUTOMATION-LIFECYCLE.md
├── AUTOMATION-CONTRACT.schema.json
├── FAILURE-TEST-MATRIX.md
└── references/
    └── xqueue/
        └── LESSONS-LEARNED.md
```

These are the minimum canonical artifacts for v0.1. Additional policy files should not be created merely to make the repository look complete.

## Normative language

The words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative:

- **MUST / MUST NOT** — required for TSAL conformance.
- **SHOULD / SHOULD NOT** — expected unless a documented reason justifies deviation.
- **MAY** — optional.

## Fundamental rules

1. **Truth before convenience.** Execution state MUST represent observed reality, not the state operators wish existed.
2. **Unknown is a real state.** An error MUST NOT automatically be interpreted as proof that an external side effect did not occur.
3. **Reconcile before retry when outcome is ambiguous.** Blind retry of an uncertain side effect is prohibited unless the operation is proven idempotent.
4. **One authority unless coordination is explicit.** A production side-effect class MUST have one active execution authority or a documented coordination mechanism.
5. **Missed work is not automatically catch-up work.** Stale work requires defined disposition semantics.
6. **Bound the blast radius.** Production executions SHOULD have explicit limits on work count, retries, duration, mutation scope, or equivalent risk dimensions.
7. **Separate policy from mechanism.** Business/operational rules SHOULD be independently inspectable from execution plumbing.
8. **Derived state should be reproducible.** Generated plans SHOULD be rebuildable from source, policy, and durable execution state.
9. **Persist intent before difficult-to-reverse side effects where ambiguity matters.** The system SHOULD be able to distinguish “never attempted” from “attempt may have escaped.”
10. **Production readiness is environment-aware.** Passing unit tests alone MUST NOT be treated as proof that production execution is safe.
11. **Owner-reserved actions remain reserved.** Automation MUST NOT silently expand its own authority in response to failure.
12. **Every meaningful incident should improve either the automation or the standard.** Repeated failures without control promotion are process failures.

## Risk classes

| Class | Typical consequence | Minimum control direction |
|---|---|---|
| R0 | Read-only | Validation, observability |
| R1 | Local/reversible mutation | State tracking, rollback |
| R2 | External/reversible mutation | Idempotency, authority, retry/reconciliation policy |
| R3 | Public, financial, destructive, security-sensitive, or difficult-to-reverse mutation | Strong preflight, bounded execution, adversarial testing, evidence, recovery, owner-reserved boundaries |

Risk classification determines required controls; it does not determine implementation technology.

## What TSAL is not

TSAL is not:

- a scheduler;
- a workflow engine;
- a CI/CD platform;
- an AI-agent framework;
- a vendor abstraction layer;
- a guarantee that all operations can be made exactly-once;
- permission to automate every available action.

TSAL is an engineering and operating standard that can govern any of those systems.

## First reference workload

[`references/xqueue/LESSONS-LEARNED.md`](./references/xqueue/LESSONS-LEARNED.md) maps operational lessons from XQueue into technology-agnostic rules. XQueue is evidence for TSAL, not a dependency of TSAL.

## Evolution rule

A proposed TSAL rule SHOULD answer all of the following:

1. What failure, risk, or repeated pattern justifies the rule?
2. Is it genuinely automation-agnostic?
3. Can it be mechanically enforced or tested?
4. What class of automation needs it?
5. What is the cost of enforcing it?
6. What evidence would justify weakening or removing it?

The standard should become stricter because reality demands it, not because more documentation feels safer.
