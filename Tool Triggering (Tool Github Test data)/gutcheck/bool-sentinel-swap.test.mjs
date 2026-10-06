import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prove } from '../mutation/prove.mjs';

// A predicate whose body IS the primary bool sentinel (`export const isBeta = () => false` — a feature
// flag, the most common constant predicate) yields a mutant identical to the source, so the block read
// `ungutable`. The other sentinel (`true`) is a real mutant: use it as the primary. Oracle: what the
// planted assertion does under `return true`, by hand.

const head = "import { test } from 'node:test'; import assert from 'node:assert';";
function project(files) {
  const d = mkdtempSync(join(tmpdir(), 'gc-swap-'));
  for (const [r, b] of Object.entries(files)) { const f = join(d, r); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, b); }
  return d;
}

test('a `() => false` predicate is probed with the `true` sentinel: a sound negative test is PROVEN', () => {
  const d = project({
    'package.json': '{"type":"module"}',
    'src/b.mjs': 'export const isBeta = () => false;\n',
    'test/t.test.mjs': `${head} import { isBeta } from '../src/b.mjs';\ntest('beta off', () => { assert.ok(!isBeta()); });\n`,
  });
  try {
    const r = prove(d, { runner: 'node' });
    assert.equal(r.caught, 1, JSON.stringify({ skipped: r.skipped, inconclusive: r.inconclusive }));
    assert.deepEqual(r.skipped, []);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('a `() => false` predicate under a swallowed assert is HOLLOW — the swap never manufactures a proof', () => {
  const d = project({
    'package.json': '{"type":"module"}',
    'src/b.mjs': 'export const isBeta = () => false;\n',
    'test/t.test.mjs': `${head} import { isBeta } from '../src/b.mjs';\ntest('beta off', () => { try { assert.ok(!isBeta()); } catch {} });\n`,
  });
  try {
    const r = prove(d, { runner: 'node' });
    assert.equal(r.hollow.length, 1, JSON.stringify({ skipped: r.skipped, inconclusive: r.inconclusive }));
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('a `() => true` predicate keeps the `false` primary and is PROVEN by a truthy assert (regression pin)', () => {
  const d = project({
    'package.json': '{"type":"module"}',
    'src/o.mjs': 'export const isOn = () => true;\n',
    'test/t.test.mjs': `${head} import { isOn } from '../src/o.mjs';\ntest('on', () => { assert.ok(isOn()); });\n`,
  });
  try {
    const r = prove(d, { runner: 'node' });
    assert.equal(r.caught, 1);
  } finally { rmSync(d, { recursive: true, force: true }); }
});
