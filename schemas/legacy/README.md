# Legacy TSAL Schemas

These files preserve exact historical schema blobs so older TSAL project sockets remain inspectable after the current schemas evolve.

Current compatibility retained by TSAL 0.3:

- `AUTOMATION-CONTRACT-0.1.schema.json`
- `PROJECT-MANIFEST-0.2.schema.json`
- `EVIDENCE-0.2.schema.json`
- `CONFORMANCE-REPORT-0.2.schema.json`

Legacy support means TSAL tooling can read and evaluate these inputs. It does **not** mean an older schema can prove requirements that did not exist in that schema. For example, automation-contract 0.1 cannot fully prove separated retry semantics, and evidence 0.2 cannot automatically satisfy claim-level checks that require `claim_id` and `evidence_class`.

New projects should use the current schemas at the repository root / `schemas/` paths.
