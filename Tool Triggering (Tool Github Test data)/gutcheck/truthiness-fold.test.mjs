import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prove } from '../mutation/prove.mjs';

// The bool fold. A bool pin's sentinel pair (false, true) is the WHOLE return domain: one of the two
// is the value the test expects, the other is the only wrong value there is. So red under exactly one
// sentinel is complete binding — the green sentinel IS the right answer, not an undetected direction
// of error — and can never be "one-sided" the way a numeric ±987654321 pair can (there, the green
// sentinel is a real wrong value the test missed). Green under both stays hollow (design spec
// 2026-08-20 §7 named this promotion as the follow-up if one-sided bool rows read confusingly; the
// coverage nudge read every `assertFalse`/`toBeFalsy` test as "unverifiable" — it did).
// Oracle: the sentinels grossBreak writes and what the planted assertion does under each, derived by
// hand from the fixture, never from the fold's own output.

const head = "import { test } from 'node:test'; import assert from 'node:assert';";
function project(files) {
  const d = mkdtempSync(join(tmpdir(), 'gc-boolfold-'));
  for (const [r, b] of Object.entries(files)) { const f = join(d, r); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, b); }
  return d;
}

// `assert.ok(!isOdd(4))`: isOdd(4) is false. Gut to `false` → same observable → green. Gut to `true` →
// red. The test distinguishes the only wrong boolean from the right one: bound.
const NEGATED = {
  'package.json': '{"type":"module"}',
  'src/o.mjs': 'export function isOdd(n) { return n % 2 === 1; }\n',
  'test/t.test.mjs': `${head} import { isOdd } from '../src/o.mjs';\ntest('four is not odd', () => { assert.ok(!isOdd(4)); });\n`,
};

test('bool fold: a falsy-direction pin red under `return true` is PROVEN on a plain run, not one-sided', () => {
  const d = project(NEGATED);
  try {
    const r = prove(d, { runner: 'node' });
    assert.equal(r.caught, 1);
    assert.deepEqual(r.oneSided, []);
    assert.deepEqual(r.hollow, []);
    assert.deepEqual(r.proven.map((p) => p.fns), [['isOdd']]);
    assert.ok(!(r.grossSurvivors || []).some((g) => g.fn === 'isOdd'), 'a promoted survivor is not an unrescued survivor');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

// `assert.ok(isEven(4))`: gut to `false` → red; gut to `true` → green because true is the expected
// value. --deep must not demote that to one-sided: there is no wrong value the test missed.
const TRUTHY = {
  'package.json': '{"type":"module"}',
  'src/e.mjs': 'export function isEven(n) { return n % 2 === 0; }\n',
  'test/t.test.mjs': `${head} import { isEven } from '../src/e.mjs';\ntest('four is even', () => { assert.ok(isEven(4)); });\n`,
};

test('bool fold: --deep keeps a truthy-direction pin PROVEN — the green sentinel is the expected value, not a missed direction', () => {
  const d = project(TRUTHY);
  try {
    const r = prove(d, { runner: 'node', deep: true });
    assert.equal(r.caught, 1);
    assert.deepEqual(r.oneSided, []);
    assert.deepEqual(r.proven.map((p) => p.fns), [['isEven']]);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

// One fn credited by a relational pin AND a bool pin in the same block. Bool evidence can convict
// (`false > 0` is red); relational-only evidence folds asymmetrically (+HUGE passes both asserts, -HUGE
// reds one → one-sided). Precedence must be value > bool > relational: adding an assertion never
// downgrades a verdict.
const MIXED = {
  'package.json': '{"type":"module"}',
  'src/s.mjs': 'export function score(n) { return n * 10; }\n',
  'test/t.test.mjs': `${head} import { score } from '../src/s.mjs';\ntest('score is positive', () => { assert.ok(score(1) > 0); assert.ok(score(1)); });\n`,
};

test('bool fold: a bool pin outranks a relational pin on the same fn — the block is PROVEN, not one-sided', () => {
  const d = project(MIXED);
  try {
    const r = prove(d, { runner: 'node' });
    assert.equal(r.caught, 1, 'bool gut (`return false`) reds `assert.ok(false > 0)`');
    assert.deepEqual(r.oneSided, []);
    assert.deepEqual(r.proven.map((p) => p.fns), [['score']]);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

// Green under BOTH bool sentinels is still hollow — the promotion never touches the accusation tier.
const SWALLOWED = {
  'package.json': '{"type":"module"}',
  'src/v.mjs': 'export function isValid(n) { return n > 0; }\n',
  'test/t.test.mjs': `${head} import { isValid } from '../src/v.mjs';\ntest('swallowed truthiness', () => { try { assert.ok(isValid(5)); } catch {} });\n`,
};

test('bool fold: green under both sentinels stays HOLLOW', () => {
  const d = project(SWALLOWED);
  try {
    const r = prove(d, { runner: 'node' });
    assert.equal(r.hollow.length, 1);
    assert.equal(r.caught, 0);
  } finally { rmSync(d, { recursive: true, force: true }); }
});
