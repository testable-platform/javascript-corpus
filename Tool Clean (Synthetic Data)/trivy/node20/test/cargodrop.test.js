'use strict';

const assert = require('assert');
const { CargoDrop } = require('../src/cargodrop');

describe('CargoDrop', () => {
  it('assigns docks round robin', () => {
    const yard = new CargoDrop(2);
    assert.strictEqual(yard.scheduleDrop('A'), 0);
    assert.strictEqual(yard.scheduleDrop('B'), 1);
    assert.strictEqual(yard.scheduleDrop('C'), 0);
  });

  it('lists drops on a given dock', () => {
    const yard = new CargoDrop(2);
    yard.scheduleDrop('A');
    yard.scheduleDrop('B');
    assert.strictEqual(yard.dropsOnDock(0).length, 1);
  });

  it('rejects a non-positive dock count', () => {
    assert.throws(() => new CargoDrop(0), RangeError);
  });
});
