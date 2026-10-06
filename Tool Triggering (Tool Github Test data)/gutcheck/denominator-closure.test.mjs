import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { importClosure, selectTestFiles, orderTestFiles } from '../mutation/denominator.mjs';
import { canonKey } from '../mutation/parse-utils.mjs';

function project(files) {
  const d = mkdtempSync(join(tmpdir(), 'gc-closure-'));
  for (const [r, b] of Object.entries(files)) { const f = join(d, r); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, b); }
  return d;
}
// Oracle: the reachable set is written down by hand from the import lines below.
//   t.test.mjs → ../src/index.mjs (barrel) → ./a.mjs, ./b.js (TS swap: b.ts on disk), ./sub (→ sub/index.mjs)
//   a.mjs → ./cycle.mjs → ./a.mjs (cycle)   ·   b.ts imports a PACKAGE ('lodash') — never followed
//   ./unrelated.mjs is imported only by u.test.mjs, via require().
const FILES = {
  'src/index.mjs': "export * from './a.mjs';\nexport { bee } from './b.js';\nexport * as sub from './sub';\n",
  'src/a.mjs': "import './cycle.mjs';\nexport const a = 1;\n",
  'src/cycle.mjs': "import { a } from './a.mjs';\nexport const c = a;\n",
  'src/b.ts': "import _ from 'lodash';\nexport const bee = 2;\n",
  'src/sub/index.mjs': "export const s = 3;\n",
  'src/unrelated.mjs': "export const u = 4;\n",
  'test/t.test.mjs': "import { a } from '../src/index.mjs';\nconst dyn = await import('../src/sub');\n",
  'test/u.test.mjs': "const { u } = require('../src/unrelated.mjs');\n",
};
const SRC = ['index.mjs', 'a.mjs', 'cycle.mjs', 'b.ts', 'sub/index.mjs', 'unrelated.mjs'];

test('importClosure follows relative import/export/require/import() through barrels, TS swap, dirs and cycles', () => {
  const d = project(FILES);
  try {
    const src = SRC.map((r) => join(d, 'src', r));
    const keys = new Set(src.map(canonKey));
    const got = importClosure(join(d, 'test/t.test.mjs'), keys, d);
    const expected = ['a.mjs', 'b.ts', 'cycle.mjs', 'index.mjs', 'sub/index.mjs'].map((r) => canonKey(join(d, 'src', r))).sort();
    assert.deepEqual([...got].sort(), expected);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('selectTestFiles keeps only test files whose closure reaches a changed source file; null keeps all', () => {
  const d = project(FILES);
  try {
    const src = SRC.map((r) => join(d, 'src', r));
    const tests = [join(d, 'test/t.test.mjs'), join(d, 'test/u.test.mjs')];
    assert.deepEqual(selectTestFiles(tests, src, d, null), tests);
    const onlyU = selectTestFiles(tests, src, d, new Set([canonKey(join(d, 'src/unrelated.mjs'))]));
    assert.deepEqual(onlyU, [join(d, 'test/u.test.mjs')]);
    const onlyT = selectTestFiles(tests, src, d, new Set([canonKey(join(d, 'src/cycle.mjs'))]));
    assert.deepEqual(onlyT, [join(d, 'test/t.test.mjs')]);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

// Oracle by construction: mentions outrank everything; among non-mentioners a DIRECT importer of the changed
// file outranks an indirect one; among equals the smaller file goes first (sizes by hand: small-indirect 40
// bytes, direct ~105, big-indirect 441); a bare scan (changed null) has no direct/indirect split, so it is
// mention order, then size, then original order.
test('orderTestFiles: mentions, then direct importers, then smaller files, then original order', () => {
  const d = project({
    'src/core.mjs': 'export function a() { return 1; }\n',
    'src/barrel.mjs': "export * from './core.mjs';\n",
    'test/big-indirect.test.mjs': "import { a } from '../src/barrel.mjs';\n" + '// '.padEnd(400, 'x') + '\n',
    'test/small-indirect.test.mjs': "import { a } from '../src/barrel.mjs';\n",
    'test/direct.test.mjs': "import * as c from '../src/core.mjs';\n// padding padding padding padding padding padding padding padding\n",
    'test/mentions.test.mjs': "import { a } from '../src/barrel.mjs';\nconst r = a();\n",
  });
  try {
    const t = (n) => join(d, 'test', n);
    const files = [t('big-indirect.test.mjs'), t('small-indirect.test.mjs'), t('direct.test.mjs'), t('mentions.test.mjs')];
    const changed = new Set([canonKey(join(d, 'src/core.mjs'))]);
    const got = orderTestFiles(files, [{ srcRel: 'src/core.mjs', fn: 'a' }], changed).map((f) => basename(f));
    assert.deepEqual(got, ['mentions.test.mjs', 'direct.test.mjs', 'small-indirect.test.mjs', 'big-indirect.test.mjs']);
    const bare = orderTestFiles(files, [{ srcRel: 'src/core.mjs', fn: 'a' }], null).map((f) => basename(f));
    assert.deepEqual(bare, ['mentions.test.mjs', 'small-indirect.test.mjs', 'direct.test.mjs', 'big-indirect.test.mjs'], 'bare scan: mention order, then size ascending');
  } finally { rmSync(d, { recursive: true, force: true }); }
});
