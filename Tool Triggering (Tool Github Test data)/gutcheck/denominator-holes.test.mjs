import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync, execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { prove, isTestPath, parseBlocks } from '../mutation/prove.mjs';
import { grossBreak } from '../mutation/probe.mjs';
import { changedDecls } from '../mutation/changes.mjs';
import { findTestFiles } from '../checker/standalone.mjs';

// Denominator holes: a tested function reading "no test names it", a changed function with no row,
// a whole repo reading "0 tests", the untested nudge dropped by a fallback. The everyday product is
// the done-claim denominator — which changed functions have no binding test — so each of these is a
// false statement on the flagship surface. Oracles: the discovery/enumeration result a reader of the
// fixture would write down by hand, never the scanner's own output.

const GUT = resolve('mutation/gutcheck.mjs');
const head = "import { test } from 'node:test'; import assert from 'node:assert';";
const HAS_PYTEST = (() => { try { execSync('python3 -m pytest --version', { stdio: 'ignore' }); return true; } catch { return false; } })();
function project(files) {
  const d = mkdtempSync(join(tmpdir(), 'gc-denom-'));
  for (const [r, b] of Object.entries(files)) { const f = join(d, r); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, b); }
  return d;
}
const run = (args) => spawnSync(process.execPath, [GUT, ...args], { encoding: 'utf8' });
const commit = (d, msg) => execSync(`git add -A && git -c user.email=a@b.c -c user.name=t commit -qm "${msg}"`, { cwd: d });

test('--since: a diff whose only changes are untested functions keeps the diff report — the nudge is never widened away', () => {
  const d = project({
    'package.json': '{"type":"module"}',
    'src/a.mjs': 'export function add(a, b) { return a + b }\n',
    'test/a.test.mjs': `${head} import { add } from '../src/a.mjs';\ntest('adds', () => { assert.strictEqual(add(2, 3), 5); });\n`,
  });
  try {
    execSync('git init -q', { cwd: d }); commit(d, 'first');
    writeFileSync(join(d, 'src/b.mjs'), 'export function multiply(a, b) { return a * b }\n'); commit(d, 'second: multiply, untested');
    const r = run([d, '--runner=node', '--since=HEAD~1']);
    assert.match(r.stdout, /1 untested/, r.stdout); // execution denominator: multiply is imported by nobody
    assert.match(r.stdout, /multiply/);
    assert.doesNotMatch(r.stdout, /full suite/, 'the diff report carries the nudge — no fallback');
    assert.equal(r.status, 0);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('python: a changed fn named by an unpinned test reads unverifiable (no-pin), never "no test names it"', { skip: !HAS_PYTEST }, () => {
  const d = project({
    'pytest.ini': '[pytest]\n',
    'sut_h.py': 'def score(n):\n    return n * 2\n',
    'test_h.py': 'from sut_h import score\n\n\ndef test_score_is_not_none():\n    assert score(2) is not None\n',
  });
  try {
    execSync('git init -q', { cwd: d }); commit(d, 'first');
    writeFileSync(join(d, 'sut_h.py'), 'def score(n):\n    return n * 3\n');
    const r = prove(d, { since: 'HEAD' });
    const row = (r.changes || []).find((c) => c.fn === 'score');
    assert.ok(row, JSON.stringify(r.changes));
    assert.equal(row.status, 'unverifiable');
    assert.equal(row.evidence.reason, 'no-pin');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('parseBlocks: a concise-body arrow test and an options-object test() are discovered with their bodies', () => {
  const code = `${head}\nimport { f } from '../src/f.mjs';\ntest('concise', () => assert.strictEqual(f(1), 2));\ntest('with options', { timeout: 500 }, () => { assert.strictEqual(f(2), 4); });\ntest('classic', () => { assert.strictEqual(f(3), 6); });\n`;
  const blocks = parseBlocks(code, 'js');
  assert.deepEqual(blocks.map((b) => b.name), ['concise', 'with options', 'classic']);
  assert.match(blocks[0].body, /assert\.strictEqual\(f\(1\), 2\)/);
  assert.match(blocks[1].body, /assert\.strictEqual\(f\(2\), 4\)/);
  assert.deepEqual(blocks.map((b) => b.line), [3, 4, 5]);
});

test('prove(): functions tested only by a concise-body arrow or an options-object test are PROVEN, not silent', () => {
  const d = project({
    'package.json': '{"type":"module"}',
    'src/f.mjs': 'export function double(n) { return n * 2 }\nexport function triple(n) { return n * 3 }\n',
    'test/f.test.mjs': `${head} import { double, triple } from '../src/f.mjs';\ntest('doubles', () => assert.strictEqual(double(2), 4));\ntest('triples', { timeout: 5000 }, () => { assert.strictEqual(triple(2), 6); });\n`,
  });
  try {
    const r = prove(d, { runner: 'node' });
    assert.equal(r.caught, 2, JSON.stringify({ skipped: r.skipped, inconclusive: r.inconclusive }));
    assert.deepEqual(r.proven.map((p) => p.fns).flat().sort(), ['double', 'triple']);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('a static method and a getter are enumerated by the diff report and guttable by the probe', () => {
  const src = 'export class Calc {\n  static add(a, b) { return a + b }\n  get value() { return 1 }\n  plain(x) { return x }\n}\n';
  const names = changedDecls(src, 'js', null).map((d) => d.fn);
  assert.ok(names.includes('add'), `static: ${names}`);
  assert.ok(names.includes('value'), `getter: ${names}`);
  assert.ok(names.includes('plain'));
  assert.match(grossBreak(src, 'add', 'typescript') || '', /static add\(a, b\) \{\s*return 987654321;?\s*\}/);
  assert.match(grossBreak(src, 'value', 'typescript') || '', /get value\(\) \{\s*return 987654321;?\s*\}/);
});

test('a file whose whole basename is test/spec is a test file — probe discovery and lint discovery agree', () => {
  for (const f of ['src/addDays/test.ts', 'src/addDays/test.js', 'lib/spec.mjs', 'test.ts']) assert.ok(isTestPath(f), f);
  for (const f of ['src/contest.ts', 'src/test.d.ts', 'src/testing.ts', 'src/attest.js', 'src/test.txt']) assert.ok(!isTestPath(f), f);
  assert.deepEqual(findTestFiles(['src/addDays/test.ts', 'src/addDays/index.ts', 'src/contest.ts'], '.ts'), ['src/addDays/test.ts']);
});
