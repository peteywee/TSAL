# Top Shelf Automation Lifecycle (TSAL)

TSAL answers a practical question about an automation project. Does its evidence support what the project claims it can do? A project describes its automation contracts, evidence and incident records in `tsal.project.json`. The local CLI reads those files and reports conformance. Its contracts are independent of business domain, AI provider and execution platform.

## Try the read-only example

From the repository root, use Node.js 22 or later and pnpm.

```sh
pnpm install --frozen-lockfile
node tooling/cli.mjs doctor examples/r0-readonly
node tooling/cli.mjs audit examples/r0-readonly --strict
pnpm run verify
```

`doctor` checks project structure. `audit` validates the declared inputs and evaluates the evidence. The example has to satisfy the published schemas before it can earn a proven result. Removing required contract fields or setting the retry limit to a negative number fails validation. The final command checks both the repository and the example, then runs the tests. [Example project](examples/r0-readonly) · [Conformance model](docs/CONFORMANCE-MODEL.md)

## Use it with another project

Run `node tooling/cli.mjs init ./my-automation` to create a starter project. Fill in its contract, record evidence from the actual workload, then run `node tooling/cli.mjs audit ./my-automation --json` for a machine-readable report. The workload owns its execution and recovery. [Lifecycle](AUTOMATION-LIFECYCLE.md) · [Failure test matrix](FAILURE-TEST-MATRIX.md)

| Find | Location |
| --- | --- |
| Contract fields and constraints | [Automation contract schema](AUTOMATION-CONTRACT.schema.json) |
| Manifest, evidence and incident formats | [Schemas](schemas) |
| How an external control plane consumes results | [Integration model](docs/INTEGRATION-MODEL.md) |
| Current release and compatibility | [Version](VERSION) · [Changelog](CHANGELOG.md) · [Version policy](docs/VERSIONING.md) |

Changes go through a short branch into `rebuild` and then from the verified rebuild to `main`. [TopShelf Operating System](https://github.com/peteywee/topshelf-operating-system) owns the separate manifest executor.
