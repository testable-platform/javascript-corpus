'use strict';

const AIR_DENSITY = 1.225;

/**
 * Estimates power output in watts from wind speed and blade sweep area,
 * clamped by a turbine's rated capacity.
 */
function estimatePowerWatts(windSpeedMs, sweepAreaM2, efficiency, ratedCapacityW) {
  if (windSpeedMs <= 0) {
    return 0;
  }
  const rawPower = 0.5 * AIR_DENSITY * sweepAreaM2 * Math.pow(windSpeedMs, 3) * efficiency;
  if (rawPower >= ratedCapacityW) {
    return ratedCapacityW;
  }
  return Math.round(rawPower);
}

/**
 * Classifies a wind speed into a simple operating category.
 */
function classifySpeed(windSpeedMs) {
  if (windSpeedMs < 3) {
    return 'idle';
  }
  if (windSpeedMs < 12) {
    return 'generating';
  }
  if (windSpeedMs < 25) {
    return 'high-output';
  }
  return 'shutdown';
}

module.exports = { estimatePowerWatts, classifySpeed };
