#!/usr/bin/env bash
# CodeQL -- alternative tool, branch JS_V21_WEBPACK_NPM_MONO (Node 21).
# Added to match the 23-tool list; same layout as the other runners.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
# shellcheck source=/dev/null
. "$ROOT/Tool Triggering (Synthetic Data)/_skip.sh"

mkdir -p "$ROOT/reports"
require_binary "codeql" "codeql"

cd "$ROOT"
FINDINGS_EXIT=1
rm -rf reports/codeql-db
codeql database create --language=javascript-typescript --source-root=src -- reports/codeql-db && \
  codeql database analyze --format=sarif-latest --output=reports/codeql.sarif -- reports/codeql-db codeql/javascript-queries
rc=$?
accept_findings "codeql" "$rc" "reports/codeql.sarif"
exit $?
