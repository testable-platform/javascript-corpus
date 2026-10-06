import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grossBreak } from '../mutation/probe.mjs';
import { changedDecls } from '../mutation/changes.mjs';

// Campaign 2026-09-02 (mitt): `export default function mitt<Events extends Record<EventType, unknown>>(...)`
// — a generic parameter list with a NESTED `<…>` — was invisible to both the diff report's enumerator
// and the probe's signature regex (their generic group admitted `[^>()]*`, no nesting): a repo with one
// function read "0 functions in this repo", and the probe could not locate it. One level of nesting is
// admitted on both sides, kept in lockstep. Oracle: the declaration a reader sees on the line.

const MITT = "export default function mitt<Events extends Record<EventType, unknown>>(all?: EventHandlerMap<Events>): Emitter<Events> {\n  return { all }\n}\n";
const ARROW = "export const pick = <T extends Record<string, unknown>>(obj: T, keys: Array<keyof T>): Partial<T> => {\n  return obj\n}\n";
const DEEP = "export function deep<T extends Map<string, Set<number>>>(m: T): T {\n  return m\n}\n";

test('changedDecls enumerates a function whose generic list nests one level of angle brackets', () => {
  assert.deepEqual(changedDecls(MITT, 'js', null).map((d) => d.fn), ['mitt']);
  assert.deepEqual(changedDecls(ARROW, 'js', null).map((d) => d.fn), ['pick']);
});

test('grossBreak locates and guts a function whose generic list nests one level of angle brackets', () => {
  assert.match(grossBreak(MITT, 'mitt', 'typescript') || '', /Emitter<Events> \{\s*return 987654321;?\s*\}/);
  assert.match(grossBreak(ARROW, 'pick', 'typescript') || '', /Partial<T> => \{\s*return 987654321;?\s*\}/);
});

test('two levels of nesting stay out of reach (fail closed, never a wrong gut)', () => {
  assert.equal(grossBreak(DEEP, 'deep', 'typescript'), null);
  assert.deepEqual(changedDecls(DEEP, 'js', null).map((d) => d.fn), []);
});
