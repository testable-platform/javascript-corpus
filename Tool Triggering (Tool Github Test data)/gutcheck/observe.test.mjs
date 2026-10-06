import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { executedFunctions, resolveByExecution } from '../mutation/observe.mjs';

// Execution location (Move 1), the read side: a V8 coverage directory (NODE_V8_COVERAGE) → for each
// src file, the set of function names whose execution count is > 0. Test files, node_modules and
// anything outside srcFiles never appear; anonymous functions (the module wrapper, an anonymous
// default export) are dropped; V8's `get x`/`set x` accessor names are reduced to `x`. The resolver
// answers a pinned name with the ONE src file that executed it — two files or none is null. Oracle:
// coverage JSON written by hand to the documented V8 shape, never captured from a run.

const cov = (url, fns) => ({ scriptId: '1', url, functions: fns.map(([functionName, count]) => ({ functionName, ranges: [{ startOffset: 0, endOffset: 10, count }], isBlockCoverage: false })) });
function dirWith(files) {
  const d = mkdtempSync(join(tmpdir(), 'gc-observe-'));
  files.forEach((j, i) => writeFileSync(join(d, `coverage-${i}.json`), JSON.stringify(j)));
  return d;
}

test('executedFunctions: per-src-file names with count > 0; test files, node_modules, anonymous and accessors handled', () => {
  const repo = mkdtempSync(join(tmpdir(), 'gc-observe-repo-'));
  const src = (rel) => join(repo, rel);
  const srcFiles = [src('src/calc.mjs'), src('src/factory.mjs'), src('lib/other.mjs')];
  const d = dirWith([{ result: [
    cov(pathToFileURL(src('src/calc.mjs')).href, [['', 1], ['mul', 2], ['add', 0], ['get value', 1], ['unused', 0]]),
    cov(pathToFileURL(src('src/factory.mjs')).href, [['', 1], ['makeCalc', 1], ['mul', 1]]),
    cov(pathToFileURL(src('test/t.test.mjs')).href, [['', 1], ['helper', 3]]),
    cov(pathToFileURL(src('node_modules/dep/index.js')).href, [['', 1], ['mul', 5]]),
    cov('node:internal/modules/run_main', [['', 1]]),
  ] }]);
  try {
    const ex = executedFunctions(d, srcFiles, repo);
    assert.deepEqual([...ex.get('src/calc.mjs')].sort(), ['mul', 'value']);
    assert.deepEqual([...ex.get('src/factory.mjs')].sort(), ['makeCalc', 'mul']);
    assert.equal(ex.has('lib/other.mjs'), false, 'a src file with no coverage entry is absent, not empty');
    assert.equal(ex.has('test/t.test.mjs'), false);
    assert.equal([...ex.keys()].some((k) => k.includes('node_modules')), false);
  } finally { rmSync(d, { recursive: true, force: true }); rmSync(repo, { recursive: true, force: true }); }
});

test('executedFunctions: unreadable or malformed coverage files contribute nothing (never throw)', () => {
  const d = dirWith([]);
  writeFileSync(join(d, 'coverage-x.json'), '{not json');
  try { assert.equal(executedFunctions(d, [], '/nowhere').size, 0); } finally { rmSync(d, { recursive: true, force: true }); }
  assert.equal(executedFunctions('/definitely/missing/dir', [], '/nowhere').size, 0);
});

test('resolveByExecution: exactly one src file executed the name → that file; two or none → null', () => {
  const ex = new Map([['src/calc.mjs', new Set(['mul', 'shared'])], ['src/factory.mjs', new Set(['makeCalc', 'shared'])]]);
  assert.equal(resolveByExecution('mul', ex), 'src/calc.mjs');
  assert.equal(resolveByExecution('makeCalc', ex), 'src/factory.mjs');
  assert.equal(resolveByExecution('shared', ex), null, 'ambiguous across two files — refuse');
  assert.equal(resolveByExecution('never', ex), null);
});
