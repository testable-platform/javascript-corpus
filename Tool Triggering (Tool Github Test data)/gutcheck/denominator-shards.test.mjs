import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prove } from '../mutation/prove.mjs';
import { proveSharded } from '../mutation/shards.mjs';

const head = "import { test } from 'node:test'; import assert from 'node:assert';";
function project(files) {
  const d = mkdtempSync(join(tmpdir(), 'gc-shards-'));
  for (const [r, b] of Object.entries(files)) { const f = join(d, r); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, b); }
  return d;
}
// Two test files → two shards. Oracle: the sharded denominator must equal the single-process one
// (statuses per fn, derived by hand: add pinned → proven; quiet executed, never checked → unnoticed;
// ghost never imported → untested), and the parent must have run the phase (denominator 'execution').
test('proveSharded: the parent computes the same execution denominator as prove()', async () => {
  const d = project({
    'package.json': '{"type":"module"}',
    'src/m.mjs': 'export function add(a, b) { return a + b; }\nexport function quiet(x) { return x; }\nexport function ghost() { return 1; }\n',
    'test/a.test.mjs': `${head} import { add, quiet } from '../src/m.mjs';\ntest('a', () => { quiet(1); assert.equal(add(1, 1), 2); });\n`,
    'test/b.test.mjs': `${head} import { add } from '../src/m.mjs';\ntest('b', () => { assert.equal(add(2, 2), 4); });\n`,
  });
  try {
    const single = prove(d, { runner: 'node', maxProbes: 100 });
    const sharded = await proveSharded(d, { runner: 'node', maxProbes: 100 }, 2);
    const pick = (r) => Object.fromEntries(r.changes.map((c) => [c.fn, c.status]));
    assert.deepEqual(pick(single), { add: 'proven', quiet: 'unnoticed', ghost: 'untested' });
    assert.deepEqual(pick(sharded), pick(single));
    assert.equal(sharded.changeSummary.denominator, 'execution');
    assert.equal(sharded.execution.denominator, 'execution');
  } finally { rmSync(d, { recursive: true, force: true }); }
});
