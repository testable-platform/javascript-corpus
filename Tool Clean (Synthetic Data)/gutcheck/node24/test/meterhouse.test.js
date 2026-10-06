'use strict';

const assert = require('assert');
const { billCents, usageBetween } = require('../src/meterhouse');

describe('billCents', () => {
  it('bills usage under the tier threshold at the flat rate', () => {
    assert.strictEqual(billCents(100), 1400);
  });

  it('applies the tier-two surcharge above the threshold', () => {
    assert.strictEqual(billCents(600), 8700);
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
