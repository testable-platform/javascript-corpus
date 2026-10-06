import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { jsDeclSiteCount, jsDeclSites, grossBreak } from '../mutation/probe.mjs';
import { prove } from '../mutation/prove.mjs';

// The bare-method site scan required the body brace to follow the parameters with only whitespace
// between, so a method carrying a RETURN-TYPE ANNOTATION (`get enum(): Values<T> {`) was invisible to
// it. That is a false-HOLLOW vector, not merely a reach loss: the site COUNT is the credit-time
// ambiguity guard, so a file with one annotated and one plain declaration of a name counted 1 —
// "unique" — and the gut then targeted the plain one while the test exercised the annotated one, which
// survived. Reproduced on zod (campaign 2026-09-02): `get enum(): Values<T>` in ZodEnum and `get enum()`
// in ZodNativeEnum, one file, `create enum` reported hollow. Oracle: what a reader counts in the source.

const TWO = `class Enum { get value(): Values<T> {\n    return this.inner;\n  }\n}\nclass NativeEnum { get value() {\n    return this.inner;\n  }\n}\n`;
const ONE = `class Enum {\n  get value(): Record<string, string> {\n    return this.inner;\n  }\n  plain(n: number): number {\n    return n + 1;\n  }\n}\n`;

test('jsDeclSiteCount counts a method whose signature carries a return-type annotation', () => {
  assert.equal(jsDeclSiteCount(TWO, 'value'), 2, 'annotated + plain in one file is ambiguous, not unique');
  assert.equal(jsDeclSites(ONE, 'value').length, 1);
  assert.equal(jsDeclSiteCount(ONE, 'plain'), 1);
});

test('grossBreak guts an annotated method (a reach gain) and refuses the ambiguous pair (a precision gain)', () => {
  assert.match(grossBreak(ONE, 'value', 'typescript') || '', /get value\(\): Record<string, string> \{\s*return 987654321;?\s*\}/);
  assert.match(grossBreak(ONE, 'plain', 'typescript') || '', /plain\(n: number\): number \{\s*return 987654321;?\s*\}/);
  assert.equal(grossBreak(TWO, 'value', 'typescript'), null, 'two declarations of `value` — refuse, never first-match');
});

test('prove(): the zod shape — an executed getter with a sibling of the same name in one file is never hollow', () => {
  const d = mkdtempSync(join(tmpdir(), 'gc-annot-'));
  try {
    for (const [r, b] of Object.entries({
      'package.json': '{"type":"module"}',
      // The tested getter carries an annotation-shaped signature; a same-named plain getter sits below it.
      'src/types.mjs': "export class Enum {\n  constructor(v) { this.v = v; }\n  get values() {\n    return Object.fromEntries(this.v.map((x) => [x, x]));\n  }\n  get enum() /* : Values */ {\n    return this.values;\n  }\n}\nclass NativeEnum { get enum() {\n    return {};\n  }\n}\nfunction createEnum(v) { return new Enum(v); }\nexport { createEnum as enum, NativeEnum };\n",
      'src/mid/index.mjs': "export * from '../types.mjs';\n",
      'src/index.mjs': "export * from './mid/index.mjs';\n",
      'test/t.test.mjs': "import { test } from 'node:test'; import assert from 'node:assert';\nimport * as z from '../src/index.mjs';\ntest('create enum', () => { const E = z.enum(['Red', 'Green']); assert.strictEqual(E.enum.Red, 'Red'); });\n",
    })) { const f = join(d, r); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, b); }
    const r = prove(d, { runner: 'node' });
    assert.deepEqual(r.hollow, [], JSON.stringify(r.hollow));
  } finally { rmSync(d, { recursive: true, force: true }); }
});
