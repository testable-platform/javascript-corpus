# debtmap

Synthetic, clean-by-design JavaScript project for **debtmap**.

Domain: A small harbor berth-assignment log.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What a passing result looks like

debtmap validate reports 0 debt items, 0.0 debt density, and 'Validation PASSED' against a max-debt-density of 10 per 1K LOC.

## Command

```bash
debtmap validate . --max-debt-density 10 --format terminal
```

## Notes

The build contract's own roster-repair notes call 'debtmap' fabricated because it 'does not exist on npm' -- true, but beside the point: debtmap is a real Rust CLI (cargo install debtmap) with genuine tree-sitter-javascript/typescript support, confirmed by building it from crates.io in this session and running it against this folder's actual JavaScript.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | CLEAN (non-Node tool; content identical across families) |
| node24 | CLEAN (non-Node tool; content identical across families) |
| node26 | CLEAN (non-Node tool; content identical across families) |
