'use strict';

/**
 * Projects kelp frond length after a number of days of growth, given a
 * daily growth rate in centimetres and a maximum tank height cap.
 */
function projectedLengthCm(startLengthCm, dailyGrowthCm, days, tankHeightCm) {
  const grown = startLengthCm + dailyGrowthCm * days;
  return Math.min(grown, tankHeightCm);
}

module.exports = { projectedLengthCm };
