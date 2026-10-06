'use strict';

const assert = require('assert');
const { grossPayCents } = require('../src/paypocket');

describe('grossPayCents', () => {
  it('pays standard hours with no overtime', () => {
    assert.strictEqual(grossPayCents(40, 2000), 80000);
  });

  it('applies the overtime multiplier past 40 hours', () => {
    assert.strictEqual(grossPayCents(45, 2000), 95000);
  });

  it('handles a partial standard week', () => {
    assert.strictEqual(grossPayCents(20, 2000), 40000);
  });
});
