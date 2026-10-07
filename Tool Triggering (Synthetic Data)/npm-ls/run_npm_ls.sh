#!/usr/bin/env bash
# npm ls -- primary tool, branch JS_V12_ESBUILD_NPM_MICRO (Node 12).
# Added to match the 23-tool list; same layout as the other runners.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
# shellcheck source=/dev/null
. "$ROOT/Tool Triggering (Synthetic Data)/_skip.sh"

mkdir -p "$ROOT/reports"

cd "$ROOT"
FINDINGS_EXIT=1
FINDINGS_RC_MAX=1
npm ls --all --json > reports/npm-ls-only.json
rc=$?
accept_findings "npm-ls" "$rc" "reports/npm-ls-only.json"
exit $?
