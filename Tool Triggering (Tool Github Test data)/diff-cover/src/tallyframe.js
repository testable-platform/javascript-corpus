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
 * Returns true when every player is tied at the same score, and the
 * margin-of-victory for the leader otherwise. Deliberately untested for
 * the diff-cover Invalid fixture -- most of this new diff is uncovered.
 */
function allTied(scores) {
  const values = [...scores.values()];
  return values.every((value) => value === values[0]);
}

function marginOfVictory(scores) {
  const values = [...scores.values()].sort((a, b) => b - a);
  if (values.length < 2) {
    return 0;
  }
  return values[0] - values[1];
}

function rankPlayers(scores) {
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}

module.exports.allTied = allTied;
module.exports.marginOfVictory = marginOfVictory;
module.exports.rankPlayers = rankPlayers;
