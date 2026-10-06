import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grossBreak } from '../mutation/probe.mjs';

// jsSigRegex's `NAME = (` alternative matches ANY parenthesized initializer — a ternary-selected
// callable, an IIFE, a cast — not only an arrow. locateBody then paren-balanced the initializer and
// searched FORWARD, unbounded, for the next `{` or `=>`: in semicolon-less code that is the NEXT
// declaration's body, gutted under the wrong name (the test's own function untouched → a false
// HOLLOW; or the neighbor's test red → a false PROVEN). The guard: after the balanced parameter list
// the arrow (or a same-line return-type annotation, then the arrow) must follow, else the site is not
// a function and grossBreak refuses (null → the block reads unverifiable, never a verdict).

test('a parenthesized non-arrow initializer is refused — never the next declaration gutted under its name', () => {
  const ternary = 'const handler = (cond ? a : b)\nexport function next(x) {\n  return x + 1\n}\n';
  assert.equal(grossBreak(ternary, 'handler', 'typescript'), null);
  const iife = 'const value = (() => 1)()\nexport const g = (y) => y + 1\n';
  assert.equal(grossBreak(iife, 'value', 'typescript'), null);
  const cast = 'const el = (node as HTMLElement)\nfunction h() { return 3 }\n';
  assert.equal(grossBreak(cast, 'el', 'typescript'), null);
});

test('the guard keeps every real arrow form guttable', () => {
  const cases = [
    ['export const f = (a, b) => a + b\n', 'export const f = (a, b) => 987654321\n'],
    ['export const f = (a: number): number => a\n', 'export const f = (a: number): number => 987654321\n'],
    ['export const f = (x): { id: string } => ({ id: x })\n', 'export const f = (x): { id: string } => 987654321\n'],
    ['export const f = (\n  a,\n  b\n) => a + b\n', 'export const f = (\n  a,\n  b\n) => 987654321\n'],
    ['export const first = <T,>(xs: T[]): T => xs[0]\n', 'export const first = <T,>(xs: T[]): T => 987654321\n'],
    ['export const f = async (x) => x\n', 'export const f = async (x) => 987654321\n'],
  ];
  for (const [src, want] of cases) assert.equal(grossBreak(src, src.includes('first') ? 'first' : 'f', 'typescript'), want, src);
  const block = grossBreak('export const f = async (x) => {\n  return x\n}\n', 'f', 'typescript');
  assert.match(block, /=> \{\s*return 987654321;?\s*\}/, block);
});
