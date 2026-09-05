# XQueue Lessons Learned

Reference workload: **XQueue**

Purpose: extract technology-agnostic automation lessons from a real production automation and map them into TSAL rules.

XQueue is a scheduled publisher with public external side effects. It became useful as a TSAL reference not because publishing is unusual, but because production use exposed common automation hazards: side effects, scheduler authority, durable state, concurrency, crash recovery, stale backlog, ambiguous provider outcomes, idempotency, validation, and owner-reserved recovery decisions.

This document intentionally describes the lessons rather than depending on XQueue's implementation.

---

# 1. Scheduling is not the hard part

## Observation

A scheduler can wake an automation reliably while the automation itself remains unsafe.

The real engineering problems were:

- deciding whether work was actually eligible;
- proving the correct target/account;
- preventing duplicate execution;
- surviving crashes;
- preserving durable execution history;
- distinguishing known failure from unknown outcome;
- controlling backlog after missed execution;
- preventing multiple schedulers from owning production simultaneously.

## Generalized lesson

> **A trigger is permission to evaluate, not permission to mutate.**

## TSAL promotion

The executor MUST independently evaluate eligibility and authority after trigger delivery.

---

# 2. Source, policy, generated plan, and execution history are different things

## Observation

XQueue became easier to reason about once four concepts were separated:

1. authored desired content/input;
2. production scheduling/publishing policy;
3. generated queue/plan;
4. durable record of what actually happened.

Conflating any two created drift or made recovery dangerous.

## Generalized lesson

> **Desired state, policy, derived plans, and observed execution history MUST remain semantically distinct.**

## TSAL promotion

- Source of truth MUST be explicit.
- Policy SHOULD be independently inspectable.
- Derived plans SHOULD be reproducible.
- Execution history MUST preserve observed truth.

---

# 3. Generated state should not become a second source of truth

## Observation

A generated schedule is useful operationally, but manual editing creates an alternative truth that cannot be reliably regenerated.

## Generalized lesson

> **If an artifact can be deterministically derived, repair the source/policy and regenerate it rather than hand-editing the artifact.**

## TSAL promotion

Derived artifacts SHOULD be reproducible from authoritative source, policy, and durable execution state.

---

# 4. Dry-run and live execution are different authority levels

## Observation

Safe inspection required a non-mutating path that could answer “what would happen now?” without performing the public side effect.

## Generalized lesson

> **Planning and mutation should be separable.**

## TSAL promotion

R2/R3 automations SHOULD expose a non-mutating simulation or preview path where technically feasible. Production mutation SHOULD require an explicit authority boundary rather than being the default inspection path.

---

# 5. One invocation should have a bounded blast radius

## Observation

When a machine or scheduler misses work, an unbounded “catch up everything” policy can convert downtime into a burst of harmful side effects.

## Generalized lesson

> **Recovery work is still production work and needs limits.**

## TSAL promotion

Side-effecting automations SHOULD bound work per invocation, retry count, execution duration, mutation scope, or equivalent risk dimensions.

---

# 6. Correct workers can still produce an incorrect result concurrently

## Observation

Two workers can each make a locally correct decision and still duplicate the same external side effect.

## Generalized lesson

> **Concurrency is a correctness property, not merely a performance property.**

## TSAL promotion

R2/R3 systems MUST define a concurrency model and use locking, leasing, transactions, compare-and-set, idempotency keys, or another explicit coordination mechanism where duplicate selection is possible.

---

# 7. Exactly one uncoordinated production authority

## Observation

Keeping more than one scheduler enabled for redundancy can instead create duplicate execution if both believe they own the same work.

## Generalized lesson

> **Redundant triggers without coordination create split authority.**

## TSAL promotion

Exactly one independent production authority MUST be active for a side-effect class unless coordination semantics are explicitly designed and tested.

---

# 8. State writes must survive crashes

## Observation

Automation processes can terminate between any two instructions. A partially written execution ledger can destroy the information needed for idempotency and recovery.

## Generalized lesson

> **Durable execution state is part of the safety boundary.**

## TSAL promotion

State transitions for side-effecting systems SHOULD use atomic, transactional, append-only, or equivalent crash-safe persistence appropriate to the storage mechanism.

---

# 9. Record intent before an ambiguous external side effect

## Observation

There is a crucial difference between:

```text
never attempted
```

and:

```text
attempt may have escaped to the provider
```

If the process only records state after success, a crash or lost response can erase that distinction.

## Generalized lesson

> **For externally visible operations with ambiguous request/response boundaries, record durable intent before the request can escape.**

## TSAL promotion

R2/R3 implementations SHOULD persist a prepared/in-flight intent before a difficult-to-reverse side effect when ambiguity is possible.

---

# 10. An API error does not prove non-execution

## Observation

A provider may accept a request but the client may lose the acknowledgement. Locally this looks like an error even though the side effect exists remotely.

Blind retry can duplicate the action.

## Generalized lesson

> **Transport failure and business failure are not the same thing.**

## TSAL promotion

An external request with uncertain outcome MUST transition to an explicit unknown/ambiguous state unless provider-level idempotency independently guarantees safe replay.

---

# 11. UNKNOWN is a first-class state

## Observation

A binary success/failure model could not faithfully represent ambiguous publication outcomes.

## Generalized lesson

The state model must be capable of expressing:

```text
SUCCESS
KNOWN FAILURE
UNKNOWN
```

Unknown is not a temporary synonym for failure.

## TSAL promotion

When remote side effects may be ambiguous, `UNKNOWN` or an equivalent state MUST be modeled explicitly and MUST NOT silently transition into retryable failure.

---

# 12. Reconciliation is part of automation, not an exception to it

## Observation

Some failures cannot be resolved safely from local state. The authoritative answer exists only in the remote system or requires an operator to inspect external reality.

## Generalized lesson

> **A reliable automation needs a defined path from local uncertainty back to verified truth.**

## TSAL promotion

R2/R3 systems with ambiguous effects MUST define reconciliation semantics. Reconciliation MAY be automated when authoritative evidence is machine-readable and unambiguous; otherwise it MUST escalate to an authorized operator.

---

# 13. Retry policy depends on what is known

## Observation

Different failures support different retry decisions:

- known pre-request failure may be safely retryable;
- explicit provider rejection may be non-retryable or delayed;
- rate limiting may require bounded backoff;
- ambiguous post-request failure must not be blindly retried.

## Generalized lesson

> **“Retry on error” is not a policy.**

## TSAL promotion

Retry rules MUST be based on failure semantics and MUST be bounded. Unknown outcomes MUST be reconciled before replay unless idempotency proves replay safe.

---

# 14. Stale backlog needs disposition, not panic

## Observation

Missed scheduled work may no longer have the same business value later. Automatically backfilling it can create a burst, publish obsolete work, or distort an intended cadence.

Useful dispositions include:

- defer;
- skip;
- retain for deliberate later execution;
- cancel;
- reconcile where remote state is uncertain.

## Generalized lesson

> **Missed work does not automatically become catch-up work.**

## TSAL promotion

Automations with time-sensitive work MUST define stale-work semantics and permitted dispositions.

---

# 15. Different dispositions must remain different states

## Observation

A work item that was intentionally skipped is not equivalent to one that succeeded. A deferred item is not completed. An ambiguous item is not failed.

## Generalized lesson

```text
COMPLETED ≠ SKIPPED
SKIPPED   ≠ DEFERRED
DEFERRED  ≠ FAILED
FAILED    ≠ UNKNOWN
UNKNOWN   ≠ COMPLETED
```

## TSAL promotion

The execution ledger MUST represent operational truth, not merely whether an item should stop appearing in the active queue.

---

# 16. Never “repair” health by lying to the ledger

## Observation

Deleting or editing durable state can make a health check green while destroying duplicate protection and historical truth.

## Generalized lesson

> **A safety gate should be satisfied by repairing reality, not by falsifying evidence.**

## TSAL promotion

Recovery procedures MUST preserve execution history unless an explicit, audited state-reconstruction process establishes a new authoritative baseline.

---

# 17. Production validation is different from authoring validation

## Observation

A development environment may legitimately lack assets, credentials, runtime bindings, or scheduler configuration that production requires.

## Generalized lesson

> **The environment that creates an artifact and the environment that executes its side effect have different readiness requirements.**

## TSAL promotion

R2/R3 systems SHOULD have environment-aware production validation rather than treating development validation as production proof.

---

# 18. Preflight should be non-mutating

## Observation

A production readiness check is much safer if it can test configuration, state, identity, assets, deterministic generation, health, and dry-run behavior without exercising the live side effect.

## Generalized lesson

> **Readiness verification should not require the dangerous operation it is intended to authorize.**

## TSAL promotion

Production preflight SHOULD be non-mutating and MUST fail when a required production invariant cannot be established.

---

# 19. Unit tests do not prove production readiness

## Observation

Code can pass tests while the production scheduler, credentials, target identity, assets, state, or runtime configuration is wrong.

## Generalized lesson

Verification must climb a ladder:

```text
code correctness
→ integration correctness
→ environment readiness
→ bounded live behavior
→ observed postcondition
```

## TSAL promotion

R2/R3 cutover requires environment-aware evidence in addition to code tests.

---

# 20. Successful execution needs postcondition evidence

## Observation

“No exception” only proves that the local code did not report a failure. It does not necessarily prove the intended remote result exists.

## Generalized lesson

> **Execution evidence and outcome evidence are different.**

## TSAL promotion

High-consequence automations SHOULD verify the intended postcondition independently of the command's exit status when feasible.

---

# 21. Correct non-execution is a success state

## Observation

Most scheduler invocations should often do nothing because no work is eligible.

Treating idle as failure pressures developers to force work when none should happen.

## Generalized lesson

> **A safe automation must be able to say “nothing should happen” and be correct.**

## TSAL promotion

A1 success definitions MUST include correct non-execution.

---

# 22. Owner-reserved actions are a feature

## Observation

Some decisions are intentionally outside autonomous authority: resolving uncertainty, overriding safety gates, changing production identity, accepting stale-work disposition, or expanding mutation scope.

## Generalized lesson

> **Maximum autonomy is not the objective; trustworthy autonomy is.**

## TSAL promotion

Automation contracts MUST explicitly identify owner-reserved actions for R2/R3 systems. The automation MUST NOT silently assume those authorities because execution is blocked.

---

# 23. Negative tests create confidence that happy paths cannot

## Observation

The most consequential bugs were not “can the normal request succeed?” They were questions such as:

- what if it executes twice?
- what if the provider accepted it but the acknowledgement disappears?
- what if the scheduler wakes after downtime?
- what if state is corrupted?
- what if two authorities are active?

## Generalized lesson

> **Automation safety is primarily demonstrated at boundaries and failure transitions.**

## TSAL promotion

R2/R3 systems SHOULD maintain adversarial tests for all material failure modes, with R3 ambiguity testing mandatory when applicable.

See [`../../FAILURE-TEST-MATRIX.md`](../../FAILURE-TEST-MATRIX.md).

---

# 24. Recovery must be designed before the incident

## Observation

Without predefined recovery semantics, operators tend to improvise under pressure: manually rerun commands, delete state, bulk-mark work complete, or enable multiple execution paths.

## Generalized lesson

> **An automation without a recovery model is only designed for the period before its first serious failure.**

## TSAL promotion

R2/R3 automation contracts MUST define fail-closed conditions, recovery procedure, and a resume gate.

---

# 25. Operational incidents should improve the engineering system

## Observation

Fixing one scheduler bug, retry bug, or backlog bug locally provides limited value if the same class of mistake can appear in the next automation.

## Generalized lesson

Every meaningful incident should produce some combination of:

```text
code fix
+ regression test
+ invariant
+ runbook improvement
+ reusable TSAL lesson
```

## TSAL promotion

TSAL A10/A11 formalize lesson extraction and standard promotion.

---

# Control mapping

| XQueue-derived lesson | TSAL control |
|---|---|
| Trigger delivery is not authorization | Eligibility + authority gate |
| Source/policy/plan/history separation | A2 model + A4 contract |
| Generated queue must be reproducible | Derived-artifact rule |
| Dry run separated from live | A5 implementation control |
| One item/bounded work | Blast-radius budget |
| Concurrent publisher protection | Concurrency model |
| Only one scheduler authority | Authority invariant |
| Crash-safe execution state | Durable state/write safety |
| Persist attempt intent | Intent-before-side-effect control |
| Provider error may be ambiguous | UNKNOWN state |
| Blind retry can duplicate | Retry + reconciliation rule |
| Missed work can become stale | Backlog policy |
| Skip/defer/complete differ | Truthful state machine |
| Do not delete state to clear health | State-integrity rule |
| Production assets/identity matter | Environment-aware preflight |
| Tests alone are insufficient | Verification ladder |
| Successful command != verified outcome | Postcondition verification |
| Idle can be correct | Correct non-execution definition |
| Some decisions stay human | Owner-reserved actions |
| Failure-path tests matter | Adversarial matrix |
| Recovery cannot be improvised | Recovery contract |
| Incident lessons should compound | A10/A11 learning loop |

---

# What was deliberately NOT promoted

Not every XQueue implementation choice belongs in TSAL.

TSAL does **not** require:

- a particular programming language;
- a particular package manager;
- a local JSON state file;
- cron, systemd, Cloudflare, or any scheduler product;
- Markdown as a source format;
- a 15-minute cadence;
- a specific stale threshold;
- one work item per run in all systems;
- a particular API client;
- a particular cloud provider.

Those are implementation decisions. TSAL promotes only the underlying control objective.

---

# Lesson extraction summary

The deepest XQueue lesson is:

```text
AUTOMATION ≠ SCHEDULING

AUTOMATION =
  TRUTH
+ POLICY
+ STATE
+ AUTHORITY
+ BOUNDS
+ SIDE-EFFECT SEMANTICS
+ VERIFICATION
+ RECOVERY
+ LEARNING
```

XQueue is the first reference workload because it forced these concepts to become concrete. Future reference workloads should challenge TSAL in different domains and either confirm, refine, or falsify its assumptions.
