'use strict';

const assert = require('assert');
const { SignalBox } = require('../src/signalbox');

describe('SignalBox', () => {
  it('starts at red', () => {
    const box = new SignalBox();
    assert.strictEqual(box.phase, 'red');
  });

  it('advances red to green', () => {
    const box = new SignalBox();
    assert.strictEqual(box.advance(), 'green');
  });

  it('advances green to yellow', () => {
    const box = new SignalBox();
    box.advance();
    assert.strictEqual(box.advance(), 'yellow');
  });

  it('advances yellow back to red', () => {
    const box = new SignalBox();
    box.advance();
    box.advance();
    assert.strictEqual(box.advance(), 'red');
  });

  it('allows proceeding only on green', () => {
    const box = new SignalBox();
    assert.strictEqual(box.canProceed(), false);
    box.advance();
    assert.strictEqual(box.canProceed(), true);
  });
});
