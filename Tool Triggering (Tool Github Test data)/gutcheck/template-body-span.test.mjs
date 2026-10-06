import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { grossBreak } from '../mutation/probe.mjs';
import { prove } from '../mutation/prove.mjs';

// An expression body that IS (or contains) a multi-line literal — a template literal, a Kotlin raw
// string, a block comment spanning lines. codeOnly blanks the literal but keeps its interior newlines,
// so the depth-0 newline scan in arrowSite/kotlinExprSite ended the expression mid-literal: a PARTIAL
// gut, a syntactically broken mutant, a crash on import — and a tautology test read "proven" off the
// crash (a live false PROVEN, reproduced 2026-09-01). The lexer knows exactly where those literals are;
// the site scanners now ask it. Oracle: the mutant text a whole-expression gut must produce, written
// by hand from the sentinel table — never the scanner's own output.

function project(files) {
  const d = mkdtempSync(join(tmpdir(), 'gc-tpl-'));
  for (const [r, b] of Object.entries(files)) { const f = join(d, r); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, b); }
  return d;
}
const head = "import { test } from 'node:test'; import assert from 'node:assert';";
const nlIndices = (s) => [...s].map((c, i) => (c === '\n' ? i : -1)).filter((i) => i >= 0);

test('literalNewlines: newlines inside block comments, templates and multi-line strings — never a line comment\'s own newline', async () => {
  const { literalNewlines } = await import('../checker/lexer.mjs');
  const js = 'a // c\nb /* x\ny */ c `t\nu` d\n';
  const nl = literalNewlines(js, 'typescript');
  assert.deepEqual(nlIndices(js).map((i) => nl.has(i)), [false, true, true, false]);
  const kt = 'val s = """a\nb"""\nval t = 1\n';
  const nk = literalNewlines(kt, 'kotlin');
  assert.deepEqual(nlIndices(kt).map((i) => nk.has(i)), [true, false, false]);
  const py = 'x = """a\nb"""\ny = 1\n';
  assert.deepEqual(nlIndices(py).map((i) => literalNewlines(py, 'python').has(i)), [true, false, false]);
});

test('grossBreak: an arrow whose body is a multi-line template literal is gutted whole', () => {
  const src = 'export const f = (x) => `line1\n${x}\nline3`;\nexport const g = (y) => y + 1;\n';
  assert.equal(grossBreak(src, 'f', 'typescript'), 'export const f = (x) => 987654321;\nexport const g = (y) => y + 1;\n');
});

test('grossBreak: an arrow body containing a block comment that spans lines is gutted whole', () => {
  const src = 'export const f = (x) => x /* a\n b */ + 1;\n';
  assert.equal(grossBreak(src, 'f', 'typescript'), 'export const f = (x) => 987654321;\n');
});

test('grossBreak: a trailing line comment still ends the expression — no over-run into the next declaration', () => {
  const src = 'export const f = () => 1 // one\nexport const g = () => 2\n';
  const out = grossBreak(src, 'f', 'typescript');
  assert.match(out, /^export const f = \(\) => 987654321\n/);
  assert.ok(out.endsWith('export const g = () => 2\n'), out);
});

test('grossBreak: a Kotlin expression body that is a multi-line raw string is gutted whole', () => {
  const src = 'fun f(x: Int): String = """a\n$x\nb"""\nfun g(): Int = 2\n';
  assert.equal(grossBreak(src, 'f', 'kotlin'), 'fun f(x: Int): String = "__gutcheck_987654321__"\nfun g(): Int = 2\n');
});

const TEMPLATE_SUT = { 'package.json': '{"type":"module"}', 'src/f.mjs': 'export const f = (x) => `line1\n${x}\nline3`;\n' };

test('prove(): a tautology over a template-literal arrow is HOLLOW — never proven by a crash', () => {
  const d = project({ ...TEMPLATE_SUT, 'test/t.test.mjs': `${head} import { f } from '../src/f.mjs';\ntest('tautology', () => { assert.strictEqual(f('a'), f('a')); });\n` });
  try {
    const r = prove(d, { runner: 'node' });
    assert.equal(r.hollow.length, 1, JSON.stringify(r.inconclusive));
    assert.equal(r.caught, 0);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('prove(): a sound value pin over the same template-literal arrow is PROVEN', () => {
  const d = project({ ...TEMPLATE_SUT, 'test/t.test.mjs': `${head} import { f } from '../src/f.mjs';\ntest('pins the text', () => { assert.strictEqual(f('a'), 'line1\\na\\nline3'); });\n` });
  try {
    const r = prove(d, { runner: 'node' });
    assert.equal(r.caught, 1, JSON.stringify(r.inconclusive));
    assert.equal(r.hollow.length, 0);
  } finally { rmSync(d, { recursive: true, force: true }); }
});
