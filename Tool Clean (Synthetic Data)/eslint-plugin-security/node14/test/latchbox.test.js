'use strict';

const assert = require('assert');
const { LatchBox } = require('../src/latchbox');

describe('LatchBox', () => {
  it('starts locked', () => {
    const box = new LatchBox(4);
    assert.strictEqual(box.isLocked(), true);
  });

  it('opens with the correct combination', () => {
    const box = new LatchBox(4);
    const opened = box.tryOpen(box.combination);
    assert.strictEqual(opened, true);
    assert.strictEqual(box.isLocked(), false);
  });

  it('rejects a wrong-length candidate', () => {
    const box = new LatchBox(4);
    assert.strictEqual(box.tryOpen('12'), false);
  });

  it('rejects an incorrect combination', () => {
    const box = new LatchBox(4);
    const wrong = box.combination === '0000' ? '1111' : '0000';
    assert.strictEqual(box.tryOpen(wrong), false);
  });
});
