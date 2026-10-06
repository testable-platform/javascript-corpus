// Curated high-risk JS shapes for the differential corpus (test/differential.test.mjs): each class
// here has produced a real fix or a unit regression test. Everything in this file must gut cleanly
// and mask cleanly against the real-parser oracle.
export const label = (n) =>
  n > 0
    ? 'pos'
    : 'neg';
export const slug = (s) =>
  s.toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
export const ok = (x) =>
  x > 0 &&
  x < 10;
export const compose = (f) => (g) =>
  (x) => f(g(x));
export function withRegex(s) { const re = /\{([^}]+)\}/; return re.test(s); }
export function withString() { const e = 'unmatched {'; return e.length; }
export function withTemplate(n) { return `count ${n} {literal}`; }
export const applyTwice = (fn = (x) => x + 1) => fn(fn(0));
export class Counter {
  #step = 2;
  bump = (n) => n + this.#step;
  compute(n) { return this.#square(n) + 1; }
  #square(n) { return n * n; }
}
export function inc(x) { return x + 1 }
export const asObject = (n) => ({ value: n, doubled: n * 2 });
export const isTestLike = (f) =>
  /\.test\./.test(f)
  || /\.spec\./.test(f)
  || f.includes('__tests__');
// Multi-line literals inside an expression body: the newline inside the template / block comment is not
// an expression boundary (arrowSite asks the lexer's literalNewlines) — a partial gut here once minted a
// false PROVEN off a crashed mutant.
export const banner = (name) => `hello
${name}
bye`;
export const commented = (x) => x /* a
  b */ + 1;
// A parenthesized initializer that is NOT an arrow: never enumerated, never gutted (locateBody's
// paren-start guard refuses; the next declaration must stay untouched under this name).
const flag = true;
export const pick = (flag ? Math.max : Math.min);
export const after = (n) => n + 1;
