import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bodyIsTrivial } from '../mutation/probe.mjs';

// Spike 2026-09-05: 2 of 5 "undetected" functions were EQUIVALENT mutants — an empty generator
// (`entries = function* () {}`) and an empty hook (`off() {}`). A `return 987654321` body is
// behaviorally identical to an empty one for callers that ignore the result, so the execution
// denominator must refuse these before spending a run ('no-distinct-mutant').
test('bodyIsTrivial: empty, return-only and yield-only bodies are trivial', () => {
  assert.equal(bodyIsTrivial('export function off() {}', 'off'), true);
  assert.equal(bodyIsTrivial('export function f() { return; }', 'f'), true);
  assert.equal(bodyIsTrivial('export function f() {\n  return undefined;\n}', 'f'), true);
  assert.equal(bodyIsTrivial('export function* g() {}', 'g'), true);
  assert.equal(bodyIsTrivial('export const h = () => {};', 'h'), true);
  assert.equal(bodyIsTrivial('export const h = () => undefined;', 'h'), true);
  assert.equal(bodyIsTrivial('def f(x):\n    pass\n', 'f', 'python'), true);
});

test('bodyIsTrivial: a real body is not trivial; an unlocatable name is not trivial either', () => {
  assert.equal(bodyIsTrivial('export function f(x) { return x + 1; }', 'f'), false);
  assert.equal(bodyIsTrivial('export const h = (x) => x * 2;', 'h'), false);
  assert.equal(bodyIsTrivial('export function f() { log(); }', 'f'), false);
  assert.equal(bodyIsTrivial('const nothing = 1;', 'f'), false);
});
