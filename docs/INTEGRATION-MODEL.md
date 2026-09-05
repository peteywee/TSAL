# TSAL Integration Model

TSAL integrates by contract, not by repository inheritance.

## Integration principle

A TSAL-aware project publishes a machine-readable description of itself. Consumers read that description and optionally contribute evidence or conformance results through declared adapters.

The project remains independently buildable and deployable.

## Project integration

The minimum integration surface is:

```text
tsal.project.json
```

This manifest points to one or more automation contracts and declares optional evidence, incident, adapter, and control-plane locations.

A project MUST NOT vendor-copy TSAL policy documents merely to claim conformance.

## Control-plane integration

A future control plane such as TOS SHOULD consume neutral TSAL artifacts:

```text
TSAL project manifest
        │
        ├── automation contracts
        ├── conformance reports
        ├── evidence records
        └── incident records
```

The control plane MAY index, search, visualize, schedule reviews, correlate evidence, or enforce organization policy. It MUST NOT rewrite project execution history to make conformance appear successful.

## Adapter model

Adapters exist at integration boundaries. An adapter translates between a provider/project-specific representation and a TSAL representation.

Examples:
- GitHub adapter: repository metadata, candidate SHA, workflow status;
- scheduler adapter: active authority and schedule health;
- deployment adapter: release identity and postconditions;
- database adapter: migration candidate and verification evidence;
- AI adapter: explanation, classification assistance, draft contracts;
- TOS adapter: registry, governance decision, evidence aggregation.

An adapter is not automatically trusted. Its outputs are evidence with provenance.

## Push and pull

TSAL supports both patterns.

### Pull

A consumer reads a project's manifest and referenced artifacts.

Useful for:
- local CLI audits;
- CI;
- TOS inventory;
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
```

not:

```text
TSAL core -> TOS implementation
```

This allows TSAL to remain reusable outside TOS and allows TOS to replace or upgrade its internals without changing TSAL's core standard.
