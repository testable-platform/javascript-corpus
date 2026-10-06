import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { planShards, mergeResults } from '../mutation/shards.mjs';

// Parallel probes (Move 2, phase 1): the parent holds the repo lock, shards the in-scope test files
// across child `gutcheck --json --shard` processes (each with its own work copy — today's engine,
// untouched), merges their results, and classifies changes once over the union of block records. The
// merged result must equal the single-process result row for row; a shard that dies contributes
// inconclusive rows for its files with the reason — never a silent partial presented as complete.
// Oracles: hand-computed shard plans; a fixture whose per-file verdicts are known by construction.

const GUT = resolve('mutation/gutcheck.mjs');
const head = "import { test } from 'node:test'; import assert from 'node:assert';";
function project(files) {
  const d = mkdtempSync(join(tmpdir(), 'gc-shards-'));
  for (const [r, b] of Object.entries(files)) { const f = join(d, r); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, b); }
  return d;
}

test('planShards: greedy by size — the biggest file first, each next file to the lightest shard; never more shards than files', () => {
  const files = [{ file: 'a', size: 50 }, { file: 'b', size: 40 }, { file: 'c', size: 30 }, { file: 'd', size: 20 }, { file: 'e', size: 10 }];
  const plan = planShards(files, 2).map((s) => s.map((f) => f.file));
  assert.deepEqual(plan, [['a', 'd', 'e'], ['b', 'c']]);
  assert.deepEqual(planShards(files.slice(0, 2), 4).length, 2, 'two files → two shards, not four');
  assert.deepEqual(planShards([], 3), []);
});

test('mergeResults: scalars sum, rows concatenate, pct is recomputed, empty optional arrays are omitted, a dead shard yields inconclusive rows per file', () => {
  const a = { runner: 'node', scored: 2, caught: 1, hollow: [{ file: 't/a.test.mjs', line: 3, name: 'h', survivors: ['f'], survivorPairs: [{ fn: 'f', sutRel: 'src/a.mjs' }] }], weak: [], oneSided: [], oneSidedBlocks: 0, proven: [{ file: 't/a.test.mjs', line: 2, name: 'p', fns: ['g'], pairs: [{ fn: 'g', sutRel: 'src/a.mjs' }] }], inconclusive: [], skipped: [{ file: 't/a.test.mjs', line: 4, name: 's', why: 'no-pin' }], outOfScope: 1, probes: 3, capped: 0, envAborted: 0, pct: 50, blockRecords: [{ file: 't/a.test.mjs', line: 2, name: 'p', verdict: 'caught', caughtFns: ['g'], caughtPairs: [{ fn: 'g', sutRel: 'src/a.mjs' }] }] };
  const b = { runner: 'node', scored: 1, caught: 1, hollow: [], weak: [], oneSided: [], oneSidedBlocks: 0, inconclusive: [], skipped: [], outOfScope: 0, probes: 1, capped: 1, envAborted: 0, pct: 100, blockRecords: [{ file: 't/b.test.mjs', line: 2, name: 'q', verdict: 'caught', caughtFns: ['k'], caughtPairs: [{ fn: 'k', sutRel: 'src/b.mjs' }] }] };
  const m = mergeResults([{ files: ['t/a.test.mjs'], result: a }, { files: ['t/b.test.mjs'], result: b }, { files: ['t/c.test.mjs', 't/d.test.mjs'], result: null, error: 'exit 137' }]);
  assert.equal(m.runner, 'node');
  assert.deepEqual([m.scored, m.caught, m.probes, m.capped, m.outOfScope, m.pct], [3, 2, 4, 1, 1, 67]);
  assert.equal(m.hollow.length, 1);
  assert.equal(m.proven.length, 1, 'b had no proven[] (omitted) — merged from a alone');
  assert.equal(m.skipped.length, 1);
  assert.deepEqual(m.inconclusive.map((i) => [i.file, i.why]), [['t/c.test.mjs', 'did-not-run shard failed: exit 137'], ['t/d.test.mjs', 'did-not-run shard failed: exit 137']]);
  assert.equal(m.blockRecords.length, 2);
  assert.ok(!('grossSurvivors' in m), 'no shard had survivors → key omitted, as prove() omits it');
  assert.ok(!('weakSummary' in m));
});

// Four test files over three src files; file c holds a hollow test. Both job counts must agree row for row.
const FIX = {
  'package.json': '{"type":"module"}',
  'src/a.mjs': 'export function add(a, b) { return a + b; }\n',
  'src/b.mjs': 'export function mul(a, b) { return a * b; }\nexport function ghost(x) { return x; }\n',
  'src/c.mjs': 'export function total(xs) { return xs.reduce((s, x) => s + x, 0); }\n',
  'test/a.test.mjs': `${head} import { add } from '../src/a.mjs';\ntest('adds', () => { assert.strictEqual(add(2, 3), 5); });\n`,
  'test/b.test.mjs': `${head} import { mul } from '../src/b.mjs';\ntest('muls', () => { assert.strictEqual(mul(2, 3), 6); });\n`,
  'test/c.test.mjs': `${head} import { total } from '../src/c.mjs';\ntest('shadow', () => { const e = total([1, 2]); assert.strictEqual(total([1, 2]), e); });\n`,
  'test/d.test.mjs': `${head} import { add } from '../src/a.mjs';\ntest('adds again', () => { assert.strictEqual(add(1, 1), 2); });\n`,
};
const norm = (r) => ({
  scored: r.scored, caught: r.caught, probes: r.probes,
  hollow: r.hollow.map((h) => `${h.file}:${h.line}`).sort(),
  proven: (r.proven || []).map((p) => `${p.file}:${p.line}`).sort(),
  skipped: r.skipped.map((s) => `${s.file}:${s.line}:${s.why}`).sort(),
  changes: (r.changes || []).map((c) => `${c.file}:${c.fn}:${c.status}`).sort(),
  summary: r.changeSummary,
});

test('CLI --jobs=2 and --jobs=1 produce the same rows, counts, denominator and exit code', () => {
  const d = project(FIX);
  try {
    const run = (jobs) => spawnSync(process.execPath, [GUT, d, '--runner=node', '--no-self-check', '--json', `--jobs=${jobs}`], { encoding: 'utf8' });
    const one = run(1), two = run(2);
    assert.equal(one.status, 1, 'hollow → exit 1'); assert.equal(two.status, 1);
    const r1 = JSON.parse(one.stdout), r2 = JSON.parse(two.stdout);
    assert.deepEqual(norm(r2), norm(r1));
    assert.equal(r2.changeSummary.scope, 'repo');
    assert.equal(r2.hollow.length, 1);
    assert.ok(!('blockRecords' in r2), 'the merged public result carries no internal block records');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('CLI --shard emits blockRecords for the parent and skips the repo lock; the plain CLI never emits them', () => {
  const d = project(FIX);
  try {
    const plain = JSON.parse(spawnSync(process.execPath, [GUT, d, '--runner=node', '--no-self-check', '--json', '--jobs=1'], { encoding: 'utf8' }).stdout);
    assert.ok(!('blockRecords' in plain));
    const shard = JSON.parse(spawnSync(process.execPath, [GUT, d, '--runner=node', '--no-self-check', '--json', '--shard', '--exact-files=test/a.test.mjs,test/c.test.mjs'], { encoding: 'utf8' }).stdout);
    assert.ok(Array.isArray(shard.blockRecords) && shard.blockRecords.length === 2, JSON.stringify(shard.blockRecords));
    assert.deepEqual(shard.blockRecords.map((b) => b.file).sort(), ['test/a.test.mjs', 'test/c.test.mjs']);
    assert.equal(shard.changeSummary, null, 'a shard classifies nothing — the parent does, once');
  } finally { rmSync(d, { recursive: true, force: true }); }
});
