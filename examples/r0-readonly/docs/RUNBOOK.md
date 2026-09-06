# R0 Read-Only Example Runbook

## Production authority

This example has no mutation authority. It is read-only by contract.

## Preconditions

- Input source is readable.
- No write-capable adapter is configured.
- Output generation remains local or otherwise non-mutating.

## Normal operation

Read the declared source, generate the report, record evidence, and stop. No external state is changed.

## Failure handling

Fail closed when inputs are unavailable, malformed, or inconsistent. Do not infer missing source truth.

## Recovery

Restore readable inputs, re-run deterministic checks, and regenerate the read-only result.

## Owner-reserved actions

Any change that introduces external mutation requires a new risk classification and contract review.
