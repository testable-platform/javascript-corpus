import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatReport } from '../mutation/prove.mjs';

// Hand-built result objects — the report is a pure function of them. The static twin is asserted
// byte-identical to today's wording so nothing changes for Python/JVM or a repo with no observable runner.
const base = { runner: 'node', scored: 1, caught: 1, hollow: [], weak: [], oneSided: [], inconclusive: [], skipped: [], outOfScope: 0, probes: 3, capped: 0, pct: 100, envAborted: 0 };
const changes = [
  { file: 'src/m.mjs', fn: 'pinned', line: 1, status: 'proven', granularity: 'hunk', evidence: { via: 'pin', blocks: [{ file: 't.test.mjs', line: 1, name: 'a' }], sameDiffOracle: false } },
  { file: 'src/m.mjs', fn: 'exec', line: 2, status: 'proven', granularity: 'hunk', evidence: { via: 'execution', executedBy: ['t.test.mjs', 'u.test.mjs'], redBy: ['u.test.mjs'], mutant: '987654321', sameDiffOracle: false } },
  { file: 'src/m.mjs', fn: 'quiet', line: 3, status: 'unnoticed', granularity: 'hunk', evidence: { executedBy: ['t.test.mjs'], mutants: ['987654321', 'undefined'] } },
  { file: 'src/m.mjs', fn: 'ghost', line: 4, status: 'untested', granularity: 'hunk', evidence: {} },
  { file: 'src/m.mjs', fn: 'named', line: 5, status: 'untested', granularity: 'hunk', evidence: { mentionedBy: [{ file: 't.test.mjs', line: 3, name: 'c' }] } },
  { file: 'src/m.mjs', fn: 'empty', line: 6, status: 'unverifiable', granularity: 'hunk', evidence: { reason: 'no-distinct-mutant', executedBy: ['t.test.mjs'] } },
];
const exec = { ...base, changes, changeSummary: { files: 1, fns: 6, proven: 2, hollow: 0, unverifiable: 1, untested: 2, notProbed: 0, sameDiffProven: 0, unnoticed: 1, scope: 'diff', denominator: 'execution' } };

test('diff report under an execution denominator: headline, unnoticed/untested rows, proven-by-execution list, readable reasons', () => {
  const out = formatReport(exec);
  assert.match(out, /^gutcheck: 6 functions in this diff — 2 proven, 1 unnoticed, 2 untested, 0 hollow · 1 unverifiable\.$/m);
  assert.match(out, /^proven by execution — tests go red when the function is broken \(1\):\n  exec — 1 of 2 executing tests went red$/m);
  assert.match(out, /^unnoticed — tests execute it, none goes red when it does nothing \(1\):\n  quiet \(executed by 1 test\)$/m);
  assert.match(out, /^untested — no test executes them \(2\):\n  ghost, named \(named by 1 test, never run\)$/m);
  assert.match(out, /empty \(empty or return-only body: no distinct mutant\)/);
  assert.doesNotMatch(out, /no binding test/);
});

test('the static denominator keeps today\'s wording byte for byte', () => {
  const stat = { ...base, changes: [{ file: 'src/m.mjs', fn: 'ghost', line: 1, status: 'untested', granularity: 'hunk', evidence: {} }], changeSummary: { files: 1, fns: 1, proven: 0, hollow: 0, unverifiable: 0, untested: 1, notProbed: 0, sameDiffProven: 0, unnoticed: 0, scope: 'diff', denominator: 'static' } };
  const out = formatReport(stat);
  assert.match(out, /^gutcheck: 1 function in this diff — 0 proven, 1 with no binding test, 0 hollow\.$/m);
  assert.match(out, /^no binding test — no test names it \(1\):\n  ghost$/m);
});

test('the bare-scan appendix under execution uses the same rows in repo words', () => {
  const repo = { ...exec, changeSummary: { ...exec.changeSummary, scope: 'repo' } };
  const out = formatReport(repo);
  assert.match(out, /^gutcheck: 6 functions in this repo — 2 proven, 1 unnoticed, 2 untested, 0 hollow · 1 unverifiable\.$/m);
  assert.match(out, /^unnoticed — tests execute it, none goes red when it does nothing \(1\):$/m);
});
