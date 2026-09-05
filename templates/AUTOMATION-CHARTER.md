# Automation Charter

## Identity

- Project ID:
- Automation ID:
- Owner:
- Proposed TSAL version:

## A0 — Discover

### Human/business outcome

What outcome should exist if this automation works?

### Trigger

What causes execution to begin?

### Inputs and source of truth

What information drives the decision, and which source is authoritative?

### Work item

What is the smallest independently executable unit?

### External dependencies

List systems that can fail, timeout, rate-limit, duplicate, drift, or become unavailable.

### Side effects

List everything the automation can change outside its own process.

### Human/owner-reserved decisions

Which decisions must remain explicitly human or separately authorized?

## A1 — Define

### Success condition

### Correct non-execution

When is doing nothing the correct result?

### Forbidden outcomes

What must never happen?

## A2 — Model

### State machine

Define normal, failure, ambiguous, deferred, skipped/cancelled, and recovery states as applicable.

### Authority model

Identify policy authority, execution authority, verification authority, and override authority.

### Idempotency / duplicate protection

### Ambiguous-result handling

### Backlog handling

## A3 — Risk

- Proposed class: R0 / R1 / R2 / R3
- Why:
- Worst credible blast radius:
- Reversibility:

## Required evidence before production

- [ ] contract complete
- [ ] deterministic checks pass
- [ ] failure-path tests pass
- [ ] dry run / simulation complete where feasible
- [ ] exact candidate identified
- [ ] authority is explicit
- [ ] recovery path tested or demonstrated
- [ ] owner-reserved actions documented

## Open questions

Capture unknowns rather than silently filling them with assumptions.
