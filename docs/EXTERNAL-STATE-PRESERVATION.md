# TSAL External State Preservation Policy

Status: **Normative**

Introduced: **TSAL 0.3.2**

## Purpose

Automation and deployment tooling often interact with external control planes whose update semantics are broader than the local configuration appears to imply. A value that looks empty, disabled, null, defaulted, or absent may be interpreted by a provider as a request to delete, revoke, replace, or reset existing external state.

TSAL therefore treats provider replacement semantics as part of the side-effect boundary.

## Core rule: destructive absence

> An automation or deployment MUST NOT represent "no change", "disabled authority", or "not applicable" using an empty, null, default, or omission-like configuration value unless the provider semantics of that value are explicitly known.

If a provider interprets such a value as deletion, revocation, replacement, reset, or another mutation of external state, that value MUST be treated as a mutating side effect.

Examples include, but are not limited to:

- an empty scheduler list that deletes deployed schedules;
- an empty route list that removes traffic routing;
- a null policy that revokes an existing policy;
- an empty allowlist that denies all identities;
- an omitted/empty environment block that resets deployed environment configuration;
- a deployment command whose default behavior replaces external control-plane state.

## Authority-preserving deployment

A deployment path that is not authorized to change a class of external authority MUST preserve that authority state.

Non-authoritative deployment paths MUST NOT implicitly create, replace, delete, revoke, or reset scheduler, routing, credential, policy, traffic, or equivalent control-plane authority.

When the provider supports preservation by omitting a field, resource, flag, or subconfiguration, an ordinary deployment SHOULD omit that authority declaration rather than encode an explicit empty value.

Authority-changing configuration MUST use an explicit, separately controlled path whose blast radius and owner authority are clear.

## Configuration access is not mutation authority

Possession of credentials or access to a deployment mechanism does not imply authority to mutate every external state surface reachable through that mechanism.

A deployer MAY be authorized to update application code while remaining unauthorized to change:

- scheduler authority;
- routing authority;
- production identity;
- secrets or credentials;
- destructive retention settings;
- policy bindings;
- traffic allocation;
- other owner-reserved control-plane state.

Deploy tooling SHOULD separate these authority classes mechanically where the provider permits it.

## Provider replacement semantics

Before relying on an empty, null, omitted, default, or partial configuration, the system owner MUST establish what the provider does with pre-existing external state.

The relevant question is not only:

```text
What does this local configuration contain?
```

It is also:

```text
What external state will the provider create, preserve, replace, reset, revoke, or delete when this configuration is applied?
```

If that behavior is unknown and material to R2/R3 safety, deployment MUST fail closed or require owner review rather than guessing.

## Post-deploy reconciliation

Deployment completion is not proven by a successful deploy command alone.

For R2/R3 systems where external control-plane state affects production authority, deployment SHOULD be followed by an independent read of authoritative provider state. R3 authority changes MUST retain deployment evidence sufficient to compare intended state with observed external state.

A mismatch between intended and observed external authority is `BLOCKING` until reconciled.

The evidence ladder remains:

```text
repository intent
    !=
exact candidate behavior
    !=
deployment command success
    !=
authoritative provider state
    !=
current runtime behavior
```

## Required controls for material external-state surfaces

Where applicable, projects SHOULD implement all of the following:

1. **Explicit authority ownership** — identify who/what may mutate the external state class.
2. **Preserving default path** — ordinary deployment cannot alter that authority class.
3. **Explicit authority path** — mutations use a separately recognizable path.
4. **Negative regression test** — prove the ordinary path cannot encode destructive absence or replacement.
5. **Authoritative post-deploy read** — observe provider state after deployment.
6. **Fail-closed reconciliation** — mismatch becomes blocking rather than silently accepted.
7. **Incident preservation** — unexpected drift is recorded and promoted through A10/A11 when generic.

## Conformance relationship

TSAL 0.3.2 does not introduce a new schema field for this policy. Existing evidence-layered conformance already provides the enforcement surface:

- repository/configuration checks can establish the local preservation invariant;
- candidate evidence can prove the guard/tests for an exact candidate;
- `deployment` evidence must establish authoritative external control-plane state for R3 production authority;
- `runtime` evidence independently establishes current operational behavior.

A project MUST NOT use repository configuration as a substitute for deployment evidence when provider-managed external authority is material.

## Origin

This policy was promoted from XQueue after TSAL detected that repository and runtime signals appeared healthy while Cloudflare's authoritative scheduler state contained no Cron Trigger. The project also contained an ordinary deployment configuration with an explicit empty scheduler declaration capable of destructive replacement semantics.

The project-specific product and cron cadence are not normative. The reusable lesson is:

> **Preservation must be explicit when empty configuration can mutate external reality.**
