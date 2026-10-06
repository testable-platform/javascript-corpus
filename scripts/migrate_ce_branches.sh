#!/usr/bin/env bash
# Copy every CE-* branch from the split repos into origin (javascript-combos).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "origin remote is missing" >&2
  exit 1
fi

VERSIONS=(12 14 16 18 21 22 24 26)
SLICES=("001-016" "017-032" "033-048" "049-064")

for ver in "${VERSIONS[@]}"; do
  for slice in "${SLICES[@]}"; do
    src="https://github.com/BENNYameen/javascript-n${ver}-${slice}.git"
    echo "==> fetch n${ver} ${slice}"
    git fetch --no-tags --prune "$src" "+refs/heads/CE-*:refs/ce-import/CE-*"
    echo "==> push n${ver} ${slice}"
    git push origin "+refs/ce-import/CE-*:refs/heads/CE-*"
    git for-each-ref --format='%(refname)' refs/ce-import | while read -r ref; do
      git update-ref -d "$ref"
    done
  done
done

echo "done migrating existing CE branches"
