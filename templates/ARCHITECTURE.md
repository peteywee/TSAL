# Automation Architecture

## Purpose

Describe what the automation does and why it exists.

## System boundary

Document what is inside the automation boundary and what remains external.

## Source of truth

Identify canonical inputs, durable state, derived state, and remote reality.

## Trigger and execution path

Describe how work becomes eligible, how execution starts, and the maximum work performed per execution.

## Authority model

Document execution authority, coordination/fencing, credential boundaries, and owner-reserved actions.

## State model

List durable states, legal transitions, ambiguity states, and reconciliation requirements.

## Side effects

List external mutations, their reversibility, idempotency strategy, and blast-radius bounds.

## Failure and recovery

Describe fail-closed conditions, retry semantics, reconciliation, rollback/reversal limits, and controlled resume.

## Verification and evidence

Document deterministic preflight, candidate verification, runtime evidence, and postcondition checks.

## Integrations

List adapters and optional control-plane connections. Keep TSAL core dependencies out of project implementation.
