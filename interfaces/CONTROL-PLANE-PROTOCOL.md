# TSAL Control Plane Protocol

The TSAL control plane is optional. TSAL MUST remain useful without one.

This protocol defines the minimum semantics a control plane such as a future TOS integration should understand.

## Core resources

A control plane MAY ingest or retrieve:

- project manifests;
- automation contracts;
- conformance reports;
- evidence records;
- incident records;
- lifecycle state;
- adapter metadata.

## Required semantic operations

Transport is intentionally unspecified. HTTP, RPC, files, Git, queues, or database synchronization may implement the same semantics.

```text
register_project(manifest)
get_project(project_id)
submit_conformance(report)
submit_evidence(record)
submit_incident(record)
get_current_status(project_id, automation_id?)
get_required_actions(project_id, automation_id?)
```

## Authority boundary

Registration or visibility does not grant execution authority.

A control plane that grants execution authority MUST make the grant explicit, bounded, attributable, revocable, and auditable.

The project MUST be able to distinguish:

```text
registered
visible
conformant
approved
execution-authorized
```

These states MUST NOT be collapsed into one boolean.

## Truth and reconciliation

The control plane is an index and governance surface, not automatically the highest source of runtime truth.

When control-plane state conflicts with observed external reality or durable project evidence, the discrepancy MUST be surfaced for reconciliation. The control plane MUST NOT silently overwrite execution history.

## Idempotent ingestion

Evidence, incident, and conformance submissions SHOULD use stable IDs so repeated delivery is safe.

## Versioning

A control plane MUST retain the TSAL/schema version associated with each artifact. It MUST NOT reinterpret old evidence under a newer standard without recording the re-evaluation as a separate conformance result.

## TOS compatibility

TOS can implement this protocol later without requiring changes to TSAL core. TOS-specific policy, ownership, portfolio management, or autonomous execution semantics belong in the TOS adapter/control-plane implementation rather than in this protocol unless they prove generically useful across consumers.
