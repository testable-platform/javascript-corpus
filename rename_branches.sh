#!/usr/bin/env bash
# Rename every CE-N{version}-{id} branch/worktree in javascript-combos to the
# flat sequential JS-XXX convention used by the sibling corpora
# (TS-001..216, CS-001..312, JV-001..432, PY-001..216): one prefix, one
# monotonic counter across the whole corpus, family/version kept only as
# metadata (COMBOS.csv), never embedded in the branch name.
#
# This does NOT run automatically as part of the Cowork session — it's meant
# to be reviewed and run by you (e.g. via Claude Code) from the "main"
# worktree, since it rewrites local branches, moves worktree directories, and
# pushes/deletes branches on origin.
#
# Usage:
#   cd "javascript corpus/main"
#   ./rename_branches.sh branch_rename_map.csv          # dry run (default)
#   ./rename_branches.sh branch_rename_map.csv --apply   # actually do it
#
set -euo pipefail

MAP="${1:-branch_rename_map.csv}"
APPLY="${2:-}"

if [ ! -f "$MAP" ]; then
  echo "map file not found: $MAP" >&2
  exit 1
fi

ROOT="$(git rev-parse --show-toplevel)"
PARENT="$(dirname "$ROOT")"

echo "worktree parent: $PARENT"
if [ "$APPLY" != "--apply" ]; then
  echo "DRY RUN — pass --apply to actually rename/move/push. Showing the plan:"
fi

count=0
skipped=0

tail -n +2 "$MAP" | while IFS=, read -r old new _ver _bundler _pm _arch; do
  old_path="$PARENT/$old"
  new_path="$PARENT/$new"

  if [ ! -d "$old_path" ]; then
    echo "SKIP: worktree not found for $old ($old_path)" >&2
    skipped=$((skipped + 1))
    continue
  fi

  if [ "$APPLY" != "--apply" ]; then
    echo "  $old  ->  $new"
    continue
  fi

  echo "==> $old -> $new"

  # 1. Rename the local branch from inside its own worktree.
  git -C "$old_path" branch -m "$old" "$new"

  # 2. Move the worktree directory to match (uses git's own bookkeeping,
  #    not a plain `mv`, so the worktree admin files stay consistent).
  git worktree move "$old_path" "$new_path"

  # 3. Push the new branch, then remove the old one from origin.
  git -C "$new_path" push origin "$new"
  git -C "$new_path" push origin --delete "$old" || \
    echo "  (no remote copy of $old — nothing to delete)"

  count=$((count + 1))
done

echo "Plan/run covered 576 expected branches. Verify after --apply with:"
echo "  git branch -a | grep -c '^..JS-'   # expect 576"
echo "  git branch -a | grep '^..CE-N'     # expect nothing left"
