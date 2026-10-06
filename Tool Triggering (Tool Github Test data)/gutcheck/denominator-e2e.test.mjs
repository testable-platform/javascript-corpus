import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { prove, resolveRunnerBin } from '../mutation/prove.mjs';

const head = "import { test } from 'node:test'; import assert from 'node:assert';";
function project(files) {
  const d = mkdtempSync(join(tmpdir(), 'gc-exec-'));
  for (const [r, b] of Object.entries(files)) { const f = join(d, r); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, b); }
  return d;
}
const HAS_VITEST = resolveRunnerBin('vitest', resolve('.')) !== null;

// The field-report shape the static reading cannot see: a method on an object the test built.
// Oracle: `parse` is executed and pinned via the receiver; gutting it goes red → proven (via execution).
// `make` — gutting it breaks the receiver → red → proven. `helper` is executed (inside make) but nothing
// checks it → unnoticed. `ghost` is never imported → untested.
test('PROVE (node): receiver-method pin proves via execution; executed-unchecked reads unnoticed; unimported reads untested', () => {
  const d = project({
    'package.json': '{"type":"module"}',
    'src/s.mjs': 'export function helper(x) { return x; }\nexport function make() { helper(1); return { parse(v) { return v.trim(); } }; }\nexport function ghost() { return 0; }\n',
    'test/s.test.mjs': `${head} import { make } from '../src/s.mjs';\ntest('parses', () => { const s = make(); assert.equal(s.parse(' a '), 'a'); });\n`,
  });
  try {
    const r = prove(d, { runner: 'node' });
    assert.equal(r.changeSummary.denominator, 'execution');
    const by = Object.fromEntries(r.changes.map((c) => [c.fn, c]));
    assert.equal(by.parse.status, 'proven'); assert.equal(by.parse.evidence.via, 'execution');
    assert.equal(by.make.status, 'proven', 'gutting make breaks the receiver → red');
    assert.equal(by.helper.status, 'unnoticed');
    assert.equal(by.ghost.status, 'untested');
    assert.equal(r.changeSummary.unnoticed, 1);
    assert.equal(r.execution.denominator, 'execution');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('PROVE (node, --since): only test files whose imports reach the changed source are baselined; unchanged fns are not targets', () => {
  const d = project({
    'package.json': '{"type":"module"}',
    'src/a.mjs': 'export function add(a, b) { return a + b; }\n',
    'src/b.mjs': 'export function big(x) { return x * 1000; }\n',
    'test/a.test.mjs': `${head} import { add } from '../src/a.mjs';\ntest('a', () => { assert.equal(add(1, 1), 2); });\n`,
    // b.test checks only the return's TYPE — no value pin, so `big` is not settled by the block probe and the
    // phase must attribute it: sentinel (a number) green, no-op (undefined) red → proven via execution.
    'test/b.test.mjs': `${head} import { big } from '../src/b.mjs';\ntest('b', () => { assert.ok(typeof big(1) === 'number'); });\n`,
  });
  try {
    execSync('git init -q && git add -A && git -c user.email=a@b.c -c user.name=t commit -qm init', { cwd: d });
    writeFileSync(join(d, 'src/b.mjs'), 'export function big(x) { return x * 1000; } // touched\n');
    const r = prove(d, { runner: 'node', since: 'HEAD' });
    assert.equal(r.changeSummary.denominator, 'execution');
    assert.deepEqual(r.changes.map((c) => c.fn), ['big']);
    assert.equal(r.changes[0].status, 'proven'); assert.equal(r.changes[0].evidence.via, 'execution'); assert.equal(r.changes[0].evidence.mutant, 'undefined');
    assert.deepEqual(r.execution.testFilesRun, ['test/b.test.mjs'], 'a.test.mjs never imports b.mjs, so it is not baselined');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('PROVE (--files) carries no denominator; a root with no tests keeps the static one', () => {
  const d = project({ 'package.json': '{"type":"module"}', 'src/a.mjs': 'export function add(a, b) { return a + b; }\n', 'test/a.test.mjs': `${head} import { add } from '../src/a.mjs';\ntest('a', () => { assert.equal(add(1, 1), 2); });\n` });
  try {
    const rf = prove(d, { runner: 'node', files: ['a.test.mjs'] });
    assert.equal(rf.changeSummary, null);
    assert.equal(rf.execution.denominator, 'static');
  } finally { rmSync(d, { recursive: true, force: true }); }
  const e = project({ 'package.json': '{"type":"module"}', 'src/a.mjs': 'export function add(a, b) { return a + b; }\n' });
  try {
    const re = prove(e, { runner: 'node' });
    // No test file exists to baseline, so nothing executes anything: the one function is untested either
    // way; the reading that produced it is stated as static (no execution map was ever built).
    assert.equal(re.changeSummary.untested, 1);
    assert.equal(re.changeSummary.denominator, 'static');
  } finally { rmSync(e, { recursive: true, force: true }); }
});

// win32: vitest under NODE_V8_COVERAGE observed nothing on the Windows CI leg (coverage did not flush); the
// empty-map guard then falls back to the static reading there, so this execution-specific oracle is POSIX-only.
test('PROVE vitest e2e: the same receiver shape proves via execution under vitest', { skip: !HAS_VITEST || process.platform === 'win32' }, () => {
  const d = project({
    'package.json': '{"type":"module","devDependencies":{"vitest":"*"}}',
    'src/s.mjs': 'export function make() { return { parse(v) { return v.trim(); } }; }\n',
    'test/s.test.mjs': "import { it, expect } from 'vitest';\nimport { make } from '../src/s.mjs';\nit('parses', () => { expect(make().parse(' a ')).toBe('a'); });\n",
  });
  symlinkSync(resolve('node_modules'), join(d, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  try {
    const r = prove(d, { runner: 'vitest' });
    const by = Object.fromEntries(r.changes.map((c) => [c.fn, c.status]));
    assert.equal(by.parse, 'proven'); assert.equal(by.make, 'proven');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

// Hook-path cost (the Stop hook runs with --time-budget=90): when the changed module is imported by MANY
// test files, baselining them all would eat the budget before any detection ran. Oracle by construction:
// three test files import core.mjs; only a.test mentions and executes the changed `a`. Mention-first
// ordering baselines a.test first, and a diff-scoped map stops as soon as every target has an executor —
// exactly one file is run; `a` is proven by execution.
test('PROVE (--since): test files that mention the changed function are baselined first, and the map stops once every target has an executor', () => {
  const d = project({
    'package.json': '{"type":"module"}',
    'src/core.mjs': 'export function a(x) { return x + 1; }\nexport function b(x) { return x * 2; }\n',
    'test/b1.test.mjs': `${head} import { b } from '../src/core.mjs';\ntest('b1', () => { assert.equal(b(2), 4); });\n`,
    'test/b2.test.mjs': `${head} import { b } from '../src/core.mjs';\ntest('b2', () => { assert.equal(b(3), 6); });\n`,
    'test/z.test.mjs': `${head} import { a } from '../src/core.mjs';\ntest('z', () => { assert.ok(typeof a(1) === 'number'); });\n`,
  });
  try {
    execSync('git init -q && git add -A && git -c user.email=a@b.c -c user.name=t commit -qm init', { cwd: d });
    writeFileSync(join(d, 'src/core.mjs'), 'export function a(x) { return x + 1; } // touched\nexport function b(x) { return x * 2; }\n');
    const r = prove(d, { runner: 'node', since: 'HEAD' });
    assert.deepEqual(r.changes.map((c) => c.fn), ['a']);
    assert.equal(r.changes[0].status, 'proven'); assert.equal(r.changes[0].evidence.via, 'execution');
    assert.deepEqual(r.execution.testFilesRun, ['test/z.test.mjs'], 'z.test mentions `a` → first; it executes a → the map stops there');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

// Empty-map guard: green baselines that executed NO source function mean coverage did not flush (the Windows
// vitest leg). Oracle: this fixture's test asserts a constant and executes nothing from src, so the map is
// legitimately empty — the guard must fall back to the static reading rather than claim execution and call
// `add` untested by execution. Static: `add` is named by no test → untested, denominator 'static'.
test('PROVE: a map that observed nothing across green baselines falls back to the static reading', () => {
  const d = project({
    'package.json': '{"type":"module"}',
    'src/a.mjs': 'export function add(a, b) { return a + b; }\n',
    'test/const.test.mjs': `${head}\ntest('constant', () => { assert.equal(1 + 1, 2); });\n`,
  });
  try {
    const r = prove(d, { runner: 'node' });
    assert.equal(r.changeSummary.denominator, 'static');
    assert.equal(r.execution.denominator, 'static');
    assert.equal(r.changes.find((c) => c.fn === 'add').status, 'untested');
  } finally { rmSync(d, { recursive: true, force: true }); }
});
