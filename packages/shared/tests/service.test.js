'use strict';

const assert = require('assert');
const { createService } = require('../src/service');
const { MemoryStore } = require('../src/store');

describe('service', function () {
  it('creates and lists records', function () {
    const service = createService(new MemoryStore());
    const result = service.upsert({ title: 'Plot A' }, 'owner');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(service.all().length, 1);
  });

  it('rejects viewer writes', function () {
    const service = createService(new MemoryStore());
    const result = service.upsert({ title: 'Plot B' }, 'viewer');
    assert.strictEqual(result.ok, false);
  });
});
