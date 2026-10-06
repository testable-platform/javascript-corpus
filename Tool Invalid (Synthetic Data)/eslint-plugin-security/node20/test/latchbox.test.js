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
  });
});
