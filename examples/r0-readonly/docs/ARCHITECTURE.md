# R0 Read-Only Example Architecture

## Purpose

Demonstrate the minimum TSAL project socket for a read-only automation.

## Boundary

The example reads source data and produces a report without mutating external systems.

## Source of truth

The declared input source is authoritative. Generated reports are derived artifacts and may be rebuilt.

## Authority

No external write authority is permitted. Adding a write-capable adapter invalidates the R0 assumption and requires reclassification.

## State and side effects

No durable external mutation is performed. Evidence may be written locally to the declared evidence directory.

## Verification

`tsal doctor examples/r0-readonly` must pass, the automation contract must parse, and all declared artifact paths must exist in canonical relative form.
