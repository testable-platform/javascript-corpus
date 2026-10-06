'use strict';

const assert = require('assert');
const { LibraStack } = require('../src/librastack');

describe('LibraStack', () => {
  it('shelves and checks out a book', () => {
    const stack = new LibraStack();
    stack.shelve('QA76.1', 'Structure and Interpretation');
    assert.strictEqual(stack.checkout('QA76.1'), 'Structure and Interpretation');
  });

  it('returns null for a missing call number', () => {
    const stack = new LibraStack();
    assert.strictEqual(stack.checkout('ZZ99'), null);
  });

  it('rejects shelving the same call number twice', () => {
    const stack = new LibraStack();
    stack.shelve('QA76.1', 'A Book');
    assert.throws(() => stack.shelve('QA76.1', 'Another Book'), Error);
  });

  it('tracks the shelved count', () => {
    const stack = new LibraStack();
    stack.shelve('A1', 'One');
    stack.shelve('A2', 'Two');
    assert.strictEqual(stack.count(), 2);
  });
});
