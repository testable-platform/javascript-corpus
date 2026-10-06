'use strict';

const assert = require('assert');
const { LibraStack } = require('../src/librastack');

describe('LibraStack', () => {
  it('shelves a new title', () => {
    const stack = new LibraStack();
    assert.strictEqual(stack.shelve('QA76.1', 'Algorithms'), true);
  });

  it('rejects a duplicate call number', () => {
    const stack = new LibraStack();
    stack.shelve('QA76.1', 'Algorithms');
    assert.strictEqual(stack.shelve('QA76.1', 'Other Book'), false);
  });

  it('returns null for a missing entry', () => {
    const stack = new LibraStack();
    assert.strictEqual(stack.find('ZZ9.9'), null);
  });

  it('counts shelved items correctly', () => {
    const stack = new LibraStack();
    stack.shelve('QA76.1', 'Algorithms');
    stack.shelve('QA76.2', 'Data Structures');
    assert.strictEqual(stack.count(), 2);
  });

  it('actually removes an entry', () => {
    const stack = new LibraStack();
    stack.shelve('QA76.1', 'Algorithms');
    stack.remove('QA76.1');
    assert.strictEqual(stack.find('QA76.1'), null);
  });
});
