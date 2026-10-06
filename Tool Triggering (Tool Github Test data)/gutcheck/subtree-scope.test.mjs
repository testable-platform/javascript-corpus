import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { prove, detectRunner } from '../mutation/prove.mjs';
import { projectRootOf } from '../mutation/runners.mjs';
import { reEsc } from '../mutation/parse-utils.mjs';

// Field report 2026-09-02 §2: `gutcheck <subtree>` on a repo whose tests are NOT co-located found zero
// test files under the path and printed every source function there as "with no binding test" — a
// property of the scan stated as a property of the code — after detecting the runner from the subtree
// (no package.json there → node) instead of from the project. Oracle: the fixture's tests live in a
// sibling tree and the project root is known by construction, so the expected refusal, runner, and
// root are all derived independently of the scan.

const GUT = resolve('mutation/gutcheck.mjs');
const head = "import { test } from 'node:test'; import assert from 'node:assert';";
function project(files) {
  const d = mkdtempSync(join(tmpdir(), 'gc-subtree-'));
  for (const [r, b] of Object.entries(files)) { const f = join(d, r); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, b); }
  return d;
}
const run = (args) => spawnSync(process.execPath, [GUT, ...args], { encoding: 'utf8' });
const SPLIT = {
  'package.json': '{"type":"module","scripts":{"test":"vitest run"}}',
  'src/a.mjs': 'export function add(a, b) { return a + b; }\n',
  'test/a.test.mjs': `${head} import { add } from '../src/a.mjs';\ntest('adds', () => { assert.strictEqual(add(2, 3), 5); });\n`,
};

test('projectRootOf: the nearest ancestor-or-self with a project marker, or the git toplevel', () => {
  const d = project(SPLIT);
  const g = project({ 'repo/src/a.mjs': 'export const x = 1;\n', 'package.json': '{}' });
  mkdirSync(join(g, 'repo', '.git'));
  try {
    assert.equal(projectRootOf(join(d, 'src')), d, 'walks up to the package.json');
    assert.equal(projectRootOf(d), d, 'a root is its own root');
    assert.equal(projectRootOf(join(g, 'repo', 'src')), join(g, 'repo'), 'a git toplevel is a root, and the walk never crosses it to the package.json above');
  } finally { rmSync(d, { recursive: true, force: true }); rmSync(g, { recursive: true, force: true }); }
});

test('detectRunner reads the project the subtree belongs to, not the subtree', () => {
  const d = project(SPLIT);
  try {
    assert.equal(detectRunner(join(d, 'src')), 'vitest');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('PROVE: a subtree with sources and zero test files is refused, naming the project root', () => {
  const d = project(SPLIT);
  try {
    const r = prove(join(d, 'src'));
    assert.match(r.scopeError, /no test files under /);
    assert.match(r.scopeError, new RegExp(reEsc(realpathSync(d))), 'names the project root the tests may live under');
    assert.equal(r.changeSummary, null, 'no denominator is claimed from a scan that located no tests');
    assert.equal(r.runner, 'vitest', 'the runner is the project\'s, even on the refusal');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('PROVE: a project ROOT with sources and zero tests keeps the untested nudge (that claim is true)', () => {
  const d = project({ 'package.json': SPLIT['package.json'], 'src/a.mjs': SPLIT['src/a.mjs'] });
  try {
    const r = prove(d, { runner: 'node' });
    assert.equal(r.scopeError, undefined);
    assert.equal(r.changeSummary.untested, 1);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('CLI: the subtree refusal is exit 2 and never prints a "no binding test" denominator', () => {
  const d = project(SPLIT);
  try {
    const r = run([join(d, 'src'), '--no-self-check']);
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.match(r.stdout, /no test files under /);
    assert.doesNotMatch(r.stdout + r.stderr, /no binding test/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('CLI: a file as the positional path says so and points at --files=, instead of "path not found"', () => {
  const d = project(SPLIT);
  try {
    const r = run([join(d, 'src', 'a.mjs')]);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /is a file/);
    assert.match(r.stderr, /--files=/);
    assert.doesNotMatch(r.stderr, /path not found/);
    const missing = run([join(d, 'nope')]);
    assert.equal(missing.status, 2);
    assert.match(missing.stderr, /path not found/, 'a genuinely absent path keeps its message');
  } finally { rmSync(d, { recursive: true, force: true }); }
});
