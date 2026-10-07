#!/usr/bin/env bash
# Shared runner preamble. Sourced by every run_* script in Tool Triggering (Synthetic Data)/*/.
# Ported from the sibling Python corpus's tools/_skip.sh -- same four-code
# discipline, same reason for it:
#
#   0  tool ran and wrote its report
#   1  tool ran and failed
#   3  SKIPPED       -- the tool cannot run on this Node family (a finding)
#   4  NOT INSTALLED -- the tool is absent from this host (a setup gap)
#
# Do not "simplify" a skip into exit 0. A skip that looks like a pass is
# the defect this corpus exists to make visible, not the report.
SKIP_EXIT=3
MISSING_EXIT=4

node_major() {
  node -e "console.log(process.versions.node.split('.')[0])" 2>/dev/null || echo "unknown"
}

_status() {
  mkdir -p "$ROOT/reports"
  printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$ROOT/reports/_tool-status.tsv"
}

# require_node_floor <tool-dir> <declared-floor-or-empty> <pin-or-empty>
# Compares the DECLARED floor against the running Node major. A claim, not
# the fact -- require_require / require_smoke below are the fact.
require_node_floor() {
  local dir="$1" floor="$2" pin="$3"
  [ -z "$floor" ] && return 0
  local have="$(node_major)"
  if [ "$have" -lt "$floor" ] 2>/dev/null; then
    echo "STATUS: SKIPPED"
    echo "  tool   : $dir"
    echo "  pin    : ${pin:-none}"
    echo "  declares: Node >=$floor"
    echo "  running : Node $have"
    echo "  reason  : the pinned release excludes this Node family, so it"
    echo "            never installed. Declared on purpose; see dataset.json."
    _status "$dir" "SKIPPED" "declared floor >=$floor > running Node $have"
    exit $SKIP_EXIT
  fi
  return 0
}

# require_require <tool-dir> <module> <pin>
# Actually requires the module. A declared floor is a claim; this is closer
# to the fact -- require_smoke below is the fact, since a module can
# import cleanly and still die the moment it is actually invoked.
require_require() {
  local dir="$1" mod="$2" pin="$3"
  [ -z "$mod" ] && return 0
  local err
  if err="$(node -e "require('$mod')" 2>&1)"; then
    return 0
  fi
  echo "STATUS: SKIPPED"
  echo "  tool   : $dir"
  echo "  pin    : ${pin:-none}"
  echo "  running: Node $(node_major)"
  echo "  require error: $(printf '%s' "$err" | tail -1)"
  echo "  reason : the module is not requireable on this Node family. If it"
  echo "           installed anyway, its declared floor was wrong."
  _status "$dir" "SKIPPED" "require failed: $(printf '%s' "$err" | tail -1)"
  exit $SKIP_EXIT
}

# require_smoke <tool-dir> <pin> <command...>
# A cheap real invocation (usually --version) before doing real work --
# three levels of evidence, in order: declared floor (a claim), a real
# `require` (better), the tool actually starting (the fact).
require_smoke() {
  local dir="$1" pin="$2"; shift 2
  local err
  if err="$("$@" 2>&1)"; then return 0; fi
  echo "STATUS: SKIPPED"
  echo "  tool   : $dir"
  echo "  pin    : ${pin:-none}"
  echo "  running: Node $(node_major)"
  echo "  smoke cmd: $*"
  echo "  error  : $(printf '%s' "$err" | tail -1)"
  echo "  reason : the package installs and requires, but the tool cannot"
  echo "           start on this Node family. A declared floor and a"
  echo "           require both said otherwise."
  _status "$dir" "SKIPPED" "smoke failed: $(printf '%s' "$err" | tail -1)"
  exit $SKIP_EXIT
}

# require_git_repo <tool-dir>
# History-mining tools need real history. Absence of .git is a HOST
# precondition failure, not a Node-family finding -- exit 4, not 3.
require_git_repo() {
  local dir="$1"
  [ -d "$ROOT/.git" ] && return 0
  echo "STATUS: NOT INSTALLED"
  echo "  tool  : $dir"
  echo "  reason: $ROOT is not a git repository, and this tool mines history."
  _status "$dir" "NOT_INSTALLED" "no .git directory"
  exit $MISSING_EXIT
}

# require_binary <tool-dir> <executable>
# Exit 4, NOT 3: a missing binary is a property of the HOST, never let it
# masquerade as a finding about this Node family.
require_binary() {
  local dir="$1" exe="$2"
  command -v "$exe" >/dev/null 2>&1 && return 0
  echo "STATUS: NOT INSTALLED"
  echo "  tool  : $dir"
  echo "  reason: '$exe' is not on PATH -- a standalone binary, not an npm"
  echo "          pin, so no package manager here can supply it. See"
  echo "          $dir/trigger.yaml in Tool Triggering (Synthetic Data)."
  _status "$dir" "NOT_INSTALLED" "$exe not on PATH"
  exit $MISSING_EXIT
}

ran_ok() { _status "$1" "RAN" "${2:-ok}"; }

# accept_findings <tool-dir> <exit-code> <expected-report>
# Many analysers exit non-zero to mean "I found something" -- on a corpus
# whose whole purpose is planted defects, that inverts the exit code. A
# runner sets FINDINGS_EXIT=1 (or lists FINDINGS_RC) when its tool behaves
# that way; the run is accepted only if the tool ALSO produced its report.
accept_findings() {
  local dir="$1" rc="$2" out="$3"
  if [ "$rc" -eq 0 ]; then ran_ok "$dir" "exit 0"; return 0; fi
  for code in ${FINDINGS_RC:-}; do
    if [ "$rc" = "$code" ]; then
      echo "NOTE: exit $rc is this tool's own 'found something' code."
      ran_ok "$dir" "exit $rc (tool findings code -- expected)"
      return 0
    fi
  done
  if [ "${FINDINGS_EXIT:-0}" = "1" ] && [ "$rc" -le "${FINDINGS_RC_MAX:-2}" ]; then
    if [ -z "$out" ] || [ -e "$ROOT/$out" ]; then
      echo "NOTE: exit $rc means findings were reported, not that the tool failed."
      ran_ok "$dir" "exit $rc (findings present -- expected)"
      return 0
    fi
    echo "FAIL: $dir exited $rc AND produced no report at $out."
  fi
  _status "$dir" "FAILED" "exit $rc"
  if [ "$rc" -eq 3 ] || [ "$rc" -eq 4 ]; then return 1; fi
  return "$rc"
}
