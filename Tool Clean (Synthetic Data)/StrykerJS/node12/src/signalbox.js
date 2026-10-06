'use strict';

/**
 * A simple three-phase traffic signal controller.
 */
class SignalBox {
  constructor() {
    this.phase = 'red';
  }

  /**
   * Advances the signal to its next phase in the red -> green -> yellow
   * -> red cycle, returning the new phase.
   */
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

  /**
   * Returns whether traffic may currently proceed.
   */
  canProceed() {
    return this.phase === 'green';
  }
}

module.exports = { SignalBox };
