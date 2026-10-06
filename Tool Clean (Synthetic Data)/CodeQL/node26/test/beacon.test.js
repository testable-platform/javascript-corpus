'use strict';

const assert = require('assert');
const { Beacon } = require('../src/beacon');

describe('Beacon', () => {
  it('records a flash and returns a unique id', () => {
    const beacon = new Beacon(1000);
    const id = beacon.flashAt(0);
    assert.strictEqual(typeof id, 'string');
  });

  it('computes the expected flash count', () => {
    const beacon = new Beacon(1000);
    assert.strictEqual(beacon.expectedFlashCount(4000), 5);
  });

  it('rejects a negative elapsed time', () => {
    const beacon = new Beacon(1000);
    assert.throws(() => beacon.flashAt(-1), RangeError);
  });
});
