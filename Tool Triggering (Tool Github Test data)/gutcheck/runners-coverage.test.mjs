import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { testCmdFor, runOne } from '../mutation/runners.mjs';

// Coverage mode on the runner layer (Move 1): runOne({ coverageDir }) sets NODE_V8_COVERAGE for the
// JS runners, and vitest's coverage baseline runs under --pool=threads (its default forks pool kills
// workers before V8 flushes coverage — spike 2026-09-02). Every other argument is byte-identical.

test('testCmdFor: vitest under coverage adds --pool=threads; without coverage, and for node/jest, args are unchanged', () => {
  const cwd = process.cwd();
  const v = testCmdFor('vitest', 'test/t.test.ts', 'name', cwd, false, undefined, { coverage: true });
  assert.ok(v.args.includes('--pool=threads'), v.args.join(' '));
  assert.ok(!testCmdFor('vitest', 'test/t.test.ts', 'name', cwd).args.includes('--pool=threads'));
  assert.deepEqual(testCmdFor('node', 'test/t.test.mjs', 'name', cwd, false, undefined, { coverage: true }).args, testCmdFor('node', 'test/t.test.mjs', 'name', cwd).args);
  assert.deepEqual(testCmdFor('jest', 'test/t.test.js', 'name', cwd, false, undefined, { coverage: true }).args, testCmdFor('jest', 'test/t.test.js', 'name', cwd).args);
});

test('runOne with coverageDir writes V8 coverage naming the executed SUT function (node:test)', () => {
  const d = mkdtempSync(join(tmpdir(), 'gc-runcov-'));
  try {
    writeFileSync(join(d, 'package.json'), '{"type":"module"}');
    mkdirSync(join(d, 'src')); mkdirSync(join(d, 'test'));
    writeFileSync(join(d, 'src/lib.mjs'), 'export function dbl(x) { return x * 2; }\nexport function unused() { return 1; }\n');
    writeFileSync(join(d, 'test/t.test.mjs'), "import { test } from 'node:test'; import assert from 'node:assert';\nimport { dbl } from '../src/lib.mjs';\ntest('sound', () => { assert.strictEqual(dbl(3), 6); });\n");
    const cov = join(d, '.cov');
    const r = runOne(d, 'node', 'test/t.test.mjs', 'sound', 60000, false, { coverageDir: cov });
    assert.ok(r.passed >= 1 && r.failed === 0, JSON.stringify(r));
    const names = readdirSync(cov).flatMap((f) => JSON.parse(readFileSync(join(cov, f), 'utf8')).result
      .filter((s) => s.url.endsWith('/src/lib.mjs'))
      .flatMap((s) => s.functions.filter((fn) => fn.ranges[0].count > 0).map((fn) => fn.functionName)));
    assert.ok(names.includes('dbl'), names.join(','));
    assert.ok(!names.includes('unused'));
    const plain = runOne(d, 'node', 'test/t.test.mjs', 'sound', 60000);
    assert.ok(plain.passed >= 1, 'no coverageDir → the plain run, unchanged');
  } finally { rmSync(d, { recursive: true, force: true }); }
});
