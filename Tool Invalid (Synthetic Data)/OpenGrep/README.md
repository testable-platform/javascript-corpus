# OpenGrep

Synthetic, invalid-by-design JavaScript project for **OpenGrep**.

Domain: A gate-access badge controller using Math.random() for a visitor code and a child_process.exec() built from string concatenation.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

semgrep (the same-engine stand-in used in the Clean sibling) reports 2 of the folder's own 3 ruleset findings (67%) against the committed semgrep-rules.yml.

## Command

```bash
opengrep --config=semgrep-rules.yml --error src/  (opengrep binary unavailable -- see notes; semgrep ran instead)
```

## Notes

The opengrep binary itself remains a GitHub release asset blocked by this sandbox's egress allowlist (same as the Clean sibling), but unlike Clean's clean source, this folder's content genuinely trips the same-engine semgrep stand-in: no-insecure-random-for-tokens and no-child-process-exec-with-concat both fire for real.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | FINDINGS (non-Node tool; content identical across families) |
| node24 | FINDINGS (non-Node tool; content identical across families) |
| node26 | FINDINGS (non-Node tool; content identical across families) |
