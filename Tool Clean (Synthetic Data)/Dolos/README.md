# Dolos

Synthetic, clean-by-design JavaScript project for **Dolos**.

Domain: An aquarium kelp-growth and water-chemistry tracker split across three files with deliberately distinct vocabulary and logic.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What a passing result looks like

Every pairwise similarity score Dolos reports across the three source files stays low (all under 0.2 here) -- no real code-clone signal.

## Command

```bash
dolos run src/*.js -l javascript
```

## Notes

Needed a native rebuild (node-gyp) at install time; the default install failed because node-gyp tries to fetch Node headers from nodejs.org, which this sandbox blocks. Fixed with `npm install --nodedir=<local node include dir>`, pointing node-gyp at headers already on disk instead of downloading them.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | CLEAN (installed and run for real under this family's own Node binary) |
| node24 | CLEAN (installed and run for real under this family's own Node binary) |
| node26 | FINDING -- tree-sitter-compat (a Dolos native dependency) fails to compile against Node 26's V8 headers: v8::Object::GetAlignedPointerFromInternalField's signature changed (now requires 3 args, not 1) between the V8 version tree-sitter-compat was written against and Node 26's bundled V8. Genuine, reproducible native-addon ABI break, not a sandbox artifact. |
