# gutcheck

Synthetic, invalid-by-design JavaScript project for **gutcheck**.

Domain: A tiered utility-meter billing calculator whose billCents() is exercised by two tests that both assert only assert.ok(true), never checking the actual return value.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

gutcheck reports 1 of 2 functions as not fully proven ('unnoticed' in this release's terminology): the test executes billCents but would not fail if its logic were destroyed.

## Command

```bash
gutcheck .
```

## Notes

This installed gutcheck release (0.10.0) reports non-value-pinning tests as 'unnoticed' rather than the older 'hollow' label the corpus's own clean_means uses, but the substance is identical: billCents' own tests never pin a value, so mutating billCents freely would not be caught. usageBetween (properly asserted) is correctly PROVEN.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node24 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node26 | **FINDINGS** (installed and run for real under this family's own Node binary) |
