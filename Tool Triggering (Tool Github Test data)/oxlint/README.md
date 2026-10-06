# oxlint

Synthetic, invalid-by-design JavaScript project for **oxlint**.

Domain: A tide-station reading log with an unused variable and a stray debugger statement.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

oxlint reports 2 real findings (no-unused-vars, no-debugger). Both are warning-severity by this tool's own default configuration, so (as with Lizard/knip in the Clean sibling's own verify.py) any non-empty output -- not exit code alone -- is treated as the real signal.

## Command

```bash
oxlint src/ test/
```

## Notes

oxlint's default rule severities are 'warn', which does not by itself flip the process exit code; the corpus's own verify script follows the same any-output-is-a-finding convention already established for Lizard/knip in the Clean sibling's verify.py, rather than trusting exit code alone.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node24 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node26 | **FINDINGS** (installed and run for real under this family's own Node binary) |
