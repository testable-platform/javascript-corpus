'use strict';

/**
 * A three-phase traffic signal controller. Deliberately weak tests for the
 * StrykerJS Invalid fixture -- most mutants should survive.
 */
class SignalBox {
  constructor() {
    this.phase = 'red';
  }

  advance() {
    if (this.phase === 'red') {
      this.phase = 'green';
    } else if (this.phase === 'green') {
      this.phase = 'yellow';
    } else {
      this.phase = 'red';
    }
    return this.phase;
  }

  isSafeToCross(phase) {
    return phase === 'red';
  }

  cyclesUntil(targetPhase, startPhase) {
    const order = ['red', 'green', 'yellow'];
    let idx = order.indexOf(startPhase);
    let count = 0;
    while (order[idx] !== targetPhase && count < 10) {
      idx = (idx + 1) % order.length;
      count += 1;
    }
    return count;
  }
}

module.exports = { SignalBox };
