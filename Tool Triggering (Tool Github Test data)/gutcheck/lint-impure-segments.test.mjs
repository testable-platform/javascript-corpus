import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detect, runEnv } from '../checker/kinds/assertionConsistency.mjs';

// assertionConsistency's impure-name rule matched SUBSTRINGS: `validate` was exempt through `date`,
// `counterClockwise` through `clock`, `download` through `load`, `profile` through `file` — genuinely
// pure functions whose contradictions were never flagged. The rule now tests each camelCase / snake
// segment of the callee as a whole word. Oracle: the shipped floor's own assertion shape; a
// contradiction on a pure function must flag, a call whose NAME carries an impure word must not.

const env = runEnv({ params: {
  lang: 'typescript',
  assertionSrcs: ['expect\\(\\s*([A-Za-z_][\\w.]*\\([^()]*\\))\\s*\\)\\.(?:toBe|toEqual|toStrictEqual)\\(\\s*([^)]+?)\\s*\\)'],
} });
const contradiction = (call) => `test('t', () => {\n  expect(${call}).toBe(1);\n  expect(${call}).toBe(2);\n});`;

test('a pure function whose name merely CONTAINS an impure word still flags: validate, counterClockwise, download, profile', () => {
  for (const call of ["validate('x')", 'counterClockwise(90)', "download('a')", "profile('u')", 'unknownCount(1)']) {
    assert.equal(detect(contradiction(call), env).length, 1, call);
  }
});

test('a call whose name carries an impure word as a segment stays exempt: readFile, Date.now, currentUser, Math.random, datetime', () => {
  for (const call of ["readFile('a')", 'Date.now(1)', 'currentUser(1)', 'Math.random(1)', 'datetime(1)', 'getEnv("X")', 'load_config(1)']) {
    assert.equal(detect(contradiction(call), env).length, 0, call);
  }
});
