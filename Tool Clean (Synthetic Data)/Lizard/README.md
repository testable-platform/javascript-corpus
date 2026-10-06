# Lizard

Synthetic, clean-by-design JavaScript project for **Lizard**.

Domain: A windmill power-output estimator.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What a passing result looks like

lizard -C 10 -L 60 -a 5 -w prints no warnings -- every function's CCN, length, and parameter count stays under threshold.

## Command

```bash
lizard src/ -C 10 -L 60 -a 5 -w
```

## Notes

External tool (pip install lizard), same as the Python sibling corpus; lizard parses JavaScript natively.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | CLEAN (non-Node tool; content identical across families) |
| node24 | CLEAN (non-Node tool; content identical across families) |
| node26 | CLEAN (non-Node tool; content identical across families) |
