'use strict';

const assert = require('assert');
const { TallyFrame } = require('../src/tallyframe');

describe('TallyFrame', () => {
  it('adds points to a known player', () => {
    const frame = new TallyFrame(['Amara', 'Beno']);
    frame.addPoints('Amara', 10);
    assert.strictEqual(frame.scoreOf('Amara'), 10);
  });

  it('tracks the leader', () => {
    const frame = new TallyFrame(['Amara', 'Beno']);
    frame.addPoints('Amara', 10);
    frame.addPoints('Beno', 15);
    assert.strictEqual(frame.leader(), 'Beno');
  });

  it('rejects an unknown player', () => {
    const frame = new TallyFrame(['Amara']);
    assert.throws(() => frame.addPoints('Cass', 5), RangeError);
  });
});

const { allTied } = require('../src/tallyframe');

describe('allTied', () => {
  it('reports true when every score matches', () => {
    assert.strictEqual(allTied(new Map([['a', 5], ['b', 5]])), true);
  });

  it('reports false when scores differ', () => {
    assert.strictEqual(allTied(new Map([['a', 5], ['b', 6]])), false);
  });
});
