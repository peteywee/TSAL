# Incident / Lesson Record

## Incident identity

- Incident ID:
- Project ID:
- Automation ID:
- Detected at:
- Severity:

## What happened

Describe observed reality without interpretation.

## What should have happened

State the expected invariant or outcome.

## Detection

How was the discrepancy discovered?

## Immediate containment

What stopped or bounded further damage?

## Ambiguity

Could an external side effect have occurred without local confirmation? If yes, describe the reconciliation requirement.

## Root cause

Explain why the system was capable of entering this state. Do not stop at the line of code that failed.

## Control analysis

- Which TSAL/project control should have prevented or detected this?
- Did the control work, fail, or not exist?
- Was the control deterministic or judgment-based?

## Recovery

How was truthful state restored and operation resumed safely?

## Evidence

Reference exact candidate IDs, run IDs, logs, remote observations, or other proof.

## Lesson

State the reusable lesson in technology-agnostic language.

## Proposed invariant

What should always be true from now on?

## Negative test

How can this failure be reproduced intentionally?

## Promotion decision

- [ ] local implementation fix only
- [ ] project rule
- [ ] TSAL control/check
- [ ] TSAL core candidate

### Promotion justification

Explain why this lesson is or is not generic enough to promote.
