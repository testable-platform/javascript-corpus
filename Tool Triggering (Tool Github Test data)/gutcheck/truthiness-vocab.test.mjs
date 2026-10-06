import test from 'node:test';
import assert from 'node:assert/strict';
import { directOperandCall, pinnedFragmentsByKind } from '../mutation/parse-utils.mjs';

test('directOperandCall admits bare and negated calls', () => {
  assert.equal(directOperandCall('isAdult(21)'), 'isAdult(21)');
  assert.equal(directOperandCall('!isAdult(15)'), 'isAdult(15)');
  assert.equal(directOperandCall('  !!ready()  '), 'ready()');
  assert.equal(directOperandCall('g(f())'), 'g(f())'); // outer call spans whole operand
});

test('directOperandCall rejects buried operands (the false-HOLLOW guard)', () => {
  assert.equal(directOperandCall('f(x) !== undefined'), null);
  assert.equal(directOperandCall('f(x).length'), null);
  assert.equal(directOperandCall('f() && g()'), null);
  assert.equal(directOperandCall('x'), null);           // bare var, no call
  assert.equal(directOperandCall('f(x) === true'), null);
});

test('pinnedFragmentsByKind exposes an (empty) bool bucket', () => {
  const k = pinnedFragmentsByKind('expect(taxDue(1)).toBe(2);');
  assert.ok(Array.isArray(k.bool));
  assert.deepEqual(k.bool, []);
});

test('expect().toBeTruthy()/.toBeFalsy() push direct-operand calls into bool', () => {
  const k = pinnedFragmentsByKind('expect(valid(3)).toBeTruthy(); expect(bad(0)).toBeFalsy();');
  assert.deepEqual(k.bool.sort(), ['bad(0)', 'valid(3)'].sort());
});

test('expect().toBeTruthy() stays out of bool when the operand is buried (false-HOLLOW guard)', () => {
  const k = pinnedFragmentsByKind('expect(make() !== null).toBeTruthy();');
  assert.deepEqual(k.bool, []);
});

test('expect(f()).toBe(true) is untouched: still value-pinned, not bool', () => {
  const k = pinnedFragmentsByKind('expect(f()).toBe(true);');
  assert.ok(k.value.some((v) => v.includes('f()')));
  assert.deepEqual(k.bool, []);
});

// ---- Task 6: chai to.be.true/.false/.ok and should.be.true/.ok push bool pins ----
test('expect(f()).to.be.true / .to.be.ok push direct-operand calls into bool', () => {
  const k = pinnedFragmentsByKind('expect(valid(3)).to.be.true; expect(open()).to.be.ok;');
  assert.ok(k.bool.includes('valid(3)') && k.bool.includes('open()'));
});
test('X.should.be.true pushes the direct-operand receiver into bool', () => {
  const k = pinnedFragmentsByKind('valid(3).should.be.true;');
  assert.ok(k.bool.includes('valid(3)'));
});
test('X.should.be.ok pushes the direct-operand receiver into bool', () => {
  const k = pinnedFragmentsByKind('open().should.be.ok;');
  assert.ok(k.bool.includes('open()'));
});
test('expect(f() !== null).to.be.true stays out of bool (buried operand, false-HOLLOW guard)', () => {
  const k = pinnedFragmentsByKind('expect(f() !== null).to.be.true;');
  assert.deepEqual(k.bool, []);
});
test('(f() !== null).should.be.true stays out of bool (buried receiver, false-HOLLOW guard)', () => {
  const k = pinnedFragmentsByKind('(f() !== null).should.be.true;');
  assert.deepEqual(k.bool, []);
});
test('expect(f()).to.be.above(0) is NOT a bool pin — stays relational, CHAI_BOOL word-boundary does not intercept', () => {
  const k = pinnedFragmentsByKind('expect(f()).to.be.above(0);');
  assert.deepEqual(k.bool, []);
  assert.ok(k.relational.some((v) => v.includes('f()')));
});
test('expect(f()).to.be.false and X.should.be.false push direct-operand calls into bool', () => {
  const k = pinnedFragmentsByKind('expect(valid(3)).to.be.false;');
  assert.ok(k.bool.includes('valid(3)'));
  const k2 = pinnedFragmentsByKind('valid(3).should.be.false;');
  assert.ok(k2.bool.includes('valid(3)'));
});
