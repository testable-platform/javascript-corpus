import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildExecutionMap, detectTargets, runExecutionDenominator } from '../mutation/denominator.mjs';

const head = "import { test } from 'node:test'; import assert from 'node:assert';";
function project(files) {
  const d = mkdtempSync(join(tmpdir(), 'gc-detect-'));
  for (const [r, b] of Object.entries(files)) { const f = join(d, r); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, b); }
  return d;
}
// Oracles by hand:
//   add    — pinned directly → gutting it goes red → proven (sentinel)
//   count  — the test only checks the return IS a number → sentinel (987654321) green, no-op (undefined)
//            red → proven via the no-op twin (a body swap removes effects under BOTH mutants, so an
//            effect-asserting test goes red under the sentinel already — the twin is for return SHAPE)
//   noise  — executed, nothing about it asserted → green under both → unnoticed
//   off    — executed, empty body → no-distinct-mutant, no run spent
//   ghost  — never executed → no entry
const SRC = 'export function add(a, b) { return a + b; }\nexport function count(x) { return x.length; }\nexport function noise(x) { return x * 3; }\nexport function off() {}\nexport function ghost() { return 9; }\n';
const TEST = `${head} import { add, count, noise, off } from '../src/m.mjs';\ntest('t', () => { noise(2); off(); assert.ok(typeof count('ab') === 'number'); assert.equal(add(1, 2), 3); });\n`;

test('detectTargets: proven (sentinel), proven (no-op twin), unnoticed, no-distinct-mutant; the budget counts mutant runs', () => {
  const d = project({ 'package.json': '{"type":"module"}', 'src/m.mjs': SRC, 'test/t.test.mjs': TEST });
  try {
    const { execBy, baselines } = buildExecutionMap(d, 'node', ['test/t.test.mjs'], ['src/m.mjs'], 60000);
    const targets = ['add', 'count', 'noise', 'off', 'ghost'].map((fn) => ({ srcRel: 'src/m.mjs', fn }));
    const budget = { probes: 0, maxProbes: 100, deadline: null };
    const res = detectTargets(d, 'node', targets, execBy, baselines, budget);
    assert.equal(res.get('src/m.mjs::add').status, 'proven'); assert.equal(res.get('src/m.mjs::add').mutant, '987654321');
    assert.equal(res.get('src/m.mjs::count').status, 'proven'); assert.equal(res.get('src/m.mjs::count').mutant, 'undefined');
    assert.equal(res.get('src/m.mjs::noise').status, 'unnoticed'); assert.deepEqual(res.get('src/m.mjs::noise').executedBy, ['test/t.test.mjs']);
    assert.deepEqual(res.get('src/m.mjs::off'), { status: 'unverifiable', why: 'no-distinct-mutant', executedBy: ['test/t.test.mjs'] });
    assert.equal(res.has('src/m.mjs::ghost'), false, 'never executed → no entry (classification reads untested)');
    assert.equal(budget.probes, 1 + 2 + 2, 'add: 1 run; count: sentinel + no-op; noise: sentinel + no-op; off: none');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('detectTargets: past the probe cap every remaining executed target reads probe-cap without a run', () => {
  const d = project({ 'package.json': '{"type":"module"}', 'src/m.mjs': SRC, 'test/t.test.mjs': TEST });
  try {
    const { execBy, baselines } = buildExecutionMap(d, 'node', ['test/t.test.mjs'], ['src/m.mjs'], 60000);
    const budget = { probes: 5, maxProbes: 5, deadline: null };
    const res = detectTargets(d, 'node', [{ srcRel: 'src/m.mjs', fn: 'add' }], execBy, baselines, budget);
    assert.deepEqual(res.get('src/m.mjs::add'), { status: 'unverifiable', why: 'probe-cap', executedBy: ['test/t.test.mjs'] });
    assert.equal(budget.probes, 5);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('runExecutionDenominator: null for a non-observable runner; the full object for node', () => {
  const d = project({ 'package.json': '{"type":"module"}', 'src/m.mjs': SRC, 'test/t.test.mjs': TEST });
  try {
    const common = { work: d, dir: d, testFiles: [join(d, 'test/t.test.mjs')], srcFiles: [join(d, 'src/m.mjs')], changed: null, targets: [{ srcRel: 'src/m.mjs', fn: 'add' }], timeoutMs: 60000, budget: { probes: 0, maxProbes: 100, deadline: null } };
    assert.equal(runExecutionDenominator({ ...common, runner: 'pytest' }), null);
    const ex = runExecutionDenominator({ ...common, runner: 'node' });
    assert.equal(ex.denominator, 'execution');
    assert.equal(ex.results.get('src/m.mjs::add').status, 'proven');
    assert.deepEqual(ex.testFilesRun, ['test/t.test.mjs']);
  } finally { rmSync(d, { recursive: true, force: true }); }
});
