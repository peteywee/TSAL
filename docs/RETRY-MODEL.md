# TSAL Retry Model

TSAL automation-contract schema 0.2 replaces the single overloaded retry counter from schema 0.1 with three separate concepts.

## 1. Dispatch retry

`retry.dispatch` governs repeated attempts of the same operation within one execution authority window.

`maximum_retry_attempts` counts retries **after the initial attempt**. A value of `0` means the initial dispatch may occur once but no immediate dispatch retry is permitted.

This is the only retry counter in the model.

## 2. Scheduler reevaluation

`retry.scheduler_reevaluation` answers whether a later scheduler/event invocation may evaluate the work item again after the current execution ends.

A later invocation is not automatically a retry. It is a new eligibility decision under current policy and current durable state.

This distinction prevents a periodic scheduler from being mistaken for an uncontrolled retry loop.

## 3. Ambiguous-outcome retry

`retry.ambiguous_outcome` governs the unsafe case where an external side effect may have escaped but the local caller cannot prove the result.

When any declared side effect has `ambiguity_possible: true`, TSAL requires:

```text
automatic_retry_allowed = false
requires_reconciliation = true
```

A timeout, transport error, or missing provider response is not proof that the side effect failed.

## Why these are separate

```text
same-call dispatch retry
        !=
later scheduler reevaluation
        !=
reconciliation of an ambiguous external result
```

Collapsing those mechanisms into one `maximum_attempts` value caused real ambiguity during XQueue dogfooding. XQueue could correctly permit a future scheduler invocation while prohibiting a blind retry of an uncertain create-post call. Schema 0.1 could describe that only in prose; schema 0.2 models it directly.

## Migration from contract schema 0.1

A legacy block such as:

```json
{
  "retry": {
    "strategy": "do not blindly retry ambiguous create",
    "maximum_attempts": 0,
    "backoff": "not applicable",
    "retryable_conditions": [],
    "non_retryable_conditions": ["ambiguous outcome"]
  }
}
```

should be migrated by deciding three independent policies rather than mechanically renaming fields.

Do not infer scheduler reevaluation or reconciliation policy from `maximum_attempts` alone.
