import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeResolver, importMap } from '../mutation/prove.mjs';

// `export { default as add } from './add.js'` (ramda's barrel idiom, one line per function). The hop
// refused every `default as` re-export because the declared name might differ from the tested one.
// It is safe exactly when the target's DEFAULT export is the function declared under that same name —
// `export default function add(…)`, or `export default add` beside a `function add` declaration — so
// the identifier the test calls is the identifier the gut locates. Anything else (a default of a
// different name, an anonymous default, no default) still refuses. Oracle: which file declares `add`
// is fixed by the fixture.

function project(files) {
  const d = mkdtempSync(join(tmpdir(), 'gc-barrel-default-'));
  for (const [r, b] of Object.entries(files)) { const f = join(d, r); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, b); }
  return d;
}
const abs = (d, ...segs) => join(d, ...segs);
function resolveIn(d, files) {
  const srcFiles = Object.keys(files).map((r) => abs(d, r));
  return makeResolver(srcFiles, d)('add', abs(d, 'test/add.test.mjs'), importMap("import { add } from '../src/index.mjs';\n"));
}

test('default-as re-export resolves when the target declares the same-named function as its default', () => {
  for (const impl of [
    'export default function add(a, b) { return a + b; }\n',
    'function add(a, b) { return a + b; }\nexport default add;\n',
    'export const mul = (a, b) => a * b;\nexport default function add(a, b) { return a + b; }\n',
    'const add = (a, b) => a + b;\nexport default add;\n',
  ]) {
    const files = { 'src/index.mjs': "export { default as add } from './add.mjs';\n", 'src/add.mjs': impl };
    const d = project(files);
    try { assert.equal(resolveIn(d, files), 'src/add.mjs', impl); } finally { rmSync(d, { recursive: true, force: true }); }
  }
});

test('default-as re-export still refuses a differently-named, anonymous, or absent default', () => {
  for (const impl of [
    'export default function sum(a, b) { return a + b; }\n',
    'export default (a, b) => a + b;\n',
    'export function add(a, b) { return a + b; }\n',
  ]) {
    const files = { 'src/index.mjs': "export { default as add } from './add.mjs';\n", 'src/add.mjs': impl };
    const d = project(files);
    try { assert.equal(resolveIn(d, files), null, impl); } finally { rmSync(d, { recursive: true, force: true }); }
  }
});
