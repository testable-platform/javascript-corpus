'use strict';

/**
 * Evaluates whether a tank's measured water chemistry falls inside the
 * safe range for kelp cultivation.
 */
function isWithinSafeRange(ph, salinityPpt, temperatureC) {
  const phOk = ph >= 7.5 && ph <= 8.4;
  const salinityOk = salinityPpt >= 30 && salinityPpt <= 37;
  const temperatureOk = temperatureC >= 8 && temperatureC <= 15;
  return phOk && salinityOk && temperatureOk;
}

module.exports = { isWithinSafeRange };
