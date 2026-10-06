# pydriller

Synthetic, invalid-by-design JavaScript project for **pydriller**.

Domain: A diary module with a real 4-commit, 3-author git history; driver.py deliberately scopes pydriller's own traversal to commits since a cutoff date that excludes part of that real history.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

pydriller (scoped since 2026-01-04) sees 2 of the repo's 4 real commits (50%) and 2 of its 3 real authors, diverging from plain `git log` on both counts.

## Command

```bash
python3 driver.py
```

## Notes

The divergence is a real, reproducible consequence of pydriller's own `since` filter being pointed at a date that falls inside the true history, not a fabricated mismatch -- the same cross-check technique the Clean sibling's driver.py uses, deliberately misapplied here.
