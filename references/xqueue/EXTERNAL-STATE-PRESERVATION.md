# XQueue reference: external state preservation

Reference workload: **XQueue**

Promoted in: **TSAL 0.3.2**

## Incident signal

XQueue repository and runtime checks were healthy enough to prove 13 TSAL claims, but authoritative Cloudflare deployment evidence reported that the production Worker had no Cron Triggers. The intended authority state was exactly one `*/15 * * * *` trigger.

The project also contained an ordinary Wrangler configuration targeting the same production Worker with an explicit empty cron list while the authority-specific configuration declared the production cron.

## Why this was generic

The Cloudflare-specific syntax was not the reusable lesson. The generic failure class was:

```text
local value looks empty / disabled / neutral
                ↓
provider interprets it as replacement
                ↓
existing external authority is deleted or reset
                ↓
code tests still pass
                ↓
external control plane drifts
```

This can occur with schedulers, routes, traffic allocation, policies, allowlists, retention settings, credentials, or other provider-managed state.

## Promoted controls

TSAL 0.3.2 promotes these rules:

1. Empty/null/default/omission-like values are not assumed non-mutating.
2. Provider replacement semantics are part of the side-effect model.
3. A deployment path without authority to change an external state class must preserve that state.
4. Authority-changing deployment uses a separately controlled path.
5. R3 deployment completion requires authoritative external-state reconciliation where technically available.
6. A mismatch between intended and observed authority is blocking.
7. Project-level negative tests should prove the ordinary deployment path cannot encode destructive absence.

## What stayed XQueue-specific

TSAL does not require:

- Cloudflare Workers;
- Wrangler;
- Cron Triggers;
- a 15-minute schedule;
- X publishing;
- XQueue's exact Worker/storage topology.

Those remain implementation details. The promoted control objective is external-state preservation under provider replacement semantics.
