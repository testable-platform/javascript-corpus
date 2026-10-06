import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildExecutionMap, phaseProgress } from '../mutation/denominator.mjs';

const head = "import { test } from 'node:test'; import assert from 'node:assert';";
function project(files) {
  const d = mkdtempSync(join(tmpdir(), 'gc-map-'));
  for (const [r, b] of Object.entries(files)) { const f = join(d, r); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, b); }
  return d;
}
// Oracle by construction: a.test executes add only; b.test executes add AND mul; red.test executes neg
// but fails, so it must contribute nothing. `ghost` is executed by nobody.
test('buildExecutionMap: per test file, the source functions it executed; red baselines contribute nothing', () => {
  const d = project({
    'package.json': '{"type":"module"}',
    'src/m.mjs': 'export function add(a, b) { return a + b; }\nexport function mul(a, b) { return a * b; }\nexport function neg(a) { return -a; }\nexport function ghost() { return 1; }\n',
    'test/a.test.mjs': `${head} import { add } from '../src/m.mjs';\ntest('a', () => { assert.equal(add(1, 2), 3); });\n`,
    'test/b.test.mjs': `${head} import { add, mul } from '../src/m.mjs';\ntest('b', () => { assert.equal(mul(add(1, 1), 3), 6); });\n`,
    'test/red.test.mjs': `${head} import { neg } from '../src/m.mjs';\ntest('r', () => { assert.equal(neg(1), 1); });\n`,
  });
  try {
    const { execBy, baselines } = buildExecutionMap(d, 'node', ['test/a.test.mjs', 'test/b.test.mjs', 'test/red.test.mjs'], ['src/m.mjs'], 60000);
    assert.deepEqual([...execBy.get('src/m.mjs::add')].sort(), ['test/a.test.mjs', 'test/b.test.mjs']);
    assert.deepEqual([...execBy.get('src/m.mjs::mul')], ['test/b.test.mjs']);
    assert.equal(execBy.has('src/m.mjs::neg'), false, 'a red baseline contributes nothing');
    assert.equal(execBy.has('src/m.mjs::ghost'), false);
    assert.equal(baselines.get('test/red.test.mjs').ok, false);
    assert.equal(baselines.get('test/a.test.mjs').ok, true);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('buildExecutionMap: a past deadline stops before the first run and says so', () => {
  const d = project({ 'package.json': '{"type":"module"}', 'src/m.mjs': 'export function f() { return 1; }\n', 'test/a.test.mjs': `${head} import { f } from '../src/m.mjs';\ntest('a', () => { assert.equal(f(), 1); });\n` });
  try {
    const r = buildExecutionMap(d, 'node', ['test/a.test.mjs'], ['src/m.mjs'], 60000, { deadline: Date.now() - 1 });
    assert.equal(r.timedOut, true); assert.equal(r.execBy.size, 0);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

// The CLI prints progress as `file :: 'name'`; the phase's raw events carry no `name`, so an unadapted
// listener printed 'undefined' (seen on the 0.10.0 dogfood under --jobs=4). Both event kinds render.
test('phaseProgress adapts phase events to the CLI progress shape; undefined listener stays undefined', () => {
  const seen = [];
  const adapted = phaseProgress((p) => seen.push(p));
  adapted({ phase: 'baseline', file: 't/a.test.mjs' });
  adapted({ phase: 'detect', file: 't/a.test.mjs', fn: 'add', mutant: '987654321' });
  assert.deepEqual(seen, [{ file: 't/a.test.mjs', name: '(execution baseline)' }, { file: 't/a.test.mjs', name: 'add ← return 987654321' }]);
  assert.equal(phaseProgress(undefined), undefined);
});
