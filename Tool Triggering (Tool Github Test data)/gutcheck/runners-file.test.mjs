import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileCmdFor, runFile } from '../mutation/runners.mjs';

// Whole-FILE runs: runOne always injects a name selector (node's is anchored `^name$`, which selects
// nothing for an empty name). The execution denominator needs "run this file, every test in it" — once
// under coverage to learn what the file executes, then against a gutted function to see if it notices.
test('fileCmdFor: no name selector for any JS runner', () => {
  const node = fileCmdFor('node', 'test/a.test.mjs');
  assert.deepEqual(node.args.slice(0, 2), ['--test', '--test-reporter=tap']);
  assert.ok(!node.args.includes('--test-name-pattern'));
  for (const r of ['vitest', 'jest', 'mocha', 'ava']) {
    const { args } = fileCmdFor(r, 'test/a.test.ts', process.cwd());
    assert.ok(!args.includes('-t') && !args.includes('--grep') && !args.includes('-m'), `${r}: ${args.join(' ')}`);
    assert.ok(args.includes('test/a.test.ts'), `${r} names the file`);
  }
  assert.ok(fileCmdFor('vitest', 'x.test.ts', process.cwd(), { coverage: true }).args.includes('--pool=threads'));
});

test('runFile: runs every test in a node:test file and parses the counts', () => {
  const d = mkdtempSync(join(tmpdir(), 'gc-runfile-'));
  mkdirSync(join(d, 'test'));
  writeFileSync(join(d, 'package.json'), '{"type":"module"}');
  writeFileSync(join(d, 'test/a.test.mjs'), "import { test } from 'node:test'; import assert from 'node:assert';\ntest('one', () => { assert.equal(1, 1); });\ntest('two', () => { assert.equal(1, 2); });\n");
  try {
    const r = runFile(d, 'node', 'test/a.test.mjs', 60000);
    assert.equal(r.passed, 1); assert.equal(r.failed, 1);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('runFile: a non-JS runner is refused without spawning', () => {
  const r = runFile(process.cwd(), 'gradle', 'x', 1000);
  assert.deepEqual(r, { passed: 0, failed: 0, out: '', unsupported: true });
});
