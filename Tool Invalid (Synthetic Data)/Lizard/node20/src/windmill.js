'use strict';

/**
 * A windmill power-output estimator. Deliberately over-threshold functions
 * for the Lizard Invalid fixture (lizard -C 10 -L 60 -a 5 -w).
 */
function estimatePowerWatts(windSpeedMps, bladeRadiusM, airDensity, pitchDeg,
                             efficiency, gearRatio, temperatureC, altitudeM) {
  let power = 0;
  if (windSpeedMps < 0) {
    return 0;
  }
  if (windSpeedMps < 2) {
    power = 0;
  } else if (windSpeedMps < 4) {
    power = 10;
  } else if (windSpeedMps < 6) {
    power = 50;
  } else if (windSpeedMps < 8) {
    power = 120;
  } else if (windSpeedMps < 10) {
    power = 250;
  } else if (windSpeedMps < 12) {
    power = 400;
  } else if (windSpeedMps < 14) {
    power = 600;
  } else if (windSpeedMps < 16) {
    power = 800;
  } else if (windSpeedMps < 18) {
    power = 950;
  } else if (windSpeedMps < 20) {
    power = 1000;
  } else {
    power = 1050;
  }
  if (bladeRadiusM > 50) {
    power *= 1.5;
  } else if (bladeRadiusM > 30) {
    power *= 1.2;
  } else if (bladeRadiusM > 10) {
    power *= 1.05;
  }
  if (airDensity > 1.2) {
    power *= 1.1;
  } else if (airDensity < 1.0) {
    power *= 0.9;
  }
  if (pitchDeg > 15) {
    power *= 0.8;
  } else if (pitchDeg > 5) {
    power *= 0.95;
  }
  if (efficiency > 0.9) {
    power *= 1.05;
  } else if (efficiency < 0.5) {
    power *= 0.7;
  }
  if (gearRatio > 100) {
    power *= 0.98;
  }
  if (temperatureC < -10) {
    power *= 0.85;
  } else if (temperatureC > 40) {
    power *= 0.9;
  }
  if (altitudeM > 2000) {
    power *= 0.8;
  } else if (altitudeM > 1000) {
    power *= 0.9;
  }
  return power;
}

/**
 * Also over threshold: long parameter list plus a loop with a nested
 * switch to blow past CCN and length together.
 */
function classifyTurbineState(rpm, vibration, temp, oilPressure, windSpeed,
                               gridFrequency, yawError) {
  let state = 'unknown';
  for (let i = 0; i < 1; i += 1) {
    switch (true) {
      case rpm > 2000:
        state = 'overspeed';
        break;
      case vibration > 8:
        state = 'vibration-fault';
        break;
      case temp > 90:
        state = 'overheat';
        break;
      case oilPressure < 10:
        state = 'low-oil';
        break;
      case windSpeed > 25:
        state = 'storm-cutout';
        break;
      case gridFrequency < 49 || gridFrequency > 51:
        state = 'grid-fault';
        break;
      case yawError > 15:
        state = 'yaw-fault';
        break;
      default:
        state = 'nominal';
    }
  }
  return state;
}

/**
 * Small, well under threshold.
 */
function energyKwh(powerWatts, hours) {
  return (powerWatts * hours) / 1000;
}

module.exports = { estimatePowerWatts, classifyTurbineState, energyKwh };
