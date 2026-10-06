# Git-Spark

Synthetic, invalid-by-design JavaScript project for **Git-Spark**.

Domain: A lumber-yard module split across 3 files, with a real 91-commit history from 8 rotating authors, each file rewritten ~30 times with substantial (100+ line) diffs.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

git-spark's console report shows Overall Risk Level: MEDIUM (not LOW), with all 3 files flagged for high churn, many authors, and recent changes.

## Command

```bash
git-spark -f console
```

## Notes

git-spark's own risk-scoring formula weighs per-file churn, author count, commit count, and recency; this history was engineered (3 files, 30 commits each, 8 distinct authors, dated within the measurement window) specifically to cross its internal risk-score threshold for a non-LOW overall rating -- confirmed by running the real tool, not by asserting the category.
