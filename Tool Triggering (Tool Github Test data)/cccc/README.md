# cccc

Synthetic, invalid-by-design JavaScript project for **cccc**.

Domain: A freight-surcharge ledger written in C -- CCCC parses C/C++/Java, not JavaScript (same documented category error as the Clean sibling).

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

cccc's own cccc.xml reports a module cyclomatic complexity of 33, more than 3x the threshold of 10.

## Command

```bash
cccc src/*.c && (parse .cccc/cccc.xml)
```

## Notes

classify_surcharge_cents and weight_tier_code are both deliberately tangled (dense if/else chains and a 12-way switch). cccc groups the whole file into one 'anonymous' module in this version, whose combined McCabe cyclomatic complexity (33) is measured for real and is more than 3x over threshold -- a clear, reproducible FINDING, not asserted.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | FINDINGS (non-Node tool; content identical across families) |
| node24 | FINDINGS (non-Node tool; content identical across families) |
| node26 | FINDINGS (non-Node tool; content identical across families) |
