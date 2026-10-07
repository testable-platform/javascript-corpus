#!/usr/bin/env bash
# Mocha -- primary tool, branch JS_V21_TURBOPACK_NPM_MICRO (Node 21).
# Added to match the 23-tool list; same layout as the other runners.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
# shellcheck source=/dev/null
. "$ROOT/Tool Triggering (Synthetic Data)/_skip.sh"

mkdir -p "$ROOT/reports"
require_node_floor "mocha" "20" "mocha@12.0.1"
require_smoke "mocha" "mocha@12.0.1" npx --yes mocha@12.0.1 --version

cd "$ROOT"
FINDINGS_EXIT=1   # non-zero from mocha means failing tests, not 'broke'
npx --yes mocha@12.0.1 "packages/shared/tests/**/*.test.js" --reporter json > reports/mocha.json
rc=$?
accept_findings "mocha" "$rc" "reports/mocha.json"
exit $?
