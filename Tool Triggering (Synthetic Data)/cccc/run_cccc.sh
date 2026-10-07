#!/usr/bin/env bash
# cccc -- alternative tool, branch JS_V16_RSPACK_YARN_MICRO (Node 16).
# Added to match the 23-tool list; same layout as the other runners.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
# shellcheck source=/dev/null
. "$ROOT/Tool Triggering (Synthetic Data)/_skip.sh"

mkdir -p "$ROOT/reports"
require_binary "cccc" "cccc"

cd "$ROOT"
FINDINGS_EXIT=1
cccc --outdir=reports/cccc $(find packages -name '*.js')
rc=$?
accept_findings "cccc" "$rc" "reports/cccc"
exit $?
