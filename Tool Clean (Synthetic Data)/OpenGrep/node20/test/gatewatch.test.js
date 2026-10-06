'use strict';

const assert = require('assert');
const { GateWatch } = require('../src/gatewatch');

describe('GateWatch', () => {
  it('authorizes a known badge', () => {
    const gate = new GateWatch();
    assert.strictEqual(gate.isAuthorized('B-100'), true);
  });

  it('rejects an unknown badge', () => {
    const gate = new GateWatch();
    assert.strictEqual(gate.isAuthorized('B-999'), false);
  });

  it('issues a six-digit visitor code', () => {
    const gate = new GateWatch();
    const code = gate.issueVisitorCode();
    assert.strictEqual(/^\d{6}$/.test(code), true);
  });
});
