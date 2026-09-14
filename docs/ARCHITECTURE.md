# TSAL Architecture

Status: foundation v0.3.4

TSAL is structured as a layered automation engineering system. The standard remains technology-agnostic; executable tooling and integrations are replaceable implementations around that standard.

Normative architecture and authority terms are defined in [`TERMINOLOGY.md`](./TERMINOLOGY.md).

## Architectural objective

TSAL MUST be usable locally with no backend, no AI service, and no control plane. It MUST also expose stable machine-readable boundaries so projects, CI systems, AI assistants, and an operating system such as TOS can consume the same facts without rewriting the standard.

## Constitutional boundary

TSAL defines **what correct, bounded, evidenced automation means**. A control plane such as TOS decides **what changed, what action is allowed, when to execute it, whether repair is safe, and when owner escalation is required**. A workload such as XQueue or Teach performs its own bounded domain work and remains independently safe to operate.

The intended relationship is:

```text
OWNER / ORGANIZATION POLICY
            │
            ▼
      CONTROL PLANE (TOS)
   observe → diagnose → plan
            │
            ├── consumes TSAL rules/contracts/proof
            │
            ▼
 privileged-admission boundary
   deterministic allow / deny
            │
     admitted bounded action
            ▼
          WORKLOAD
      facts/evidence/outcomes
            │
            └──────────────► control plane
```

This is a responsibility model, not a runtime call chain through TSAL.

The following are architecture invariants:

1. **TSAL is not runtime middleware.** A workload MUST NOT require a live TSAL service or TOS service in order to execute its already-approved local/runtime safety controls.
2. **TOS is not part of TSAL core.** TOS consumes TSAL through neutral interfaces and MAY be replaced without changing TSAL core guarantees.
3. **Workloads remain independently safe.** Loss of TOS or TSAL availability MUST NOT expand a workload's authority or disable its fail-closed local controls.
4. **Control-plane autonomy is policy-bounded.** A control plane MAY automate observation, diagnosis, repair, verification, and escalation only within authority explicitly represented by contracts/policy.
5. **A standard release does not silently mutate a workload.** A new TSAL release MAY trigger compatibility assessment, but adoption by a workload is an explicit candidate change subject to that workload's own versioning, tests, evidence, and release policy.
6. **Reusable rules move upward; domain behavior stays downward.** Cross-project governance belongs in TSAL/control-plane policy. Project-specific publication, application, database, or domain behavior remains in the workload.
7. **Credentials are not authority.** Provider/tool access MUST NOT be treated as a capability grant.
8. **UNKNOWN is first-class.** Missing or contradictory evidence MUST NOT be coerced to PASS to keep automation moving.
9. **Evidence is additive.** Repair, recovery, retry, supersession, and override MUST NOT erase the original observation, denial, failure, or ambiguity.
10. **Implementation truth is explicit.** Intended architecture MUST NOT be presented as implemented/proven behavior without corresponding code and evidence.

## Control-plane reasoning versus privileged admission

TSAL does not mandate a particular operating-system implementation or the word `kernel`. It does require a stronger boundary when a consumer claims autonomous privileged execution.

A control plane may contain discretionary userland behavior such as AI agents, planners, schedulers, orchestration, UI, and diagnosis. Those components MAY observe, reason, and propose actions.

For a **privileged action** whose authority/safety conditions can be mechanically evaluated, the final admission decision SHOULD be deterministic. For R3 privileged actions, deterministic admission is REQUIRED where mechanically evaluable controls exist.

The control path is:

```text
observe / reason / propose
          ↓
deterministic privileged admission
    ├─ deny / reserved / UNKNOWN → preserve evidence → escalate
    └─ allow
         ↓
   bounded execution
         ↓
      evidence
         ↓
independent verification when required
```

A consumer may implement this as a kernel, admission controller, policy engine, capability gate, or equivalent. The implementation name is not normative. The semantics are:

- caller identity and requested capability are explicit;
- authority source is explicit and separate from credentials;
- target/scope and protected state are explicit;
- reserved actions remain reserved;
- leases/fencing/concurrency and retry/repair budgets are enforced where required;
- bypass through another adapter/tool does not convert denial into authority;
- fail-closed and escalation behavior is explicit;
- evidence is protected and linked to the exact action/candidate;
- verification requirements are satisfied before promotion/closure.

AI MAY propose or explain the admission result. AI MUST NOT replace a deterministic denial with discretionary confidence.

## Planes

```text
                         OPTIONAL CONTROL PLANE
                    (TOS / registry / dashboard / API)
                               ▲       │
                               │       ▼
                    ┌─────────────────────────┐
                    │    INTEGRATION PLANE    │
                    │ adapters + protocol     │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐       ┌────────────────┐       ┌────────────────┐
│ PROJECT PLANE │       │ EVIDENCE PLANE │       │ INCIDENT PLANE │
│ manifest      │       │ proofs/reports │       │ lessons/state  │
│ contracts     │       │ conformance    │       │ recovery       │
└───────┬───────┘       └────────┬───────┘       └────────┬───────┘
        └────────────────────────┼────────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │   CONFORMANCE PLANE     │
                    │ schemas + checks + CLI  │
                    └────────────┬────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │       TSAL CORE         │
                    │ lifecycle + invariants  │
                    │ risk + failure model    │
                    └─────────────────────────┘
```

### 1. TSAL Core

Canonical, normative rules. This is the slowest-changing layer.

Contains:
- lifecycle;
- normative invariants;
- controlled terminology;
- risk classes;
- failure semantics;
- authority and recovery expectations;
- conformance definitions.

The core MUST NOT depend on a vendor, runtime, scheduler, database, AI model, workload implementation, or control plane.

### 2. Conformance Plane

Machine-readable schemas and deterministic tooling that answer: "Does this project declare the controls TSAL requires, and can those declarations be checked?"

AI MAY explain findings but MUST NOT replace deterministic checks that can be mechanically evaluated.

### 3. Project Plane

Every TSAL-aware project exposes one root manifest named `tsal.project.json`.

That manifest is the project's stable TSAL socket. It identifies:
- project identity;
- TSAL version targeted;
- automation contracts;
- evidence and incident locations;
- declared adapters;
- optional control-plane integration.

Projects do not copy the TSAL standard into themselves.

### 4. Evidence Plane

Evidence proves claims about exact candidates and executions. Evidence is append-oriented and SHOULD be immutable once issued.

Evidence MUST distinguish a claim from the proof supporting that claim.

### 5. Incident Plane

Incidents capture failures, ambiguity, containment, root cause, recovery, and candidate lessons. Incidents feed the A10/A11 learning loop.

### 6. Integration Plane

Adapters translate project-local or provider-specific facts into TSAL's neutral contracts.

Adapters MAY connect GitHub, CI, cloud providers, databases, schedulers, observability systems, or future TOS services. Adapter failure MUST NOT silently mutate TSAL truth. A write-capable adapter MUST NOT invent authority merely because credentials exist.

### 7. Optional Control Plane

A control plane can aggregate many TSAL-aware projects, but it is not required for TSAL conformance or workload runtime safety.

A TOS integration belongs here. TOS can consume manifests, conformance reports, evidence, incidents, declared repair primitives, and compatibility information while remaining independent from TSAL core.

A control plane MAY automate lifecycle operations around a workload, but it MUST NOT become an undeclared authority source. If a requested privileged action cannot prove sufficient capability/authority/scope, the action must fail closed or escalate.

## Dependency direction

Allowed dependency direction:

```text
control plane -> interfaces/schemas -> TSAL core
adapter       -> interfaces/schemas -> TSAL core
project       -> schemas            -> TSAL core
CLI/tooling   -> schemas            -> TSAL core
```

Forbidden direction:

```text
TSAL core -> TOS
TSAL core -> GitHub
TSAL core -> AI provider
TSAL core -> Cloudflare
TSAL core -> project implementation
workload runtime -> live TOS/TSAL service as a prerequisite for local safety
credential possession -> inferred execution authority
control-plane discretionary reasoning -> bypass of mechanically required privileged admission
```

This prevents the standard from becoming captive to one operating system or vendor and prevents workloads from becoming unsafe when the control plane is unavailable.

## Canonical project socket

A project integrates with TSAL by exposing:

```text
project/
├── tsal.project.json
├── automation.contract.json        # one or more, project-defined paths
├── docs/
│   ├── RUNBOOK.md
│   └── incidents/
└── evidence/
```

The root manifest MAY point elsewhere, but the references MUST be explicit and repository-relative where practical.

## Truth hierarchy

When sources disagree, use this hierarchy:

1. observed external reality;
2. durable execution/evidence records;
3. project automation contract;
4. generated plans and caches;
5. dashboards and summaries.

A lower layer MUST NOT overwrite a higher layer merely to restore a green status.

## Authority hierarchy

TSAL distinguishes:
- policy authority — who defines allowed behavior;
- execution authority — who may perform a side effect;
- verification authority — who/what may attest to results;
- override authority — owner-reserved emergency decisions.

One component MAY hold more than one role, but the roles MUST remain conceptually explicit. R3 systems SHOULD separate execution from independent verification where practical.

## Evolution and ownership rule

Use this decision boundary when deciding where a change belongs:

```text
Is the current workload broken?
  ├─ yes → repair the workload
  └─ no
      Is this a new domain capability?
        ├─ yes → workload change
        └─ no
            Is this a reusable automation/governance rule?
              ├─ yes → TSAL
              └─ no → leave the workload alone

Does the reusable rule require autonomous cross-project action?
  ├─ yes → control plane coordinates; deterministic admission enforces privileged authority
  └─ no → TSAL rule/tooling only
```

New capabilities branch from stable interfaces rather than modifying the core contract for every integration.

Preferred extension points:
- new adapter;
- new evidence producer;
- new deterministic check;
- new optional manifest capability;
- new control-plane consumer.

Changing a core invariant requires evidence that the invariant itself is insufficient or incorrect.
