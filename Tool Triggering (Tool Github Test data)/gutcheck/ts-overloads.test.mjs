import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { grossBreak, jsDeclSiteCount } from '../mutation/probe.mjs';
import { prove } from '../mutation/prove.mjs';

// TypeScript overload sets (radash's `zip`, `sum`; zod, date-fns): several BODILESS signature
// declarations followed by the one implementation that has a body. The declaration-site rule refused
// any name with more than one site ("two or more → refuse") — every overloaded function read "tested
// function not locatable" (corpus receipt 2026-09-02). A signature without a body cannot be gutted and
// TypeScript requires the implementation to follow its overloads, so exactly one BODIED site is the
// unique gut target; two bodied sites (a real redeclaration) still refuse. Oracle: the mutant a whole-
// implementation gut must produce, written by hand.

const OVERLOADS = `export function zip<T1, T2>(a: T1[], b: T2[]): [T1, T2][]
export function zip<T1, T2, T3>(a: T1[], b: T2[], c: T3[]): [T1, T2, T3][]
export function zip<T>(...arrays: T[][]): T[][] {
  return arrays[0].map((_, i) => arrays.map((a) => a[i]))
}
export const other = (n: number): number => n + 1
`;

test('grossBreak: an overload set guts the one bodied implementation; the signatures are untouched', () => {
  const out = grossBreak(OVERLOADS, 'zip', 'typescript');
  assert.ok(out, 'located');
  assert.match(out, /export function zip<T>\(\.\.\.arrays: T\[\]\[\]\): T\[\]\[\] \{\s*return 987654321;?\s*\}/);
  assert.ok(out.startsWith('export function zip<T1, T2>(a: T1[], b: T2[]): [T1, T2][]\nexport function zip<T1, T2, T3>'), 'signatures byte-identical');
  assert.ok(out.endsWith('export const other = (n: number): number => n + 1\n'), 'neighbor untouched');
});

test('grossBreak: semicolon-terminated overload signatures and a declare-style set behave the same', () => {
  const semi = `export function sum<T extends number>(array: readonly T[]): number;\nexport function sum<T extends object>(array: readonly T[], fn: (item: T) => number): number;\nexport function sum<T>(array: readonly any[], fn?: (item: T) => number): number {\n  return (array || []).reduce((acc, item) => acc + (fn ? fn(item) : item), 0)\n}\n`;
  const out = grossBreak(semi, 'sum', 'typescript');
  assert.ok(out, 'located');
  assert.match(out, /number \{\s*return 987654321;?\s*\}\n$/);
});

test('grossBreak: two BODIED declarations of one name still refuse — a real redeclaration is ambiguous', () => {
  const two = `function fmt(n: number): string { return String(n) }\nexport function fmt(n: number): string { return n.toFixed(2) }\n`;
  assert.equal(grossBreak(two, 'fmt', 'typescript'), null);
});

test('jsDeclSiteCount agrees: an overload set counts as one declaration site', () => {
  assert.equal(jsDeclSiteCount(OVERLOADS, 'zip'), 1);
  assert.equal(jsDeclSiteCount('function fmt(n) { return 1 }\nfunction fmt(n) { return 2 }\n', 'fmt'), 2);
});

test('prove(): a test over an overloaded TS function is PROVEN', () => {
  const d = mkdtempSync(join(tmpdir(), 'gc-overload-'));
  try {
    writeFileSync(join(d, 'package.json'), '{"type":"module"}');
    mkdirSync(join(d, 'src')); mkdirSync(join(d, 'test'));
    // Plain .mjs so node:test runs it without a TS loader — the overload SHAPE is what matters and the
    // probe's regex layer sees the same text either way.
    writeFileSync(join(d, 'src/zip.mjs'), 'export function zip(a, b) {\n  return a.map((x, i) => [x, b[i]]);\n}\n');
    writeFileSync(join(d, 'src/sum.ts'), 'export function sum(array: readonly number[]): number\nexport function sum<T>(array: readonly T[], fn: (item: T) => number): number\nexport function sum(array: readonly any[], fn?: (item: any) => number): number {\n  return array.reduce((acc, item) => acc + (fn ? fn(item) : item), 0)\n}\n');
    writeFileSync(join(d, 'test/t.test.mjs'), "import { test } from 'node:test'; import assert from 'node:assert';\nimport { zip } from '../src/zip.mjs';\ntest('zips', () => { assert.deepStrictEqual(zip([1], [2]), [[1, 2]]); });\n");
    const r = prove(d, { runner: 'node' });
    assert.equal(r.caught, 1);
    assert.ok(grossBreak(readFileSync(join(d, 'src/sum.ts'), 'utf8'), 'sum', 'typescript'), 'the TS overload set in the same repo is guttable');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

// The diff report's enumeration must agree: one row per overloaded function, at its implementation —
// three rows named `zip` (one per signature) would over-count the denominator and print the name thrice.
test('changedDecls: an overload set enumerates ONE function, at the bodied implementation', async () => {
  const { changedDecls } = await import('../mutation/changes.mjs');
  const decls = changedDecls(OVERLOADS, 'js', null).filter((d) => d.fn === 'zip');
  assert.equal(decls.length, 1, JSON.stringify(decls));
  assert.equal(decls[0].line, 3, 'the implementation line');
  const two = changedDecls('function fmt(n) { return 1 }\nfunction fmt(n) { return 2 }\n', 'js', null).filter((d) => d.fn === 'fmt');
  assert.equal(two.length, 2, 'a real redeclaration keeps both rows (the probe refuses it; the report must not hide it)');
});
