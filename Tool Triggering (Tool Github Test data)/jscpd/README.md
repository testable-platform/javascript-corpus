# jscpd

Synthetic, invalid-by-design JavaScript project for **jscpd**.

Domain: A spice-inventory crate and a near-duplicate shelf-placement planner -- addStock/removeStock are copy-pasted almost verbatim between the two files.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

jscpd reports 56.02% duplicated tokens (2 real clones, 41.33% duplicated lines) at --min-lines 5 --min-tokens 30 --threshold 0.

## Command

```bash
jscpd src/ --min-lines 5 --min-tokens 30 --threshold 0 --reporters console
```

## Notes

A genuine majority of the two files' combined content (by token count) is duplicated logic, not an incidental few-line overlap.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node24 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node26 | **FINDINGS** (installed and run for real under this family's own Node binary) |
