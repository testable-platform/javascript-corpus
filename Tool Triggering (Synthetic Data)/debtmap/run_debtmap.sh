#!/usr/bin/env bash
# debtmap -- alternative tool, branch JS_V22_ESBUILD_PNPM_MICRO (Node 22).
# Added to match the 23-tool list; same layout as the other runners.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
# shellcheck source=/dev/null
. "$ROOT/Tool Triggering (Synthetic Data)/_skip.sh"

mkdir -p "$ROOT/reports"
require_binary "debtmap" "debtmap"

cd "$ROOT"
FINDINGS_EXIT=1
debtmap analyze packages --format json --output reports/debtmap.json
rc=$?
accept_findings "debtmap" "$rc" "reports/debtmap.json"
exit $?
