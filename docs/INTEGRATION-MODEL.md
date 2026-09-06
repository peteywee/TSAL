# TSAL Integration Model

TSAL integrates by contract, not by repository inheritance.

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

A future control plane such as TOS SHOULD consume neutral TSAL artifacts:

```text
TSAL project manifest
        │
        ├── automation contracts
        ├── conformance reports
        ├── evidence records
        ├── incident records
        └── declared bounded actions / adapters
```

The control plane MAY index, search, visualize, observe, diagnose, schedule reviews, correlate evidence, build compatibility candidates, invoke policy-authorized repair primitives, independently verify outcomes, or escalate to an owner.

The control plane MUST NOT:
- rewrite project execution history to make conformance appear successful;
- infer authority from credentials alone;
- silently broaden a workload contract;
- require a workload to lose its local safety properties when the control plane is unavailable;
- silently adopt a new TSAL release into a workload without a workload candidate and its own release decision.

## Role boundary

The canonical responsibility split is:

```text
TSAL
  defines rules, contracts, evidence semantics, conformance, and compatibility expectations

TOS / control plane
  detects change, evaluates policy, decides, executes bounded operations, verifies, and escalates

Workload
  performs domain behavior and exposes truthful facts, evidence, and bounded actions
```

This means TSAL is not runtime middleware between TOS and the workload.

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

AI, a network API, a hosted database, and TOS are optional accelerators, not prerequisites.

## Future TOS relationship

TSAL should eventually be one governed subsystem of a broader operating system, but that relationship should be expressed as an integration dependency:

```text
TOS -> TSAL interfaces
TOS -> project interfaces / declared actions
```

not:

```text
TSAL core -> TOS implementation
workload runtime -> TOS as a prerequisite for local safety
```

This allows TSAL to remain reusable outside TOS, allows TOS to replace or upgrade its internals without changing TSAL's core standard, and keeps workloads independently safe when either integration layer is unavailable.
