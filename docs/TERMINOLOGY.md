# TSAL Controlled Terminology

**Status:** normative terminology for TSAL 0.3.4

These terms define the architecture and authority language used by TSAL. A consumer MAY use different implementation names, but it MUST preserve the semantics when claiming compatibility.

## System roles

- **TSAL** — Top Shelf Automation Lifecycle: the provider-neutral standard defining automation lifecycle, risk/authority semantics, contracts, evidence, conformance, compatibility, incident/recovery expectations, and integration boundaries. TSAL is not a runtime application, control plane, kernel, or authority source by itself.
- **workload** — an independently safe domain system that performs its own business/application behavior and exposes declared facts, evidence, health, and bounded actions. Examples include XQueue and Teach.
- **control plane** — an optional system that aggregates or operates workloads across projects: observation, diagnosis, compatibility assessment, planning, coordination, bounded action invocation, verification, and escalation. TOS is one possible control plane.
- **kernel / privileged-admission boundary** — a deterministic enforcement boundary inside a control plane or automation operator that admits or rejects protected mutations. TSAL does not require the implementation to use the word `kernel`; it requires the semantics when a consumer claims bounded autonomous privileged execution.
- **userland** — reasoning, planning, orchestration, UI/CLI, agent, scheduler, and module behavior outside the privileged-admission boundary. Userland may propose actions but does not self-grant privileged authority.
- **adapter** — a provider- or project-specific implementation behind a neutral interface. An adapter translates facts, capabilities, provider state, errors, ambiguity, and evidence; it does not invent authority.

## Authority terms

- **authority** — a policy-backed right to decide or execute a bounded action class within explicit scope and conditions.
- **capability** — an explicitly named action or action class that can be granted, denied, narrowed, reserved, or delegated.
- **credential** — a key, token, secret, session, certificate, or identity mechanism that enables technical access. A credential demonstrates access possibility, not authority to use every reachable capability.
- **authority grant** — an attributable record connecting an actor/operator to a capability, target/scope, conditions, and grant source.
- **reserved action** — a capability kept with an owner or other named authority and unavailable for silent self-delegation by automation.
- **privileged action** — a mutation that can materially change canonical, external/provider, production, public, financial, security/identity, release/promotion, destructive, or similarly protected state.
- **bounded action** — an action whose identity, target, allowed effect, authority source, preconditions, scope/blast radius, failure behavior, retry/repair limits, evidence, and verification are explicit enough for deterministic admission.
- **privileged admission / kernel mediation** — deterministic evaluation performed before a protected mutation to decide whether the requested bounded action is authorized and safe enough to execute under declared policy.
- **override** — an explicitly authorized bounded decision to supersede normal policy while preserving the original observation/denial/failure, attribution, reason, scope, and resulting evidence.

## Truth and evidence terms

- **observation** — read-only acquisition of facts or external reality. Observation does not imply mutation authority.
- **UNKNOWN** — a first-class truth state meaning reliable evidence is insufficient to assert a safer state. UNKNOWN is not permission to guess.
- **reconciliation** — comparison of competing, incomplete, or ambiguous sources of truth to determine the best-supported state without manufacturing certainty.
- **evidence** — durable proof supporting a specific claim about specification, implementation, candidate, deployment, runtime, reconciliation, or attestation.
- **verification** — mechanically reproducible or independent evaluation that a claimed outcome and its evidence satisfy the applicable contract.
- **exact candidate** — the immutable commit/artifact identity to which candidate evidence and release decisions apply.
- **fail closed** — refuse or stop a protected action when required authority, identity, state, evidence, or certainty cannot be established.

## Change and recovery terms

- **repair** — a bounded action intended to restore already-approved declared state after drift/failure without silently changing policy or scope.
- **recovery** — controlled return to a known safe state after failure, ambiguity, or partial execution; may include reconciliation, repair, rollback, quarantine, or escalation.
- **adoption** — an explicit decision to target a newer TSAL release, schema, contract, interface, or other standard. Detection of a newer version is not adoption.
- **escalation** — transfer of an unresolved decision to an authority capable of deciding it when automation lacks sufficient authority, certainty, repair budget, or policy.

## Required distinctions

The following pairs MUST NOT be collapsed:

```text
TSAL              != control plane
TSAL              != kernel
control plane     != privileged-admission boundary
workload          != control-plane module
credential        != authority
authentication    != authorization
observation       != mutation
provider success  != authoritative external state
UNKNOWN           != PASS
standard detection != standard adoption
repair            != silent policy change
override          != evidence erasure
```

## AI boundary

AI MAY observe, summarize, diagnose, draft, classify for review, plan, and propose actions. AI MAY also execute explicitly admitted bounded actions when policy permits.

AI MUST NOT be the sole enforcement mechanism for a rule that can be evaluated deterministically. AI confidence, tool availability, credentials, or previous success MUST NOT create authority.

## Consumer-kernel rule

A control plane that claims **autonomous privileged execution** SHOULD separate discretionary reasoning from deterministic privileged admission. For R3 operations, this separation is REQUIRED where the relevant authority/safety rule can be mechanically evaluated.

The semantic path is:

```text
observe / reason / propose
          ↓
deterministic privileged admission
    ├─ deny / reserved / UNKNOWN → preserve evidence → escalate
    └─ allow → execute bounded action → collect evidence → independently verify
```

A consumer may implement this boundary as a kernel, policy engine, capability gate, admission controller, or equivalent deterministic mechanism. The name is not normative; the non-bypassable semantics are.

TSAL remains usable without any control plane or kernel because project-local safety and conformance remain local-first.