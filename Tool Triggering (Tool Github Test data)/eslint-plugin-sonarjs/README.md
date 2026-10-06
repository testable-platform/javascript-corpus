# eslint-plugin-sonarjs

Synthetic, invalid-by-design JavaScript project for **eslint-plugin-sonarjs**.

Domain: A train ticket queue with a surchargeFor() method whose if/else-if chain returns the same value in every branch, and a priorityLabel() method with a repeated identical condition.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

eslint with plugin:sonarjs/recommended reports no-invariant-returns, no-all-duplicated-branches, and no-identical-conditions -- 3 real findings.

## Command

```bash
eslint src/ test/
```

## Notes

surchargeFor()'s 4-way if/else-if all return 0, and priorityLabel() repeats the same 'isLoyalty === true' condition twice in the same chain -- both are textbook sonarjs findings, not edge cases.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node24 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node26 | **FINDINGS** (installed and run for real under this family's own Node binary) |
