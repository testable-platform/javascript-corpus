'use strict';

const assert = require('assert');
const { Beacon } = require('../src/beacon');

describe('Beacon', () => {
  it('computes expected flash count', () => {
    const beacon = new Beacon(1000);
    assert.strictEqual(beacon.expectedFlashCount(5000), 6);
  });
});
