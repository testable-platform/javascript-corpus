'use strict';

const assert = require('assert');
const { grossPayCents } = require('../src/paypocket');

describe('grossPayCents', () => {
  it('pays double on a holiday', () => {
    assert.strictEqual(grossPayCents(8, 2000, true), 32000);
  });
});
