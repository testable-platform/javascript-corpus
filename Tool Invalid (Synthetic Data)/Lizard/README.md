# Lizard

Synthetic, invalid-by-design JavaScript project for **Lizard**.

Domain: A windmill power-output estimator with an 8-parameter, 66-line, CCN-26 function, plus a 7-parameter, CCN-10 turbine-state classifier.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

lizard -C 10 -L 60 -a 5 -w flags 2 of the file's 3 functions (66.7%) over threshold -- CCN 26 and CCN 10, both over the -C 10 limit, and the first also over length/param-count limits.

## Command

```bash
lizard src/ -C 10 -L 60 -a 5 -w
```

## Notes

estimatePowerWatts alone is almost a direct CCN/length/param-count hat-trick failure; classifyTurbineState adds a second genuine over-threshold function, for a clear majority (2/3) of the file's functions flagged.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | FINDINGS (non-Node tool; content identical across families) |
| node24 | FINDINGS (non-Node tool; content identical across families) |
| node26 | FINDINGS (non-Node tool; content identical across families) |
