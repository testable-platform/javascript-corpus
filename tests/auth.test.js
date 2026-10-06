'use strict';

const assert = require('assert');
const { authorize } = require('../src/auth');

describe('auth', function () {
  it('blocks viewers from writing', function () {
    const decision = authorize({ role: 'viewer' }, 'write');
    assert.strictEqual(decision.allowed, false);
  });

  it('allows editors to write', function () {
    const decision = authorize({ role: 'editor' }, 'write');
    assert.strictEqual(decision.allowed, true);
  });

  it('rejects an unknown actor', function () {
    const decision = authorize(null, 'write');
    assert.strictEqual(decision.allowed, false);
    assert.strictEqual(decision.reason, 'unknown-actor');
  });
});
