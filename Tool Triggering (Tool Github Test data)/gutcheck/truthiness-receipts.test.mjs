import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync, execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { prove, formatReport, pyBlocks } from '../mutation/prove.mjs';
import { classifyChanges } from '../mutation/changes.mjs';

// Receipts for the truthiness-boolean probe. A receipt that names a mutation the probe never applied
// (`return 987654321` on a function that was gutted to `return false`), a PROVEN line on a block the
// report itself calls one-sided, or a skip reason that asserts a false fact ("tested function not
// locatable" for a function the probe located and gutted) is a wrong statement about evidence — the
// one thing the receipts exist to never be. Oracle for every pin below: the mutation grossBreak
// actually writes for a bool pin (`false`, then `true`; Python `False`/`True`), derived from
// mutation/probe.mjs's sentinel table, never from the emitter's own output.

const GUT = resolve('mutation/gutcheck.mjs');
const head = "import { test } from 'node:test'; import assert from 'node:assert';";
const HAS_PY = (() => { try { execSync('python3 --version', { stdio: 'ignore' }); return true; } catch { return false; } })();
const HAS_PYTEST = HAS_PY && (() => { try { execSync('python3 -m pytest --version', { stdio: 'ignore' }); return true; } catch { return false; } })();

function project(files) {
  const d = mkdtempSync(join(tmpdir(), 'gc-receipts-'));
  for (const [r, b] of Object.entries(files)) { const f = join(d, r); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, b); }
  return d;
}
const run = (args) => spawnSync(process.execPath, [GUT, ...args], { encoding: 'utf8' });

// A swallowed truthiness assertion: green under both bool sentinels — a TRUE hollow, minted with
// `return false` and confirmed with `return true`. The numeric sentinel never touched this function.
const SWALLOWED = {
  'package.json': '{"type":"module"}',
  'src/v.mjs': 'export function isValid(n) { return n > 0; }\n',
  'test/t.test.mjs': `${head} import { isValid } from '../src/v.mjs';\ntest('swallowed truthiness', () => { try { assert.ok(isValid(5)); } catch {} });\n`,
};

test('--explain HOLLOW receipt on a bool-pinned block names `return false` then `return true`, never the numeric sentinel', () => {
  const d = project(SWALLOWED);
  try {
    const r = prove(d, { runner: 'node' });
    assert.equal(r.hollow.length, 1, 'the swallowed truthiness test is hollow');
    assert.deepEqual(r.hollow[0].survivorPairs[0].sentinels, ['false', 'true'], 'the hollow row records the sentinels that were actually run');
    const x = run(['--explain', 'test/t.test.mjs:2', d, '--runner=node']);
    assert.match(x.stdout, /HOLLOW/);
    assert.match(x.stdout, /`return false`/, 'names the primary bool mutant');
    assert.match(x.stdout, /`return true`/, 'names the confirming opposite mutant');
    assert.doesNotMatch(x.stdout, /987654321/, 'the numeric sentinel was never applied to this function');
    assert.equal(x.status, 1);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

// A relational-only pin on a plain run: +987654321 passes `score(1) > 0` (survivor), -987654321 reds
// it — a one-sided block, with no fully-bound fn. --explain used to fall through to the generic
// PROVEN line for it; the block's verdict is ONE-SIDED and the receipt must say so.
const RELATIONAL = {
  'package.json': '{"type":"module"}',
  'src/s.mjs': 'export function score(n) { return n * 10; }\n',
  'test/t.test.mjs': `${head} import { score } from '../src/s.mjs';\ntest('score is positive', () => { assert.ok(score(1) > 0); });\n`,
};

test('--explain on a one-sided block says ONE-SIDED with both observed runs, not PROVEN', () => {
  const d = project(RELATIONAL);
  try {
    const r = prove(d, { runner: 'node' });
    assert.deepEqual(r.oneSided.map((o) => [o.fn, o.posRed]), [['score', false]], 'fixture is one-sided on a plain run');
    const x = run(['--explain', 'test/t.test.mjs:2', d, '--runner=node']);
    assert.match(x.stdout, /ONE-SIDED/);
    assert.match(x.stdout, /score\(\) both ways and reran only this test: passes under the positive sentinel, red under the negative one/);
    assert.doesNotMatch(x.stdout, /PROVEN/);
    assert.equal(x.status, 0, 'one-sided is a verdict, never a blocker');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('oneSidedRowTail: the one wording site for a one-sided row (full-scan, diff, markdown, --explain)', async () => {
  const { oneSidedRowTail } = await import('../mutation/report.mjs');
  assert.equal(oneSidedRowTail({ file: 'a.test.mjs', posRed: true }), 'red under the positive sentinel, passes under the negative one');
  assert.equal(oneSidedRowTail({ file: 'a.test.mjs', posRed: false }), 'passes under the positive sentinel, red under the negative one');
});

test("classifyChanges: a fn whose own mutant survived inside a block a sibling turned red reads 'sibling-caught', never 'no-pin'", () => {
  const changed = [
    { file: 'src/a.mjs', granularity: 'hunk', decls: [{ fn: 'isStale', line: 1, endLine: 1 }, { fn: 'rank', line: 3, endLine: 3 }] },
    { file: 'src/z.mjs', granularity: 'hunk', decls: [{ fn: 'isStale', line: 1, endLine: 1 }] },
  ];
  const blocks = [{
    file: 't/p.test.mjs', line: 3, name: 'pair', bodyMasked: 'assert.ok(!isStale(3)); assert.equal(rank(1), 2);', verdict: 'caught',
    caughtFns: ['rank'], survivors: ['isStale'], caughtPairs: [{ fn: 'rank', sutRel: 'src/a.mjs' }], survivorPairs: [{ fn: 'isStale', sutRel: 'src/a.mjs' }],
  }];
  const { changes, changeSummary } = classifyChanges(changed, blocks);
  const a = changes.find((c) => c.fn === 'isStale' && c.file === 'src/a.mjs');
  const z = changes.find((c) => c.fn === 'isStale' && c.file === 'src/z.mjs');
  assert.equal(a.status, 'unverifiable');
  assert.equal(a.evidence.reason, 'sibling-caught');
  assert.equal(z.status, 'unverifiable');
  assert.equal(z.evidence.reason, 'no-pin', 'a same-named fn in another file is only mentioned — pair attribution holds');
  const out = formatReport({ runner: 'node', scored: 1, caught: 1, pct: 100, probes: 1, hollow: [], skipped: [], inconclusive: [], outOfScope: 0, capped: 0, changes, changeSummary });
  assert.match(out, /isStale \(gutting it left this test green — the test went red only for another function it calls\)/);
});

test('--explain skip messages: pin-unresolved and a runtime-computed title each get their own wording', () => {
  const d = project({
    'package.json': '{"type":"module"}',
    'src/m.mjs': 'export function double(n) { return n * 2; }\n',
    'test/local.test.mjs': `${head} import { double } from '../src/m.mjs';\ntest('bare variable pinned', () => { const x = 2 + 2; assert.strictEqual(x, 4); });\n`,
    'test/dyn.test.mjs': `${head} import { double } from '../src/m.mjs';\nconst id = 3;\ntest(\`double of \${id}\`, () => { assert.strictEqual(double(id), 6); });\n`,
  });
  try {
    const local = run(['--explain', 'test/local.test.mjs:2', d, '--runner=node']);
    assert.match(local.stdout, /not probed: the test pins a value, but that value is not a direct call of a function this file imports/);
    assert.doesNotMatch(local.stdout, /no value-pinning assertion/);
    const dyn = run(['--explain', 'test/dyn.test.mjs:3', d, '--runner=node']);
    assert.match(dyn.stdout, /computed at runtime \(template-literal interpolation or a parameterized \.each\/\.for table\)/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('--explain no-pin message speaks the test file\'s own assertion dialect and names the truthiness form', { skip: !HAS_PYTEST }, () => {
  const d = project({
    'pytest.ini': '[pytest]\n',
    'sut_h.py': 'def score(n):\n    return n * 2\n',
    'test_h.py': 'from sut_h import score\n\n\ndef test_score_is_not_none():\n    assert score(2) is not None\n',
  });
  try {
    const x = run(['--explain', 'test_h.py:4', d]);
    assert.match(x.stdout, /not probed: no value-pinning assertion \(assertEqual\/==\) and no direct truthiness check \(`assert f\(x\)`\/assertTrue\(f\(x\)\)\)/);
    assert.doesNotMatch(x.stdout, /toBe|strictEqual/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('py_blocks: builtin head callees (all/bool/len) are never bool pins; a direct imported call still is', { skip: !HAS_PY }, () => {
  const d = project({
    'sut.py': 'def f(n):\n    return n > 0\n\n\ndef tags(n):\n    return ["a"] * n\n',
    'test_b.py': 'from sut import f, tags\n\n\ndef test_all():\n    assert all(f(x) for x in [1, 2])\n\n\ndef test_bool():\n    assert bool(f(1))\n\n\ndef test_len():\n    assert len(tags(1))\n\n\ndef test_direct():\n    assert f(1)\n',
  });
  try {
    const r = pyBlocks(join(d, 'test_b.py'));
    assert.ok(r, 'pyBlocks must parse');
    const by = Object.fromEntries(r.blocks.map((b) => [b.name, b.boolPins]));
    assert.deepEqual(by.test_all, []);
    assert.deepEqual(by.test_bool, []);
    assert.deepEqual(by.test_len, []);
    assert.deepEqual(by.test_direct, ['f']);
  } finally { rmSync(d, { recursive: true, force: true }); }
});
