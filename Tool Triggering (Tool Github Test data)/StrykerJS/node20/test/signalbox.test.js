'use strict';

const assert = require('assert');
const { SignalBox } = require('../src/signalbox');

describe('SignalBox', () => {
  it('runs advance without throwing', () => {
    const box = new SignalBox();
    box.advance();
    assert.ok(true);
  });

  it('runs isSafeToCross without throwing', () => {
    const box = new SignalBox();
    box.isSafeToCross('red');
    assert.ok(true);
  });

  it('runs cyclesUntil without throwing', () => {
    const box = new SignalBox();
    box.cyclesUntil('green', 'red');
    assert.ok(true);
  });
});
