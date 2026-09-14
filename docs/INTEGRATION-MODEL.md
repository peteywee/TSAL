# TSAL Integration Model

TSAL integrates by contract, not by repository inheritance.

Normative terms are defined in [`TERMINOLOGY.md`](./TERMINOLOGY.md).

## Integration principle

A TSAL-aware project publishes a machine-readable description of itself. Consumers read that description and optionally contribute evidence or conformance results through declared adapters.

The project remains independently buildable, deployable, and safe to operate without a live TSAL or TOS service.

## Project integration

The minimum integration surface is:

```text
tsal.project.json
```

This manifest points to one or more automation contracts and declares optional evidence, incident, adapter, and control-plane locations.

A project MUST NOT vendor-copy TSAL policy documents merely to claim conformance.

A project MUST NOT delegate its local fail-closed safety controls to a control plane. Control-plane unavailability cannot expand project authority.

## Control-plane integration

A control plane such as TOS SHOULD consume neutral TSAL artifacts:

```text
TSAL project manifest
        │
        ├── automation contracts
        ├── conformance reports
        ├── evidence records
        ├── incident records
        └── declared bounded actions / adapters
```

The control plane MAY index, search, visualize, observe, diagnose, schedule reviews, correlate evidence, build compatibility candidates, propose actions, invoke policy-authorized repair primitives, independently verify outcomes, or escalate to an owner.

The control plane MUST NOT:
- rewrite project execution history to make conformance appear successful;
- infer authority from credentials alone;
- silently broaden a workload contract;
- require a workload to lose its local safety properties when the control plane is unavailable;
- silently adopt a new TSAL release into a workload without a workload candidate and its own release decision;
- allow discretionary userland/AI reasoning to bypass a deterministic privileged-admission control required by policy;
- treat a denial on one TOS-managed execution path as permission to retry through an alternate adapter/tool merely to obtain a side effect.

## Control-plane internal authority boundary

TSAL does not prescribe TOS internals, but a consumer claiming autonomous privileged execution must distinguish **reasoning/proposal** from **authority admission**.

For mechanically decidable protected mutations, especially R3 operations, the expected semantic path is:

```text
observe / diagnose / propose
          ↓
privileged admission
(actor + capability + authority source + target/scope + conditions)
    ├─ deny / reserved / UNKNOWN → evidence + escalation
    └─ allow
         ↓
 adapter / workload bounded action
         ↓
 authoritative observation + evidence
         ↓
 verification / reconciliation
```

A consumer may call this an execution kernel, policy engine, admission controller, capability gate, or another name. It MUST NOT use implementation naming to evade the semantics.

Read-only observation MAY use a simpler path when the applicable contract permits it. Observation never implies mutation authority.

## Role boundary

The canonical responsibility split is:

```text
TSAL
  defines rules, contracts, terminology, evidence semantics, conformance, and compatibility expectations

Control plane / TOS userland
  detects change, observes, diagnoses, plans, coordinates, proposes, verifies, and escalates

Privileged-admission boundary / TOS kernel equivalent
  deterministically admits or denies protected TOS-managed mutation

Workload
  performs domain behavior and exposes truthful facts, evidence, and declared bounded actions
```

This means TSAL is not runtime middleware, not a control-plane application, and not the privileged execution kernel.

## Standard adoption and project versions

TSAL and project versions evolve independently.

A new TSAL release MAY cause a control plane or CI system to assess whether a project is affected. It MUST NOT itself mutate that project.

```text
new TSAL release
      │
      ▼
compatibility assessment
   ┌──┴─────────────┐
   │                │
unaffected       adoption needed
   │                │
no project       explicit project candidate
change              │
                    ▼
               project tests + TSAL audit
                    │
                    ▼
               project release decision
```

If adoption changes committed project content, that project follows its own versioning policy. A previously proven project release remains immutable historical evidence; it is not retroactively redefined by a newer TSAL release.

## Adapter model

Adapters exist at integration boundaries. An adapter translates between a provider/project-specific representation and a TSAL representation.

Examples:
- GitHub adapter: repository metadata, candidate SHA, workflow status;
- scheduler adapter: active authority and schedule health;
- deployment adapter: release identity and postconditions;
- database adapter: migration candidate and verification evidence;
- AI adapter: explanation, classification assistance, draft contracts;
- TOS adapter: registry, governance decision, evidence aggregation, bounded action invocation.

An adapter is not automatically trusted. Its outputs are evidence with provenance.

A write-capable adapter MUST distinguish credentials from authority context and MUST preserve the bounded action admitted by policy. It MUST NOT broaden target/scope, invent a capability grant, hide destructive replacement/omission semantics, or translate UNKNOWN into success.

## Push and pull

TSAL supports both patterns.

### Pull

A consumer reads a project's manifest and referenced artifacts.

Useful for:
- local CLI audits;
- CI;
- TOS inventory;
- compatibility assessment;
- AI-assisted review.

### Push

A project or adapter sends conformance/evidence events to a control plane.

Useful for:
- dashboards;
- cross-project incident correlation;
- governance workflows;
- centralized evidence retention.

Push integration is optional. Local conformance MUST remain possible without it.

## Identity

Stable IDs SHOULD be independent of filesystem paths.

Recommended namespaces:

```text
project_id:     topshelf.xqueue
automation_id:  topshelf.xqueue.publisher
evidence_id:    ev-<uuid-or-content-id>
incident_id:    inc-<uuid-or-project-sequence>
```

A repository rename SHOULD NOT require rewriting historical evidence IDs.

## Version negotiation

Every machine-readable TSAL artifact declares:
- schema version;
- TSAL standard version where applicable.

Consumers MUST reject incompatible major schema versions rather than guessing.

Consumers SHOULD tolerate additive optional fields within a compatible version.

A consumer MAY detect that a newer TSAL release exists, but detection is not adoption. Adoption requires compatibility evaluation and an explicit project candidate whenever project content changes.

## Local-first rule

The minimum useful system is:

```text
project + manifest + contract + deterministic checks
```

AI, a network API, a hosted database, a control plane, and a control-plane kernel are optional accelerators, not prerequisites for project-local TSAL conformance.

## TOS relationship

TSAL is a governed standard consumed by a broader operating system through integration dependencies:

```text
TOS -> TSAL interfaces
TOS -> project interfaces / declared actions
```

not:

```text
TSAL core -> TOS implementation
workload runtime -> TOS as a prerequisite for local safety
TSAL -> live TOS kernel as a prerequisite for conformance
```

TOS may implement a deterministic execution kernel for its own privileged authority boundary. That kernel is a TOS implementation responsibility governed by TSAL-compatible policy; it is not part of TSAL core.
