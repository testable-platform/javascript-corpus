import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { prove, formatReport } from '../mutation/prove.mjs';

// The whole-repo denominator (Move 3): a bare scan classifies EVERY function in every src file the way
// a --since run classifies the changed ones — proven / hollow / unverifiable / untested — and the
// full-scan report gains that section beneath its unchanged test-verdict headline. Oracle: the fixture
// is built so each function's status is known by hand (a value pin binds `add`; no test names
// `ghost`; a no-pin test names `weak`).

const GUT = resolve('mutation/gutcheck.mjs');
const head = "import { test } from 'node:test'; import assert from 'node:assert';";
function project(files) {
  const d = mkdtempSync(join(tmpdir(), 'gc-repo-denom-'));
  for (const [r, b] of Object.entries(files)) { const f = join(d, r); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, b); }
  return d;
}
const FIXTURE = {
  'package.json': '{"type":"module"}',
  'src/a.mjs': 'export function add(a, b) { return a + b; }\nexport function ghost(x) { return x; }\nexport function weak(x) { return { ok: x }; }\n',
  'test/a.test.mjs': `${head} import { add, weak } from '../src/a.mjs';\ntest('adds', () => { assert.strictEqual(add(2, 3), 5); });\ntest('weak shape', () => { assert.ok(weak(1).ok !== undefined); });\n`,
};

test('a bare scan classifies every src function (scope: repo); --since keeps scope: diff; a --files run has none', () => {
  const d = project(FIXTURE);
  try {
    const r = prove(d, { runner: 'node' });
    assert.equal(r.changeSummary && r.changeSummary.scope, 'repo');
    assert.equal(r.changeSummary.fns, 3);
    const by = Object.fromEntries(r.changes.map((c) => [c.fn, c.status]));
    // Execution denominator: `weak`'s check `weak(1).ok !== undefined` goes red when weak returns 987654321
    // ((987654321).ok is undefined) → proven via execution; ghost is imported by nobody → untested.
    assert.deepEqual(by, { add: 'proven', ghost: 'untested', weak: 'proven' });
    assert.equal(r.changes.find((c) => c.fn === 'weak').evidence.via, 'execution');
    execSync('git init -q && git add -A && git -c user.email=a@b.c -c user.name=t commit -qm init', { cwd: d });
    writeFileSync(join(d, 'src/a.mjs'), FIXTURE['src/a.mjs'].replace('return x; }', 'return x; } // touched'));
    const rs = prove(d, { runner: 'node', since: 'HEAD' });
    assert.equal(rs.changeSummary.scope, 'diff');
    const rf = prove(d, { runner: 'node', files: ['a.test.mjs'] });
    assert.equal(rf.changeSummary, null, 'a partial scope cannot claim a repo-wide denominator');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('the full-scan report keeps its headline and adds the per-function section; the CLI prints banner then section', () => {
  const d = project(FIXTURE);
  try {
    const r = prove(d, { runner: 'node' });
    const out = formatReport(r);
    assert.match(out, /^gutcheck: verdicts on 1 of 2 tests \(50%\) — 1\/1 \(100%\) fail when the function they test is broken\./m, 'test-verdict headline unchanged');
    assert.match(out, /^gutcheck: 3 functions in this repo — 2 proven, 1 untested, 0 hollow\.$/m);
    assert.match(out, /untested — no test executes it \(1\):\n  ghost/);
    assert.doesNotMatch(out, /unverifiable —/, 'weak is proven by execution, nothing is unverifiable');
    const cli = spawnSync(process.execPath, [GUT, d, '--runner=node', '--no-self-check'], { encoding: 'utf8' });
    assert.equal(cli.status, 0);
    assert.match(cli.stdout, /probed \d+ function/, 'banner still first');
    assert.match(cli.stdout, /3 functions in this repo/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('the diff report is byte-identical in wording: "in this diff", never "in this repo"', () => {
  const d = project(FIXTURE);
  try {
    execSync('git init -q && git add -A && git -c user.email=a@b.c -c user.name=t commit -qm init', { cwd: d });
    writeFileSync(join(d, 'src/a.mjs'), FIXTURE['src/a.mjs'].replace('return x; }', 'return x; } // touched'));
    const r = prove(d, { runner: 'node', since: 'HEAD' });
    const out = formatReport(r);
    assert.match(out, /functions? in this diff/);
    assert.doesNotMatch(out, /in this repo/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});
