import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { prove } from '../mutation/prove.mjs';

// Execution location (Move 1), end to end: a pinned name the static resolver cannot place — a barrel
// chain deeper than one hop, a computed dynamic import — is placed at the one src file that executed
// it under the block's own baseline run. Eligibility is unchanged (only pinned names); every
// ambiguity refuses with today's label; diff scope never spends a baseline on an unchanged test file.
// Oracles are hand-derived from the fixtures (which file declares the function is fixed by the
// layout), never read back from the resolver.

const GUT = resolve('mutation/gutcheck.mjs');
const head = "import { test } from 'node:test'; import assert from 'node:assert';";
function project(files) {
  const d = mkdtempSync(join(tmpdir(), 'gc-exec-'));
  for (const [r, b] of Object.entries(files)) { const f = join(d, r); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, b); }
  return d;
}
// A two-hop barrel: index → math/index → add. The static hop follows one level and refuses.
const TWO_HOP = {
  'package.json': '{"type":"module"}',
  'src/math/add.mjs': 'export function add(a, b) { return a + b; }\n',
  'src/math/index.mjs': "export { add } from './add.mjs';\n",
  'src/index.mjs': "export * from './math/index.mjs';\n",
  'test/t.test.mjs': `${head} import { add } from '../src/index.mjs';\ntest('adds', () => { assert.strictEqual(add(2, 3), 5); });\n`,
};

test('a pinned name behind a two-hop barrel is located by execution and PROVEN, with via: execution on the pair', () => {
  const d = project(TWO_HOP);
  try {
    const r = prove(d, { runner: 'node' });
    assert.equal(r.caught, 1, JSON.stringify({ skipped: r.skipped, inconclusive: r.inconclusive }));
    assert.deepEqual(r.proven[0].pairs, [{ fn: 'add', sutRel: 'src/math/add.mjs', via: 'execution' }]);
    const x = spawnSync(process.execPath, [GUT, '--explain', 'test/t.test.mjs:2', d, '--runner=node'], { encoding: 'utf8' });
    assert.match(x.stdout, /PROVEN/);
    assert.match(x.stdout, /located by execution/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('a computed dynamic import (no static binding at all) is located by execution', () => {
  const d = project({
    'package.json': '{"type":"module"}',
    'src/shapes/area.mjs': 'export function area(r) { return r * r * 3; }\n',
    'test/t.test.mjs': `${head}\ntest('area', async () => { const name = 'area'; const m = await import('../src/shapes/' + name + '.mjs'); assert.strictEqual(m.area(2), 12); });\n`,
  });
  try {
    const r = prove(d, { runner: 'node' });
    // `m.area(2)` is a member call — not a bare pinned name — so this block stays out of reach by
    // eligibility, not by location: execution changes WHERE, never WHICH. Pin that boundary.
    assert.equal(r.caught, 0);
    assert.equal(r.skipped.length, 1);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('refusals: the name executed in two src files stays sut-unresolved; a default of another name stays unresolved', () => {
  // Two hops (index → mid/index → mid/format) so the static hop refuses; mid/format's `format` calls
  // b/format's `format`, so BOTH execute under the baseline — two src files, ambiguous, refuse.
  const two = project({
    'package.json': '{"type":"module"}',
    'src/b/format.mjs': 'export function format(n) { return `b${n}`; }\n',
    'src/mid/format.mjs': "import { format as inner } from '../b/format.mjs';\nexport function format(n) { return inner(n) + 'x'; }\n",
    'src/mid/index.mjs': "export { format } from './format.mjs';\n",
    'src/index.mjs': "export * from './mid/index.mjs';\n",
    'test/t.test.mjs': `${head} import { format } from '../src/index.mjs';\ntest('formats', () => { assert.strictEqual(format(1), 'b1x'); });\n`,
  });
  try {
    const r = prove(two, { runner: 'node' });
    assert.equal(r.caught, 0, 'two src files executed a `format` — ambiguous, refuse');
    assert.deepEqual(r.skipped.map((s) => s.why), ['sut-unresolved']);
  } finally { rmSync(two, { recursive: true, force: true }); }
  const renamed = project({
    'package.json': '{"type":"module"}',
    'src/sum.mjs': 'export default function sum(a, b) { return a + b; }\n',
    'src/index.mjs': "export { default as add } from './sum.mjs';\n",
    'test/t.test.mjs': `${head} import { add } from '../src/index.mjs';\ntest('adds', () => { assert.strictEqual(add(2, 3), 5); });\n`,
  });
  try {
    const r = prove(renamed, { runner: 'node' });
    assert.equal(r.caught, 0, 'the executed function is named sum, not add — no declaration of add exists to gut');
    assert.deepEqual(r.skipped.map((s) => s.why), ['sut-unresolved']);
  } finally { rmSync(renamed, { recursive: true, force: true }); }
});

test('diff scope: an unchanged test file with an unresolved pin is out of scope — no baseline is spent observing it', () => {
  const d = project(TWO_HOP);
  try {
    execSync('git init -q && git add -A && git -c user.email=a@b.c -c user.name=t commit -qm init', { cwd: d });
    writeFileSync(join(d, 'src/math/add.mjs'), 'export function add(a, b) { return a + b; } // touched\n');
    const r = prove(d, { runner: 'node', since: 'HEAD' });
    assert.equal(r.probes, 0);
    assert.equal(r.outOfScope, 1);
    const row = r.changes.find((c) => c.fn === 'add');
    // Execution denominator: the unchanged test file imports (two hops) and executes add, so its whole-file
    // baseline is spent once for the map and gutting add goes red there — proven via execution, even though
    // the per-BLOCK observation above never ran (probes 0, outOfScope 1 still hold).
    assert.equal(row.status, 'proven', JSON.stringify(row));
    assert.equal(row.evidence.via, 'execution');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

// Namespace-member pins (`import * as _` then `_.zip(...)`, radash's idiom): the receiver IS the module,
// so a member the static hop cannot place (a barrel chain deeper than one hop) is placed by execution
// with the same argument as a bare name — the one src file that executed `zip` is the module's `zip`.
test('a namespace-member pin behind a two-hop default-as barrel is located by execution and PROVEN', () => {
  const d = project({
    'package.json': '{"type":"module"}',
    'src/array/zip.mjs': 'export default function zip(a, b) { return a.map((x, i) => [x, b[i]]); }\n',
    'src/array/index.mjs': "export { default as zip } from './zip.mjs';\n",
    'src/index.mjs': "export * from './array/index.mjs';\n",
    'test/t.test.mjs': `${head} import * as _ from '../src/index.mjs';\ntest('zips', () => { assert.deepStrictEqual(_.zip([1], [2]), [[1, 2]]); });\n`,
  });
  try {
    const r = prove(d, { runner: 'node' });
    assert.equal(r.caught, 1, JSON.stringify({ skipped: r.skipped, inconclusive: r.inconclusive }));
    assert.deepEqual(r.proven[0].pairs, [{ fn: 'zip', sutRel: 'src/array/zip.mjs', via: 'execution' }]);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('a namespace-member pin on a mock-tainted test file is never observed (the receiver guard stands)', () => {
  const d = project({
    'package.json': '{"type":"module"}',
    'src/array/zip.mjs': 'export default function zip(a, b) { return a.map((x, i) => [x, b[i]]); }\n',
    'src/array/index.mjs': "export { default as zip } from './zip.mjs';\n",
    'src/index.mjs': "export * from './array/index.mjs';\n",
    'test/t.test.mjs': `${head} import { mock } from 'node:test'; import * as _ from '../src/index.mjs';\ntest('zips', () => { mock.method(_, 'zip', () => [[1, 2]]); assert.deepStrictEqual(_.zip([1], [2]), [[1, 2]]); });\n`,
  });
  try {
    const r = prove(d, { runner: 'node' });
    assert.equal(r.caught, 0);
    assert.equal(r.probes, 0, 'mock taint refuses before any baseline is spent');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

// The zod shape (campaign 2026-09-02, `create enum`): the test pins `z.enum([...])` through a namespace
// import the static hop cannot follow, then reads `.enum.Red` — a GETTER named `enum` that several classes
// in the same file declare. Coverage says "types.mjs executed `enum`" (the getter, not the aliased factory
// `createEnum`); a name-only gut then targeted the FIRST same-named getter — another class's — and the
// test survived: a false HOLLOW. Execution location applies the credit-time discipline: a name with
// more than one declaration site in the located file is refused (jsDeclSiteCount), never first-match gutted.
test('refusal: an executed name declared on several classes in the located file is never gutted (no false hollow)', () => {
  const d = project({
    'package.json': '{"type":"module"}',
    'src/types.mjs': "class A { get enum() { return { Red: 'A' }; } }\nclass Z { constructor(v) { this.v = v; } get Values() { return Object.fromEntries(this.v.map((x) => [x, x])); } get enum() { return this.Values; } }\nfunction createEnum(vals) { return new Z(vals); }\nexport { createEnum as enum, A };\n",
    'src/mid/index.mjs': "export * from '../types.mjs';\n",
    'src/index.mjs': "export * from './mid/index.mjs';\n",
    'test/t.test.mjs': `${head} import * as z from '../src/index.mjs';\ntest('create enum', () => { const E = z.enum(['Red', 'Green']); assert.strictEqual(E.Values.Red, 'Red'); assert.strictEqual(E.enum.Red, 'Red'); });\n`,
  });
  try {
    const r = prove(d, { runner: 'node' });
    assert.deepEqual(r.hollow, [], 'two `enum` getters in the located file — refuse, never gut the first one');
    assert.equal(r.caught, 0);
    assert.deepEqual(r.skipped.map((s) => s.why), ['pin-unresolved'], 'the namespace member keeps its pre-observation label');
  } finally { rmSync(d, { recursive: true, force: true }); }
});
