'use strict';

const OVERTIME_MULTIPLIER = 1.5;
const STANDARD_HOURS = 40;

/**
 * Computes gross pay in cents, with an overtime multiplier and a holiday
 * bonus path that this folder's tests never exercise (for the nyc Invalid
 * fixture -- majority of branches left untested).
 */
function grossPayCents(hoursWorked, hourlyRateCents, isHoliday) {
  if (isHoliday) {
    return Math.round(hoursWorked * hourlyRateCents * 2);
  }
  if (hoursWorked <= STANDARD_HOURS) {
    return Math.round(hoursWorked * hourlyRateCents);
  }
  const standardPay = STANDARD_HOURS * hourlyRateCents;
  const overtimeHours = hoursWorked - STANDARD_HOURS;
  const overtimePay = overtimeHours * hourlyRateCents * OVERTIME_MULTIPLIER;
  return Math.round(standardPay + overtimePay);
}

module.exports = { grossPayCents, OVERTIME_MULTIPLIER, STANDARD_HOURS };
