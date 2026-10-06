import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { formatMarkdown } from '../mutation/gutcheck.mjs';

const GUT = resolve('mutation/gutcheck.mjs');
const base = { runner: 'node', scored: 1, caught: 1, hollow: [], inconclusive: [], skipped: [], probes: 2, capped: 0 };
const r = { ...base, changes: [
  { file: 'src/m.mjs', fn: 'exec', line: 2, status: 'proven', granularity: 'hunk', evidence: { via: 'execution', executedBy: ['t.test.mjs', 'u.test.mjs'], redBy: ['u.test.mjs'], mutant: '987654321', sameDiffOracle: false } },
  { file: 'src/m.mjs', fn: 'quiet', line: 3, status: 'unnoticed', granularity: 'hunk', evidence: { executedBy: ['t.test.mjs'], mutants: ['987654321', 'undefined'] } },
  { file: 'src/m.mjs', fn: 'named', line: 5, status: 'untested', granularity: 'hunk', evidence: { mentionedBy: [{ file: 't.test.mjs', line: 3, name: 'c' }] } },
  { file: 'src/m.mjs', fn: 'ghost', line: 6, status: 'untested', granularity: 'hunk', evidence: {} },
], changeSummary: { files: 1, fns: 4, proven: 1, hollow: 0, unverifiable: 0, untested: 2, notProbed: 0, sameDiffProven: 0, unnoticed: 1, scope: 'diff', denominator: 'execution' } };

// Oracle: the cell text per status, written by hand from the spec's Surfaces section.
test('formatMarkdown renders the execution evidence and the unnoticed status', () => {
  const md = formatMarkdown(r);
  assert.match(md, /untested 2 · unnoticed 1/);
  assert.match(md, /\| `exec` \| src\/m\.mjs \| ✅ proven \| 1 of 2 executing tests went red when gutted \|/);
  assert.match(md, /\| `quiet` \| src\/m\.mjs \| ➖ unnoticed \| executed by 1 test; none went red when gutted \(wrong value, no-op\) \|/);
  assert.match(md, /\| `named` \| src\/m\.mjs \| ∅ untested \| no test executes it; named by 1 test, never run \|/);
  assert.match(md, /\| `ghost` \| src\/m\.mjs \| ∅ untested \| no test executes it \|/);
});

test('formatMarkdown under a static denominator keeps "no test mentions it"', () => {
  const s = { ...base, changes: [{ file: 'src/m.mjs', fn: 'ghost', line: 6, status: 'untested', granularity: 'hunk', evidence: {} }], changeSummary: { files: 1, fns: 1, proven: 0, hollow: 0, unverifiable: 0, untested: 1, notProbed: 0, sameDiffProven: 0, unnoticed: 0, scope: 'diff', denominator: 'static' } };
  const md = formatMarkdown(s);
  assert.match(md, /\| `ghost` \| src\/m\.mjs \| ∅ untested \| no test mentions it \|/);
  assert.doesNotMatch(md, /unnoticed/);
});

// Oracle: `make` is PIN-proven (the assertion's fragment contains `make(`); `parse` is a method only
// execution can attribute — gutting it goes red in the one test file that executes it → PROVEN by
// execution, 1 of 1. The fixture puts parse on its own line so line 2 selects it.
test('--explain on a SOURCE file:line prints the function\'s denominator evidence', () => {
  const d = mkdtempSync(join(tmpdir(), 'gc-explain-'));
  mkdirSync(join(d, 'src')); mkdirSync(join(d, 'test'));
  writeFileSync(join(d, 'package.json'), '{"type":"module"}');
  writeFileSync(join(d, 'src/m.mjs'), 'export function make() {\n  return { parse(v) { return v.trim(); } };\n}\n');
  writeFileSync(join(d, 'test/m.test.mjs'), "import { test } from 'node:test'; import assert from 'node:assert';\nimport { make } from '../src/m.mjs';\ntest('p', () => { assert.equal(make().parse(' a '), 'a'); });\n");
  try {
    const out = spawnSync(process.execPath, [GUT, d, '--explain', 'src/m.mjs:2', '--runner=node', '--no-self-check'], { encoding: 'utf8' });
    assert.equal(out.status, 0, out.stderr + out.stdout);
    assert.match(out.stdout, /^src\/m\.mjs:2 parse\(\)/m);
    assert.match(out.stdout, /PROVEN by execution\..*1 of 1 executing test file\(s\) went red/s);
  } finally { rmSync(d, { recursive: true, force: true }); }
});
