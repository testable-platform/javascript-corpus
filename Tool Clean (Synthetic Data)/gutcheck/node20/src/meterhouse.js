'use strict';

const RATE_CENTS_PER_KWH = 14;
const TIER_TWO_THRESHOLD_KWH = 500;
const TIER_TWO_SURCHARGE_CENTS_PER_KWH = 3;

/**
 * Computes a utility bill in cents for the given kilowatt-hours consumed,
 * applying a tiered surcharge above a usage threshold.
 */
function billCents(kwhUsed) {
  if (kwhUsed <= TIER_TWO_THRESHOLD_KWH) {
    return kwhUsed * RATE_CENTS_PER_KWH;
  }
  const tierOne = TIER_TWO_THRESHOLD_KWH * RATE_CENTS_PER_KWH;
  const extraKwh = kwhUsed - TIER_TWO_THRESHOLD_KWH;
  const tierTwo = extraKwh * (RATE_CENTS_PER_KWH + TIER_TWO_SURCHARGE_CENTS_PER_KWH);
  return tierOne + tierTwo;
}

/**
 * Returns the difference in kilowatt-hours between two meter readings.
 */
function usageBetween(previousReadingKwh, currentReadingKwh) {
  if (currentReadingKwh < previousReadingKwh) {
    throw new RangeError('currentReadingKwh must not be less than previousReadingKwh');
  }
  return currentReadingKwh - previousReadingKwh;
}

module.exports = { billCents, usageBetween };
