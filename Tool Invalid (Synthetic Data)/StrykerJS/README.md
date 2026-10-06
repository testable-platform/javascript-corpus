# StrykerJS

Synthetic, invalid-by-design JavaScript project for **StrykerJS**.

Domain: A three-phase traffic signal controller whose 3 tests all call their target method but only ever assert.ok(true), never pinning a return value.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

Stryker reports a final mutation score of 5.13 against a break threshold of 100 -- 94.87% of mutants survive or go uncovered.

## Command

```bash
stryker run
```

## Notes

Every test in this folder exercises its target function but asserts nothing about its behavior, so almost every mutant (AssignmentOperator, ConditionalExpression, and more) survives untouched -- a near-total mutation-testing failure, not a marginal one.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node24 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node26 | **FINDINGS** (installed and run for real under this family's own Node binary) |
