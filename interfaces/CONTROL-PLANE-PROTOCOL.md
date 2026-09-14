# TSAL Control Plane Protocol

The TSAL control plane is optional. TSAL MUST remain useful without one.

This protocol defines the minimum semantics a control plane such as TOS should understand. Normative terms are defined in [`../docs/TERMINOLOGY.md`](../docs/TERMINOLOGY.md).

## Core resources

A control plane MAY ingest or retrieve:

- project manifests;
- automation contracts;
- conformance reports;
- evidence records;
- incident records;
- lifecycle state;
- adapter metadata;
- declared bounded action/capability metadata.

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

This protocol does not require a network service or prescribe TOS implementation internals.

## Authority boundary

Registration, visibility, conformance, approval, credentials, and execution authorization are distinct states.

The project/control plane MUST be able to distinguish:

```text
registered
visible
conformant
approved
capability-granted
execution-authorized
action-admitted
executed
verified
```

These states MUST NOT be collapsed into one boolean.

A control plane that grants execution authority MUST make the grant explicit, bounded, attributable, revocable/reviewable, and auditable.

For a protected mutation whose authority/safety conditions are mechanically evaluable, the control plane SHOULD use deterministic privileged admission before execution. For R3 privileged actions, deterministic admission is REQUIRED where mechanically evaluable controls exist.

A privileged-admission decision SHOULD bind, as applicable:

```text
actor/operator
project + automation
requested capability
target/resource
exact candidate/work item
risk class
authority source
grant scope + conditions
reserved-action disposition
retry/repair/blast-radius budget
required evidence
verification requirement
correlation/run identity
```

Credentials prove access possibility. They do not create this authority context.

A denied, reserved, or UNKNOWN action MUST NOT become authorized merely because another adapter/tool path can technically reach the target.

## AI/control-plane reasoning boundary

AI or other discretionary userland may observe, diagnose, plan, explain, and propose actions. It MUST NOT replace a deterministic privileged-admission denial when policy can be mechanically evaluated.

If the control plane cannot establish sufficient authority or certainty, it MUST fail closed or escalate to the owner/named authority rather than guess.

## Truth and reconciliation

The control plane is an index and governance surface, not automatically the highest source of runtime truth.

When control-plane state conflicts with observed external reality or durable project evidence, the discrepancy MUST be surfaced for reconciliation. The control plane MUST NOT silently overwrite execution history.

Repair, retry, recovery, supersession, or override MUST preserve the original observation/failure/denial as historical evidence.

## Idempotent ingestion

Evidence, incident, and conformance submissions SHOULD use stable IDs so repeated delivery is safe.

## Versioning

A control plane MUST retain the TSAL/schema version associated with each artifact. It MUST NOT reinterpret old evidence under a newer standard without recording the re-evaluation as a separate conformance result.

Detection of a newer TSAL version is not adoption. A project/workload candidate is required whenever adoption changes committed project content.

## TOS compatibility

TOS can implement this protocol without requiring changes to TSAL core. TOS-specific policy, portfolio management, execution-kernel implementation, project ownership, or module internals belong in TOS.

The generic semantics that TSAL requires are the boundaries: explicit capability/authority, deterministic admission where mechanically required, fail-closed ambiguity, truthful evidence, independent verification where required, and no privileged bypass.
