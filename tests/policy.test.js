'use strict';

const assert = require('assert');
const { evaluatePolicy, canTransition } = require('../src/policy');
const { toProductId } = require('../src/ids');

describe('policy', function () {
  const id = toProductId(1);

  it('lets owners do anything', function () {
    const decision = evaluatePolicy({ id, status: 'draft' }, 'owner');
    assert.strictEqual(decision.allowed, true);
  });

  it('blocks editors on archived records', function () {
    const decision = evaluatePolicy({ id, status: 'archived' }, 'editor');
    assert.strictEqual(decision.allowed, false);
  });

  it('only lets viewers read published records', function () {
    const decision = evaluatePolicy({ id, status: 'draft' }, 'viewer');
    assert.strictEqual(decision.allowed, false);
  });

  it('validates status transitions', function () {
    assert.strictEqual(canTransition('draft', 'published'), true);
    assert.strictEqual(canTransition('published', 'draft'), false);
    assert.strictEqual(canTransition('archived', 'published'), false);
  });
});
