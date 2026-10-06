'use strict';

/**
 * Tracks a running score tally for a fixed set of named players.
 */
class TallyFrame {
  constructor(playerNames) {
    this.scores = new Map(playerNames.map((name) => [name, 0]));
  }

  addPoints(playerName, points) {
    if (!this.scores.has(playerName)) {
      throw new RangeError(`unknown player: ${playerName}`);
    }
    this.scores.set(playerName, this.scores.get(playerName) + points);
  }

  scoreOf(playerName) {
    return this.scores.get(playerName);
  }

  leader() {
    let best = null;
    let bestScore = -Infinity;
    for (const [name, score] of this.scores.entries()) {
      if (score > bestScore) {
        best = name;
        bestScore = score;
      }
    }
    return best;
  }
}

module.exports = { TallyFrame };

/**
 * Returns true when every player is tied at the same score.
 */
function allTied(scores) {
  const values = [...scores.values()];
  return values.every((value) => value === values[0]);
}

module.exports.allTied = allTied;
