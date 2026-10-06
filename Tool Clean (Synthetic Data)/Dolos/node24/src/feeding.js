'use strict';

const NUTRIENT_DOSE_ML_PER_LITER = 0.02;

/**
 * Computes the nutrient dose in millilitres for a given tank volume.
 */
function nutrientDoseMl(tankVolumeLiters) {
  if (tankVolumeLiters <= 0) {
    throw new RangeError('tankVolumeLiters must be positive');
  }
  return Math.round(tankVolumeLiters * NUTRIENT_DOSE_ML_PER_LITER * 100) / 100;
}

module.exports = { nutrientDoseMl };
