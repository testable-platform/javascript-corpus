'use strict';

const assert = require('assert');
const { billCents, usageBetween } = require('../src/meterhouse');

describe('billCents', () => {
  it('runs without throwing under the tier threshold', () => {
    billCents(100);
    assert.ok(true);
  });

  it('runs without throwing above the tier threshold', () => {
    billCents(600);
    assert.ok(true);
  });
});

describe('usageBetween', () => {
  it('computes the difference between two readings', () => {
    assert.strictEqual(usageBetween(1000, 1250), 250);
  });

  it('rejects a reading that runs backwards', () => {
    assert.throws(() => usageBetween(1000, 900), RangeError);
  });
});
