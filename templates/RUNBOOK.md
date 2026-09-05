# Automation Runbook

## Purpose

Describe the automation's production responsibility in one paragraph.

## Production authority

- Active execution authority:
- How authority is enabled:
- How authority is disabled:
- How duplicate authorities are detected:

## Preconditions

List the conditions that MUST be true before mutation is allowed.

## Normal operation

Document trigger, selection, bounded execution, result recording, and postcondition verification.

## Health checks

Document deterministic commands/queries that answer:
- is the automation ready?
- is execution authority correct?
- is state healthy?
- is stale work present?
- is reconciliation required?

## Kill switch

Document the fastest safe method to stop new side effects without destroying evidence or state.

## Failure classification

### Known failure

The operation is proven not to have succeeded or has failed in a way that is safe to retry under policy.

### Ambiguous outcome

The side effect may have escaped but the result cannot be proven. Automatic retry MUST follow the contract's ambiguity/idempotency rules.

### State corruption

Preserve evidence. Do not delete durable state merely to restore operation.

### Authority conflict

Stop mutation until a single or explicitly coordinated authority is restored.

### Stale backlog

Apply explicit backlog/disposition policy. Missed work does not automatically become catch-up work.

## Reconciliation

Document how local belief is compared with remote reality and who is authorized to resolve uncertainty.

## Recovery

For each failure class define:
1. containment;
2. evidence preservation;
3. repair;
4. verification;
5. controlled resume.

## Rollback / reversal

Document what can and cannot be reversed.

## Evidence

List evidence emitted during preflight, execution, reconciliation, and recovery.

## Owner-reserved actions

List decisions that automation or adapters MUST NOT take autonomously.

## Escalation

Document when the automation must stop and require owner intervention.
