import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prove, pinnedFragmentsByKind, pyBlocks } from '../mutation/prove.mjs';
import { grossBreak, grossBreakOpposite } from '../mutation/probe.mjs';

// Truthiness reach that is sound under the direct-operand rule and idiomatic enough to matter:
//   - a MESSAGE argument beside the operand (`assert(f(), 'msg')`, JUnit5 `assertTrue(f(), "msg")`,
//     JUnit4 `assertTrue("msg", f())`, chai `expect(f(), 'msg').to.be.true`) — the message cannot alter
//     the truthiness contract, so the operand is still the whole thing the assertion judges;
//   - an `await` on the operand (`assert.ok(await f())`, Python `assert await f(x)`) — the gut keeps
//     `async`, the sentinel comes back through the await unchanged;
//   - a Kotlin expression-body predicate with an INFERRED return type (`fun isAdult(age: Int) = age >= 18`)
//     — as the direct operand of assertTrue/isTrue the function IS Boolean (anything else would not
//     compile), so the `false`/`true` sentinels are type-safe; the compile gate still backs it;
//   - Python `async def` bodies gut cleanly (the def-indent was measured from `def`, not from the line
//     start, so the appended `return` was mis-indented: an IndentationError, never a verdict).
// Oracles: the pin buckets a reader would fill by hand; the mutant text the sentinel table dictates.

const head = "import { test } from 'node:test'; import assert from 'node:assert';";
const HAS_PYTEST = (() => { try { execSync('python3 -m pytest --version', { stdio: 'ignore' }); return true; } catch { return false; } })();
function project(files) {
  const d = mkdtempSync(join(tmpdir(), 'gc-reach-'));
  for (const [r, b] of Object.entries(files)) { const f = join(d, r); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, b); }
  return d;
}

test('JS: a message argument beside a direct-operand truthiness assert still admits the bool pin', () => {
  const imports = new Map();
  assert.deepEqual(pinnedFragmentsByKind("assert(isValid(5), 'must be valid');", imports).bool, ['isValid(5)']);
  assert.deepEqual(pinnedFragmentsByKind("assert.ok(isValid(5), `msg ${x}`);", imports).bool, ['isValid(5)']);
  assert.deepEqual(pinnedFragmentsByKind("expect(isValid(5), 'msg').to.be.true;", imports).bool, ['isValid(5)']);
  // the buried forms stay out, message or not
  assert.deepEqual(pinnedFragmentsByKind("assert.ok(isValid(5) !== null, 'msg');", imports).bool, []);
  assert.deepEqual(pinnedFragmentsByKind("assert.ok(isValid(5) && other(), 'msg');", imports).bool, []);
});

test('JS: an awaited direct operand admits the bool pin; a member/optional-chain operand still does not', () => {
  const imports = new Map();
  assert.deepEqual(pinnedFragmentsByKind('assert.ok(await loadFlag());', imports).bool, ['loadFlag()']);
  assert.deepEqual(pinnedFragmentsByKind('expect(await loadFlag()).toBeTruthy();', imports).bool, ['loadFlag()']);
  assert.deepEqual(pinnedFragmentsByKind('assert.ok(!await loadFlag());', imports).bool, ['loadFlag()']);
  assert.deepEqual(pinnedFragmentsByKind('assert.ok(await svc.loadFlag());', imports).bool, []);
  assert.deepEqual(pinnedFragmentsByKind('assert.ok((await loadFlag())?.ok);', imports).bool, []);
});

test('JVM: JUnit5 (cond, msg) and JUnit4 (msg, cond) message overloads admit the bool pin; two non-literal args refuse', () => {
  const kt = (s) => pinnedFragmentsByKind(s, new Map(), 'kotlin').bool;
  const java = (s) => pinnedFragmentsByKind(s, new Map(), 'java').bool;
  assert.deepEqual(kt('assertTrue(isAdult(20), "must be adult")'), ['isAdult(20)']);
  assert.deepEqual(java('assertTrue("must be adult", isAdult(20));'), ['isAdult(20)']);
  assert.deepEqual(java('assertFalse("msg", isAdult(2));'), ['isAdult(2)']);
  assert.deepEqual(kt('assertTrue(isAdult(20), messageFor(20))'), [], 'two non-literal args: which is the condition is ambiguous — refuse');
  assert.deepEqual(kt('assertTrue(isAdult(20) && isMember(20), "msg")'), []);
  // a relational operand beside a message keeps its relational reach
  assert.deepEqual(pinnedFragmentsByKind('assertTrue(score(1) > 0, "positive")', new Map(), 'kotlin').relational, ['score(1)', '0']);
});

test('prove() JS e2e: message-arg and awaited truthiness tests are PROVEN', () => {
  const d = project({
    'package.json': '{"type":"module"}',
    'src/v.mjs': 'export function isValid(n) { return n > 0 }\nexport async function loadFlag() { return true }\n',
    'test/t.test.mjs': `${head} import { isValid, loadFlag } from '../src/v.mjs';\ntest('valid with message', () => { assert.ok(isValid(5), 'five is valid'); });\ntest('awaited flag', async () => { assert.ok(await loadFlag()); });\n`,
  });
  try {
    const r = prove(d, { runner: 'node' });
    assert.equal(r.caught, 2, JSON.stringify({ skipped: r.skipped, inconclusive: r.inconclusive, oneSided: r.oneSided }));
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('Kotlin: an inferred-type expression-body predicate gets the boolean sentinel pair under a bool pin', () => {
  const src = 'object Rules {\n    fun isAdult(age: Int) = age >= 18\n}\n';
  assert.equal(grossBreak(src, 'isAdult', 'kotlin', { bool: true }), 'object Rules {\n    fun isAdult(age: Int) = false\n}\n');
  assert.equal(grossBreakOpposite(src, 'isAdult', 'kotlin', { bool: true }), 'object Rules {\n    fun isAdult(age: Int) = true\n}\n');
  // a VALUE pin on the same inferred-type fn keeps the numeric sentinel (the compile gate decides)
  assert.match(grossBreak(src, 'isAdult', 'kotlin') || '', /= 987654321/);
  // a declared non-Boolean type under a bool pin stays numeric → compile-fail → ungutable, as before
  assert.match(grossBreak('fun count(): Int = 3\n', 'count', 'kotlin', { bool: true }) || '', /= 987654321/);
});

test('Python: an async def guts cleanly, value and bool', { skip: !HAS_PYTEST }, () => {
  const src = 'async def fetch(n):\n    return n > 0\n\n\ndef sync(n):\n    return n\n';
  const num = grossBreak(src, 'fetch', 'python');
  assert.match(num, /^async def fetch\(n\):\n    return 987654321\n/);
  assert.ok(num.endsWith('def sync(n):\n    return n\n') && !num.includes('n > 0'), num);
  assert.match(grossBreak(src, 'fetch', 'python', { bool: true }), /^async def fetch\(n\):\n    return False\n/);
  const indented = 'class Svc:\n    async def fetch(self, n):\n        return n > 0\n';
  assert.equal(grossBreak(indented, 'fetch', 'python'), 'class Svc:\n    async def fetch(self, n):\n        return 987654321\n');
});

test('Python: `assert await f(x)` admits the bool pin', { skip: !HAS_PYTEST }, () => {
  const d = project({
    'sut.py': 'async def fetch(n):\n    return n > 0\n',
    'test_a.py': 'import asyncio\nfrom sut import fetch\n\n\ndef test_fetch():\n    async def go():\n        assert await fetch(3)\n    asyncio.run(go())\n',
  });
  try {
    const r = pyBlocks(join(d, 'test_a.py'));
    assert.ok(r, 'parses');
    assert.deepEqual(r.blocks.map((b) => b.boolPins), [['fetch']]);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

// Campaign 2026-09-02 (superstruct): the project's OWN `assert(value, struct)` shadows node's. Its first
// argument is a string literal (masked blank) and its second a live call, so a "two args, one blank →
// the live one is the condition" rule read `assert('valid', string())` as a truthiness pin on `string`
// and minted a false HOLLOW. A node assert's condition is ALWAYS its first argument; the message is
// second. Only JUnit legitimately takes either order (`assertTrue("msg", cond)`).
test('JS: a blank FIRST argument is never the message — assert(literal, call()) admits nothing', () => {
  const imports = new Map();
  assert.deepEqual(pinnedFragmentsByKind("assert('valid', string());", imports).bool, []);
  assert.deepEqual(pinnedFragmentsByKind("assert.ok('valid', string());", imports).bool, []);
  assert.deepEqual(pinnedFragmentsByKind("expect('valid', string()).to.be.true;", imports).bool, []);
  assert.deepEqual(pinnedFragmentsByKind("assert(string(), 'valid');", imports).bool, ['string()'], 'condition first, message second: admitted');
});

test('prove(): superstruct-shaped `assert(value, struct)` with a struct factory is never a hollow', () => {
  const d = project({
    'package.json': '{"type":"module"}',
    'src/index.mjs': "export function string() { return { type: 'string', validate: (v) => typeof v === 'string' }; }\nexport function assert(value, struct) { if (!struct.validate(value)) throw new Error('invalid'); }\n",
    // The project's `assert` is imported UNALIASED (as superstruct's tests do), shadowing node's; the
    // runner's own assertion lives under another name.
    'test/t.test.mjs': `import { test } from 'node:test'; import nodeAssert from 'node:assert';\nimport { assert, string } from '../src/index.mjs';\ntest('valid as helper', () => { nodeAssert.doesNotThrow(() => assert('valid', string())); });\n`,
  });
  try {
    const r = prove(d, { runner: 'node' });
    assert.deepEqual(r.hollow, []);
    assert.equal(r.caught, 0);
  } finally { rmSync(d, { recursive: true, force: true }); }
});
