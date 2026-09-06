# TSAL Failure Test Matrix

Version: **0.2**

This document defines a reusable adversarial test catalog for automation systems.

It is not a requirement to execute every scenario against every automation. Risk class, architecture, side effects, and credible failure modes determine applicability. R2 and R3 systems SHOULD explicitly mark each material scenario as **tested**, **not applicable**, or **deferred with rationale**.

## Test objective

Happy-path tests answer:

> Can the automation perform the intended operation?

Failure-path tests answer:

> When reality stops behaving as expected, can the automation avoid making the situation worse?

TSAL treats the second question as essential for side-effecting systems.

## Expected safe outcomes

A failure test should normally prove one or more of these behaviors:

- **BLOCK** — execution never begins because a prerequisite is false.
- **FAIL CLOSED** — production mutation stops rather than guessing.
- **RETRY SAFELY** — retry occurs only when non-execution is known or idempotency is guaranteed.
- **RECONCILE** — uncertain local state is compared with authoritative remote reality.
- **BOUND** — only the permitted amount of work can be affected.
- **ROLL BACK / COMPENSATE** — a known reversible mutation is safely undone.
- **ESCALATE** — an owner-reserved decision is required.
- **DEGRADE READ-ONLY** — observation may continue while mutation authority is withheld.
- **PRESERVE** — a deployment path without authority over an external state class leaves that state unchanged.

---

# Baseline matrix

| ID | Failure scenario | Risk exposed | Expected control / assertion | Typical applicability |
|---|---|---|---|---|
| F01 | Duplicate trigger delivery | Duplicate side effects | Duplicate trigger MUST NOT create duplicate effect beyond declared semantics | R2/R3 |
| F02 | Concurrent workers select same item | Race / duplicate mutation | Lock, lease, compare-and-set, transaction, idempotency key, or equivalent coordination prevents unsafe duplication | R2/R3 |
| F03 | Two independent schedulers are active | Split authority | Health/preflight detects conflicting authority or coordination safely arbitrates | R2/R3 |
| F04 | Process crashes before external request | Lost progress | Work remains safely retryable; ledger distinguishes prepared from escaped request | R1–R3 |
| F05 | Process crashes while request is in flight | Ambiguous outcome | Item transitions to UNKNOWN/reconciliation rather than blind retry | R2/R3 |
| F06 | Remote system accepts request but response is lost | Duplicate-on-retry risk | Automatic retry is blocked unless provider-level idempotency proves safety | R2/R3 |
| F07 | Process crashes after remote acknowledgement but before local final state write | Local/remote divergence | Recovery reconciles remote success and prevents duplicate effect | R2/R3 |
| F08 | Provider returns explicit validation rejection | Incorrect retry | Known rejection is recorded as known failure; retry follows policy only | R2/R3 |
| F09 | Provider returns authentication/authorization failure | Wrong credentials / unsafe loops | Mutation stops; credentials/authority must be repaired before resume | R2/R3 |
| F10 | Credentials point at wrong account, tenant, project, or environment | Correct action against wrong target | Preflight verifies target identity before mutation | R2/R3 |
| F11 | Provider rate-limits execution | Retry storm / cost / ban | Retry is bounded and backoff/pacing is honored; no manual loop is required | R2/R3 |
| F12 | Provider returns transient 5xx | Ambiguous vs known failure confusion | System distinguishes pre-request/known rejection from potentially escaped side effect | R2/R3 |
| F13 | Provider response schema changes unexpectedly | False success / parser crash | Unexpected response cannot be silently treated as success | R2/R3 |
| F14 | Network unavailable before request | Availability | Known non-execution remains retryable according to policy | R2/R3 |
| F15 | Network fails after bytes may have left process | Ambiguity | UNKNOWN path is used unless operation is proven idempotent | R2/R3 |
| F16 | Durable state file/record is malformed | Lost idempotency history | Mutation stops; state is preserved for recovery rather than deleted to clear the error | R1–R3 |
| F17 | Durable state is missing unexpectedly | Duplicate historical work | System fails closed or restores/reconciles before mutation | R2/R3 |
| F18 | State write is interrupted | Corruption / partial state | Atomic/transactional write semantics preserve last valid state | R1–R3 |
| F19 | Source of truth is malformed | Invalid work creation | Validation blocks plan/execution | All |
| F20 | Generated plan is stale relative to source/policy | Executing obsolete intent | Plan is regenerated or freshness is proven before mutation | R1–R3 |
| F21 | Derived artifact is manually edited | Drift | Deterministic regeneration detects/overwrites drift; generated artifact is not treated as authority | R1–R3 |
| F22 | Required dependency is unavailable | Partial execution | Preflight/health blocks or safely degrades according to contract | All |
| F23 | Required local/remote asset is missing | Incomplete side effect | Production validation blocks execution | R1–R3 |
| F24 | Scheduled invocation is missed | Stale work | System applies explicit backlog policy rather than assuming catch-up | R1–R3 |
| F25 | Machine resumes after long downtime | Backlog flush | Per-run work limit and stale-work gate prevent uncontrolled burst | R1–R3 |
| F26 | Work item exceeds stale/grace threshold | Business intent drift | Item is blocked for explicit disposition when required | R1–R3 |
| F27 | Operator marks unresolved work successful without evidence | Ledger falsification | State model or procedure prevents/flags false completion | R1–R3 |
| F28 | Operator deletes state to “fix” health | History destruction | Recovery documentation/tests establish that deletion is not a valid repair path | R1–R3 |
| F29 | Retry budget is exhausted | Infinite loop | Item becomes blocked/failed/escalated according to contract | R1–R3 |
| F30 | Execution exceeds time budget | Hung worker / overlapping run | Timeout and coordination prevent unbounded overlapping mutation | R1–R3 |
| F31 | Execution exceeds item-count budget | Excess blast radius | Executor stops at declared maximum work per run | R1–R3 |
| F32 | Timezone configuration is wrong | Wrong eligibility time | Schedule tests assert canonical timezone semantics | Scheduled systems |
| F33 | DST transition occurs | Duplicate/missed schedule | Schedule semantics are deterministic across offset changes | Scheduled systems |
| F34 | System clock differs materially from trusted time | Premature/stale execution | Health detects unacceptable skew or design avoids unsafe local-time dependence | Time-sensitive R2/R3 |
| F35 | Policy changes while work is pending | Obsolete authorization | Selection/execution uses clearly defined policy version/freshness semantics | R1–R3 |
| F36 | New deployment runs against old state format | Migration incompatibility | Version check/migration gate blocks unsafe interpretation | Stateful systems |
| F37 | Old deployment runs after new deployment gains authority | Split-brain versioning | Authority/candidate identity prevents stale executor from mutating production | R2/R3 |
| F38 | Logging/observability destination fails | Invisible execution | Critical correctness MUST NOT depend solely on logs; durable state/evidence remains authoritative | R1–R3 |
| F39 | Notification/alert fails | Silent degraded state | Health remains queryable; alert failure does not erase failure state | R2/R3 |
| F40 | Recovery procedure is executed twice | Recovery duplication | Recovery is idempotent, guarded, or detects already-recovered state | R2/R3 |
| F41 | Reconciliation says remote effect exists | Local state incomplete | Ledger records verified remote identity without re-executing effect | R2/R3 |
| F42 | Reconciliation proves remote effect does not exist | Safe retry eligibility | Work returns to an explicitly retryable state under owner/policy authority | R2/R3 |
| F43 | Reconciliation cannot determine truth | Persistent uncertainty | System remains blocked/escalated; uncertainty is not coerced into success/failure | R2/R3 |
| F44 | Kill switch is activated during normal operation | Authority revocation | New mutations cease within the documented boundary | R2/R3 |
| F45 | Automation attempts an owner-reserved action | Authority expansion | Action is rejected or requires explicit owner authorization | R2/R3 |
| F46 | Configuration enables a broader scope than contract permits | Blast-radius expansion | Preflight/contracts reject unauthorized scope expansion | R2/R3 |
| F47 | Work selection returns zero eligible items | False failure / forced work | Correct non-execution is reported as healthy idle behavior | All |
| F48 | A previously completed item reappears in source | Duplicate historical work | Ledger/idempotency identity prevents unintended re-execution | R1–R3 |
| F49 | Partial batch succeeds before later item fails | Mixed outcome | Per-item state remains truthful; successful items are not repeated blindly | Batch R1–R3 |
| F50 | External side effect succeeds but postcondition differs from expectation | False positive | Postcondition verification detects semantic failure and invokes recovery/escalation | R2/R3 |
| F51 | Ordinary deployment contains an empty/null/default authority field that provider semantics interpret as replacement/deletion | Destructive absence / silent authority loss | Non-authoritative deploy path MUST preserve the external authority state; destructive empty/default declarations are rejected | R2/R3 with provider-managed control plane |
| F52 | Deploy command succeeds but authoritative provider state differs from intended authority | False deployment success / external drift | Post-deploy provider read detects mismatch and conformance becomes BLOCKING until reconciled | R3 deployment authority |

---

# Mandatory ambiguity test for R3

Every R3 automation with a non-idempotent or uncertain external side effect MUST demonstrate this scenario in a safe environment or controlled test double:

```text
1. Persist execution intent.
2. Begin external side effect.
3. Simulate remote acceptance.
4. Suppress/drop the success acknowledgement.
5. Confirm local executor cannot prove outcome.
6. Confirm state becomes UNKNOWN / NEEDS_RECONCILIATION.
7. Confirm automatic duplicate retry does not occur.
8. Reconcile against authoritative remote state.
9. Confirm the resulting transition is truthful.
```

If the system instead relies on provider-supported idempotency keys, the test MUST demonstrate that replaying the same operation cannot create a second side effect.

---

# Scheduler-specific suite

Scheduled systems SHOULD additionally prove:

- repeated scheduler wakeups when nothing is due are safe;
- a scheduler wakeup is not itself treated as authorization to perform work;
- eligibility is computed by the automation, not assumed from trigger delivery;
- late invocation inside an allowed grace window behaves as defined;
- stale invocation outside the grace window behaves as defined;
- missed periods do not cause uncontrolled catch-up;
- exactly one uncoordinated scheduler authority is active;
- ordinary deployment cannot silently delete or replace scheduler authority;
- authoritative scheduler state is reconciled after an authority-changing deployment;
- timezone and DST cases are deterministic.

---

# State-machine test requirements

For every modeled state, tests SHOULD cover:

1. allowed inbound transitions;
2. allowed outbound transitions;
3. prohibited transitions;
4. persistence across restart;
5. duplicate invocation behavior;
6. recovery behavior;
7. operator/manual transition authority.

Particular attention SHOULD be paid to preventing transitions such as:

```text
UNKNOWN → RETRY
```

without reconciliation or proven idempotency, and:

```text
SKIPPED → COMPLETED
```

without actual execution evidence.

---

# Evidence template

For each executed failure test, retain enough information to answer:

```text
Test ID:
Candidate/version:
Environment:
Initial state:
Injected failure:
Expected invariant:
Observed behavior:
Side effect occurred? yes/no/unknown
Final durable state:
Recovery action:
Post-recovery verification:
PASS/FAIL:
Evidence location:
```

A test is not considered meaningful merely because the process exited nonzero. The evidence must establish that the protected invariant held.

---

# Promotion rule

When a real incident reveals a failure mode not represented here:

1. reproduce it safely if possible;
2. define the missing invariant;
3. add a project-level regression test;
4. determine whether the failure is automation-agnostic;
5. if generic and material, propose it for this matrix.

This matrix should grow from evidence, not imagination alone.
