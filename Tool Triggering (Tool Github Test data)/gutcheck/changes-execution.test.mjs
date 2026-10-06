import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyChanges } from '../mutation/changes.mjs';

// Hand-built records. Precedence under test (spec: The claim): hollow → pin-proven → one-sided (--deep) →
// execution result → untested. Every expected status below is derived from the tables, not from output.
const byFile = [{ file: 'src/m.mjs', granularity: 'file', decls: [
  { fn: 'pinned', line: 1 }, { fn: 'hol', line: 2 }, { fn: 'exec', line: 3 }, { fn: 'quiet', line: 4 }, { fn: 'empty', line: 5 }, { fn: 'ghost', line: 6 }, { fn: 'named', line: 7 }, { fn: 'sided', line: 8 },
] }];
const blockRecords = [
  { file: 't.test.mjs', line: 1, name: 'a', bodyMasked: 'pinned()', verdict: 'caught', caughtFns: ['pinned'], caughtPairs: [{ fn: 'pinned', sutRel: 'src/m.mjs' }], survivors: [], survivorPairs: [], testChanged: false },
  { file: 't.test.mjs', line: 2, name: 'b', bodyMasked: 'hol()', verdict: 'hollow', survivors: ['hol'], survivorPairs: [{ fn: 'hol', sutRel: 'src/m.mjs' }] },
  { file: 't.test.mjs', line: 3, name: 'c', bodyMasked: 'named() mocked', verdict: 'skipped', why: 'no-pin' },
  { file: 't.test.mjs', line: 4, name: 'd', bodyMasked: 'sided()', verdict: 'one-sided', oneSidedPairs: [{ fn: 'sided', sutRel: 'src/m.mjs' }] },
];
const execution = {
  denominator: 'execution',
  execBy: new Map([
    ['src/m.mjs::pinned', new Set(['t.test.mjs'])], ['src/m.mjs::hol', new Set(['t.test.mjs'])],
    ['src/m.mjs::exec', new Set(['t.test.mjs', 'u.test.mjs'])], ['src/m.mjs::quiet', new Set(['t.test.mjs'])],
    ['src/m.mjs::empty', new Set(['t.test.mjs'])], ['src/m.mjs::sided', new Set(['t.test.mjs'])],
  ]),
  baselines: new Map(),
  results: new Map([
    ['src/m.mjs::exec', { status: 'proven', via: 'execution', executedBy: ['t.test.mjs', 'u.test.mjs'], redBy: ['u.test.mjs'], mutant: '987654321' }],
    ['src/m.mjs::quiet', { status: 'unnoticed', executedBy: ['t.test.mjs'], mutants: ['987654321', 'undefined'] }],
    ['src/m.mjs::empty', { status: 'unverifiable', why: 'no-distinct-mutant', executedBy: ['t.test.mjs'] }],
    ['src/m.mjs::sided', { status: 'proven', via: 'execution', executedBy: ['t.test.mjs'], redBy: ['t.test.mjs'], mutant: '987654321' }],
  ]),
  changedTestRels: new Set(['u.test.mjs']),
};

test('classifyChanges with execution: precedence and evidence shapes', () => {
  const { changes, changeSummary } = classifyChanges(byFile, blockRecords, { scope: 'diff', execution });
  const by = Object.fromEntries(changes.map((c) => [c.fn, c]));
  assert.equal(by.pinned.status, 'proven'); assert.equal(by.pinned.evidence.via, 'pin');
  assert.equal(by.hol.status, 'hollow', 'a hollow block stays a hollow row even though execution also ran it');
  assert.equal(by.exec.status, 'proven');
  assert.deepEqual(by.exec.evidence, { via: 'execution', executedBy: ['t.test.mjs', 'u.test.mjs'], redBy: ['u.test.mjs'], mutant: '987654321', sameDiffOracle: true });
  assert.equal(by.quiet.status, 'unnoticed'); assert.deepEqual(by.quiet.evidence.executedBy, ['t.test.mjs']);
  assert.equal(by.empty.status, 'unverifiable'); assert.equal(by.empty.evidence.reason, 'no-distinct-mutant');
  assert.equal(by.ghost.status, 'untested'); assert.deepEqual(by.ghost.evidence, {});
  assert.equal(by.named.status, 'untested', 'named by a test but never executed (mocked) is untested');
  assert.deepEqual(by.named.evidence.mentionedBy, [{ file: 't.test.mjs', line: 3, name: 'c' }]);
  assert.equal(by.sided.status, 'unverifiable'); assert.equal(by.sided.evidence.reason, 'one-sided', 'the --deep one-sided tier outranks execution');
  assert.equal(changeSummary.unnoticed, 1); assert.equal(changeSummary.untested, 2); assert.equal(changeSummary.proven, 2);
  assert.equal(changeSummary.denominator, 'execution');
});

test('classifyChanges without execution is byte-identical to today (denominator static)', () => {
  const { changes, changeSummary } = classifyChanges(byFile, blockRecords, { scope: 'diff' });
  const by = Object.fromEntries(changes.map((c) => [c.fn, c.status]));
  assert.equal(by.pinned, 'proven'); assert.equal(by.hol, 'hollow'); assert.equal(by.exec, 'untested'); assert.equal(by.named, 'unverifiable');
  assert.equal(changeSummary.denominator, 'static'); assert.equal(changeSummary.unnoticed, 0);
});
