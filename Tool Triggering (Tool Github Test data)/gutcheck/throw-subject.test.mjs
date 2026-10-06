import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pinnedFragmentsByKind } from '../mutation/parse-utils.mjs';
import { jsNamespaceSuts, importMap, eligibleFnsDetail } from '../mutation/prove.mjs';

// An ARGUMENT-LESS `toThrow()` pins only "something in here threw". Any function whose breakage produces
// any throw satisfies it, so the only function the assertion can attribute is the one whose call IS the
// throwing expression: gut that and it returns the sentinel instead of throwing, and the assertion fails.
// A function deeper inside merely SUPPLIES a value; gutting it produces a different throw that still
// satisfies the oracle, so crediting it was an unsound accusation (zod's `check never inference`:
// `const t1 = z.never(); expect(() => t1.parse(undefined)).toThrow()` charged the hollow to `never`,
// campaign 2026-09-02). `toThrow(arg)` pins the error's identity, so it keeps today's breadth.
// Oracle: which function a reader could hold responsible when the assertion passes.

const imports = new Map();
const val = (body) => pinnedFragmentsByKind(body, imports).value;

test('bare toThrow credits only the head callee of the thrown expression', () => {
  assert.deepEqual(val('expect(() => parse(0)).toThrow();'), ['parse(0)']);
  assert.deepEqual(val('expect(() => parse(0)).toThrow()'), ['parse(0)'], 'no trailing semicolon');
  assert.deepEqual(val("expect(async () => await load(1)).toThrow();"), ['load(1)'], 'await is transparent');
  assert.deepEqual(val('expect(() => { parse(0); }).toThrow();'), ['parse(0)'], 'a single-statement block body');
  assert.deepEqual(val('expect(fetchIt()).rejects.toThrow();'), ['fetchIt()'], 'no arrow: the argument is the call');
});

test('bare toThrow credits nothing when the thrown expression is not a direct call', () => {
  assert.deepEqual(val('expect(() => t1.parse(undefined)).toThrow();'), [], 'a member call on a local: the receiver supplies, it does not throw by itself');
  assert.deepEqual(val('expect(() => validate(parseInput(x))).toThrow();'), ['validate(parseInput(x))'], 'the head callee only — parseInput is a supplier, credited by name inside it');
  assert.deepEqual(val('expect(() => { seed(); parse(0); }).toThrow();'), [], 'two statements: which one threw is unknown');
  assert.deepEqual(val('expect(() => new Parser().run()).toThrow();'), []);
  assert.deepEqual(val('expect(thing).toThrow();'), [], 'a bare reference names no call to gut');
});

test('toThrow WITH an argument pins the error identity and keeps the whole expression', () => {
  assert.deepEqual(val("expect(() => t1.parse(undefined)).toThrow('invalid');"), ['() => t1.parse(undefined)'], 'a masked string argument is still an argument');
  assert.deepEqual(val('expect(() => t1.parse(undefined)).toThrow(TypeError);'), ['() => t1.parse(undefined)']);
  assert.deepEqual(val('expect(() => t1.parse(undefined)).toThrowError(/bad/);'), ['() => t1.parse(undefined)']);
});

test('every other value matcher is untouched', () => {
  assert.deepEqual(val('expect(total([1, 2])).toBe(3);'), ['total([1, 2])', '3']);
  assert.deepEqual(val('expect(t1.parse(1)).toEqual({ a: 1 });'), ['t1.parse(1)', '{ a: 1 }']);
});

test('the var hop no longer reaches a factory through a bare-toThrow block (the zod shape)', () => {
  const d = mkdtempSync(join(tmpdir(), 'gc-throw-'));
  try {
    mkdirSync(join(d, 'src')); mkdirSync(join(d, 'test'));
    writeFileSync(join(d, 'src/schemas.mjs'), 'export function never() { return { parse(v) { throw new Error("never"); } }; }\n');
    const srcFiles = [join(d, 'src/schemas.mjs')];
    const testCode = "import * as z from '../src/schemas.mjs';\n";
    const absTest = join(d, 'test/t.test.mjs');
    const bare = 'const t1 = z.never();\nexpect(() => t1.parse(undefined)).toThrow();\n';
    assert.deepEqual(jsNamespaceSuts(bare, testCode + bare, absTest, srcFiles, importMap(testCode), d), [], 'no supplier is charged for an unattributable throw');
    const pinned = 'const t1 = z.never();\nexpect(t1.parse(1)).toBe(2);\n';
    assert.deepEqual(jsNamespaceSuts(pinned, testCode + pinned, absTest, srcFiles, importMap(testCode), d).map((x) => x.fn), ['never'], 'a real value pin still hops to the factory');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('eligibleFnsDetail: a block whose only assertion is an unattributable bare toThrow has no pin at all', () => {
  const body = 'const t1 = z.never();\nexpect(() => t1.parse(undefined)).toThrow();\n';
  const d = eligibleFnsDetail(body, ['never', 'parse'], imports);
  assert.deepEqual(d.eligible, []);
  assert.equal(d.hadPin, false, "'no-pin' is the honest label: nothing here can be held responsible");
});
