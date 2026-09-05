# TSAL Architecture

Status: foundation v0.2

TSAL is structured as a layered automation engineering system. The standard remains technology-agnostic; executable tooling and integrations are replaceable implementations around that standard.

## Architectural objective

TSAL MUST be usable locally with no backend, no AI service, and no control plane. It MUST also expose stable machine-readable boundaries so projects, CI systems, AI assistants, and a future operating system such as TOS can consume the same facts without rewriting the standard.

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
- risk classes;
- failure semantics;
- authority and recovery expectations;
- conformance definitions.

The core MUST NOT depend on a vendor, runtime, scheduler, database, AI model, or control plane.

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

Adapters MAY connect GitHub, CI, cloud providers, databases, schedulers, observability systems, or future TOS services. Adapter failure MUST NOT silently mutate TSAL truth.

### 7. Optional Control Plane

A control plane can aggregate many TSAL-aware projects, but it is not required for TSAL conformance.

A future TOS integration belongs here. TOS can consume manifests, conformance reports, evidence, and incidents while remaining independent from TSAL core.

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
```

This prevents the standard from becoming captive to one operating system or vendor.

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

## Extension rule

New capabilities branch from stable interfaces rather than modifying the core contract for every integration.

Preferred extension points:
- new adapter;
- new evidence producer;
- new deterministic check;
- new optional manifest capability;
- new control-plane consumer.

Changing a core invariant requires evidence that the invariant itself is insufficient or incorrect.
