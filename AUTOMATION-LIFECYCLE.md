# TSAL Automation Lifecycle

Version: **0.1**

This document defines the canonical lifecycle for a TSAL-conformant automation.

The lifecycle is intentionally technology-agnostic. A conformant implementation may use scripts, workers, queues, containers, serverless functions, CI/CD systems, databases, cron, systemd, event buses, workflow engines, AI agents, or other execution substrates.

## Lifecycle overview

```text
A0 DISCOVER
  ↓
A1 DEFINE
  ↓
A2 MODEL
  ↓
A3 CLASSIFY RISK
  ↓
A4 CONTRACT
  ↓
A5 IMPLEMENT
  ↓
A6 VERIFY
  ↓
A7 ADVERSARIAL TEST
  ↓
A8 CUT OVER
  ↓
A9 OPERATE + RECOVER
  ↓
A10 EXTRACT LESSONS
  ↓
A11 IMPROVE STANDARD
  └──────────────→ next automation / next version
```

The stages are sequential for initial production authorization, but mature systems may loop between A5–A11 as they evolve.

---

## A0 — Discover

### Purpose

Identify the actual human or business problem before selecting an automation mechanism.

### Required questions

The designer MUST identify:

- the desired outcome;
- the trigger or condition that begins evaluation;
- authoritative inputs;
- external dependencies;
- intended side effects;
- unintended side effects that must be prevented;
- current manual process, if any;
- what remains intentionally human-controlled.

### Trigger classes

Common trigger classes include:

- schedule;
- event;
- state change;
- threshold;
- webhook;
- dependency completion;
- manual approval;
- operator command.

### Exit criteria

A0 is complete when the problem can be described without naming a specific implementation technology.

---

## A1 — Define

### Purpose

Define success precisely enough that the automation can later be verified.

### Rule

Success MUST describe the business/operational outcome, not merely execution of the mechanism.

Bad:

> The cron job runs every 15 minutes.

Better:

> Every eligible work item is evaluated according to current policy; authorized work executes without silent loss or uncontrolled duplication; uncertain outcomes are surfaced for reconciliation; ineligible work does not mutate production.

### Required definitions

The automation SHOULD define:

- successful execution;
- successful non-execution;
- blocked execution;
- known failure;
- ambiguous outcome;
- recovery success;
- evidence sufficient to prove each of the above.

### Exit criteria

A1 is complete when an independent reviewer could determine whether a run was correct without relying on the implementer's intent.

---

## A2 — Model

### Purpose

Model work, state, authority, and transitions before external mutation is implemented.

### Work unit

The automation MUST define its smallest independently executable **work item**.

Examples:

- one publication;
- one invoice;
- one deployment;
- one backup;
- one migration;
- one notification;
- one bounded agent work order.

### State model

A production automation MUST distinguish states sufficiently to preserve operational truth.

A generic model is:

```text
DISCOVERED
   ↓
ELIGIBLE
   ↓
PLANNED
   ↓
PREPARED
   ↓
EXECUTING
  /   |    \
DONE FAILED UNKNOWN
       |      |
       ↓      ↓
     RETRY  RECONCILE
```

Optional states may include:

- BLOCKED;
- DEFERRED;
- SKIPPED;
- CANCELLED;
- SUPERSEDED;
- EXPIRED.

### Critical rule

`UNKNOWN` MUST remain distinct from `FAILED` when an external side effect may have occurred but cannot be proven.

### Authority model

The automation MUST define who or what may initiate production mutation.

Unless a coordination protocol is explicitly defined, exactly one authority MUST be active for a given side-effect class.

### Exit criteria

A2 is complete when all legal state transitions, illegal transitions, and production authorities are inspectable.

---

## A3 — Classify Risk

### Purpose

Apply controls proportional to consequence.

### Classes

#### R0 — Read-only

No persistent mutation outside ephemeral computation.

Examples: reports, audits, discovery, calculations.

Expected controls:

- input validation;
- deterministic logic where practical;
- observability.

#### R1 — Local or easily reversible mutation

Mutation is contained and rollback is straightforward.

Expected controls add:

- durable state or journal where useful;
- rollback or restore procedure;
- bounded mutation scope.

#### R2 — External but reversible mutation

The automation changes another system and mistakes can create operational cost.

Expected controls add:

- explicit authority;
- duplicate protection or idempotency strategy;
- provider-aware retry policy;
- reconciliation path;
- authenticated target identity where relevant.

#### R3 — High-consequence mutation

Public, financial, destructive, security-sensitive, legally consequential, production-critical, or difficult-to-reverse actions.

Expected controls add:

- strong environment-aware preflight;
- explicit owner-reserved actions;
- bounded execution budgets;
- adversarial failure testing;
- exact-candidate evidence where versioned code is involved;
- independent or separate postcondition verification where practical;
- tested recovery path;
- kill switch / authority revocation.

### Rule

Risk classification MUST be based on consequences, not implementation complexity.

---

## A4 — Contract

### Purpose

Record the automation's operating contract before production authorization.

The canonical machine-readable shape is defined in [`AUTOMATION-CONTRACT.schema.json`](./AUTOMATION-CONTRACT.schema.json).

The contract MUST identify at minimum:

- automation identity;
- goal;
- trigger;
- source of truth;
- work item;
- risk class;
- authority;
- side effects;
- state storage;
- ambiguity handling;
- retry semantics;
- verification;
- recovery;
- owner-reserved actions.

The contract SHOULD be version-controlled when the automation itself is version-controlled.

### Exit criteria

A4 is complete when production authority can be reviewed from the contract without reverse-engineering the implementation.

---

## A5 — Implement

### Purpose

Build the deterministic decision core before external mutation.

### Preferred decomposition

```text
SOURCE
  ↓
VALIDATION
  ↓
POLICY
  ↓
ELIGIBILITY
  ↓
SELECTION
  ↓
EXECUTION PLAN
  ↓
SIDE-EFFECT ADAPTER
```

The source/policy/planning path SHOULD be executable without performing production mutation.

### Requirements

Where applicable, implementations SHOULD provide:

- deterministic plan generation;
- non-mutating validation;
- dry-run or preview mode;
- explicit live/mutating path;
- durable execution ledger;
- atomic or transactionally safe state transitions;
- bounded concurrency;
- bounded retries;
- structured observability.

### Side-effect rule

For difficult-to-reverse external operations where request/response ambiguity is possible, intent SHOULD be durably recorded before the request escapes the system.

### Exit criteria

A5 is complete when normal execution and state transitions are implemented but production authority has not yet been granted.

---

## A6 — Verify

### Purpose

Progressively establish evidence from cheap deterministic checks to real-world postconditions.

### Verification ladder

```text
STATIC VALIDATION
       ↓
UNIT TESTS
       ↓
STATE-MACHINE TESTS
       ↓
INTEGRATION TESTS
       ↓
NON-MUTATING DRY RUN
       ↓
PRODUCTION PREFLIGHT
       ↓
BOUNDED CANARY
       ↓
POSTCONDITION VERIFICATION
       ↓
RUNTIME HEALTH
```

Not every R0 automation requires every rung. R2/R3 automations SHOULD justify omissions.

### Critical distinctions

- Passing tests does not prove environment readiness.
- Successful deployment does not prove correct production behavior.
- A zero exit code does not by itself prove the intended side effect occurred.
- A provider error does not by itself prove the side effect did not occur.

### Exit criteria

A6 is complete when required non-mutating and environment-aware gates pass for the exact candidate intended for cutover.

---

## A7 — Adversarial Test

### Purpose

Prove that dangerous failure paths fail safely.

The baseline scenarios are defined in [`FAILURE-TEST-MATRIX.md`](./FAILURE-TEST-MATRIX.md).

Testing SHOULD cover, where relevant:

- duplicate invocation;
- concurrent invocation;
- crash before side effect;
- crash during side effect;
- crash after remote acceptance but before local acknowledgement;
- rate limiting;
- authentication failure;
- wrong target identity/environment;
- malformed or missing state;
- stale backlog;
- dependency outage;
- partial execution;
- retry exhaustion;
- scheduler duplication;
- clock/timezone anomalies;
- unexpected provider responses.

### Rule

For R3 automation, at least one test MUST demonstrate that an ambiguous side-effect outcome does not trigger an unsafe blind retry unless idempotency is independently guaranteed.

### Exit criteria

A7 is complete when required failure-path controls have executable evidence, not merely documentation.

---

## A8 — Cut Over

### Purpose

Transfer production authority to the verified candidate.

### Canonical cutover sequence

1. Freeze or identify the exact candidate.
2. Confirm source/repository state.
3. Verify runtime and dependencies.
4. Validate production configuration.
5. Validate credentials and target identity.
6. Validate durable state/ledger.
7. Run required tests.
8. Run adversarial tests required for the risk class.
9. Regenerate derived artifacts deterministically where applicable.
10. Run runtime health.
11. Run non-mutating execution simulation.
12. Verify production authority configuration.
13. Verify kill switch / authority revocation.
14. Execute one bounded canary or smallest safe live unit when applicable.
15. Verify the remote/local postcondition.
16. Record evidence.
17. Enable continuing production authority.

### Rule

Cutover MUST NOT silently leave two independent authorities active for the same side-effect class unless coordination is part of the design.

### Exit criteria

A8 is complete when the intended authority is active, conflicting authorities are absent or coordinated, and initial production behavior is verified.

---

## A9 — Operate & Recover

### Purpose

Maintain correctness after initial success.

### Operating loop

```text
OBSERVE
  ↓
COMPARE TO INVARIANTS
  ↓
HEALTHY? ── yes ──→ CONTINUE
  |
  no
  ↓
BOUND / FAIL CLOSED
  ↓
CLASSIFY
  ↓
RECOVER OR RECONCILE
  ↓
VERIFY
  ↓
RESUME
```

### Backlog rule

Stale or missed work MUST NOT automatically imply catch-up execution when catching up can increase risk or violate business intent.

The automation MUST define permitted dispositions for stale work, such as:

- retry;
- defer;
- skip;
- cancel;
- replace;
- escalate;
- reconcile.

### State-integrity rule

Operators MUST NOT falsify durable execution history merely to clear a health gate.

### Exit criteria

A9 never permanently completes while the automation remains in production.

---

## A10 — Extract Lessons

### Purpose

Convert operational experience into reusable engineering knowledge.

Every meaningful incident SHOULD capture:

1. **Incident** — what happened?
2. **Expected** — what should have happened?
3. **Detection** — how was it discovered?
4. **Root cause** — why could the system enter this state?
5. **Control failure** — what existing control should have prevented or detected it?
6. **New invariant** — what must be true in the future?
7. **Enforcement** — can software enforce it?
8. **Negative test** — how can the failure be reproduced intentionally?
9. **Recovery** — how is safe state restored?
10. **Generalization** — does the lesson apply beyond this project?
11. **Promotion** — local fix, project rule, TSAL candidate, or broader governance rule?

### Root-cause rule

A code defect alone is not a sufficient root cause when a missing control allowed the defect to reach production.

---

## A11 — Improve Standard

### Purpose

Make each automation improve future automation work.

### Promotion ladder

```text
OBSERVATION
    ↓
LESSON
    ↓
REPEATED OR HIGH-IMPACT?
   / \
 no  yes
 |     ↓
DOC  PRINCIPLE
        ↓
MECHANICALLY ENFORCEABLE?
   /          \
 no           yes
 |             ↓
SOP          CONTROL / TEST
                 ↓
GENERIC ACROSS AUTOMATIONS?
        /               \
      no                yes
      |                  ↓
PROJECT RULE         TSAL RULE
```

### Anti-bureaucracy rule

TSAL SHOULD NOT add a new normative rule solely because a hypothetical failure can be imagined. New rules require operational evidence, repeated patterns, or clearly high-consequence risk.

---

# Canonical execution invariants

A conformant production automation SHOULD be able to answer the following at any time:

1. What is the source of truth?
2. What policy is active?
3. What exact work is eligible?
4. What work is executing now?
5. Who/what currently holds execution authority?
6. What side effects are possible?
7. What is the durable history of attempted and completed work?
8. Which outcomes are unknown or require reconciliation?
9. What retries remain permitted?
10. What stale work exists and what dispositions are allowed?
11. How can production authority be stopped?
12. What evidence proves the last claimed success?

If an R2/R3 system cannot answer these questions, it SHOULD be treated as operationally incomplete.

# Definition of Done

An automation SHOULD NOT be declared production-complete until all applicable items are satisfied:

```text
[ ] Goal is explicit.
[ ] Source of truth is explicit.
[ ] Policy is explicit.
[ ] Work unit is explicit.
[ ] Risk class is assigned.
[ ] State machine is defined.
[ ] Side effects are identified.
[ ] Production authority is defined.
[ ] Concurrency behavior is defined.
[ ] Idempotency/duplicate-protection strategy exists.
[ ] Intent recording exists where ambiguity requires it.
[ ] Unknown/ambiguous outcomes have explicit semantics.
[ ] Reconciliation exists where required.
[ ] Retry semantics are bounded.
[ ] Backlog semantics exist.
[ ] Dry-run/preview exists where feasible.
[ ] Production preflight exists for R2/R3.
[ ] Negative tests exist for material failure modes.
[ ] Recovery procedures exist.
[ ] Kill switch / authority revocation exists for R2/R3.
[ ] Evidence is observable and retained appropriately.
[ ] Owner-reserved actions are explicit.
[ ] Production failure behavior is defined.
[ ] Initial live execution has been verified.
[ ] Lessons from implementation/cutover have been captured.
```

# Master principle

> **Automate execution only to the extent that correctness, authority, state, failure, and recovery can be bounded and evidenced.**
