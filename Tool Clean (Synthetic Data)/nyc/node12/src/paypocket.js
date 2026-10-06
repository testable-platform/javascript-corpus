'use strict';

const OVERTIME_MULTIPLIER = 1.5;
const STANDARD_HOURS = 40;

/**
 * Computes gross pay in cents given hours worked and an hourly rate in
 * cents, applying an overtime multiplier past the standard week.
 */
function grossPayCents(hoursWorked, hourlyRateCents) {
  if (hoursWorked <= STANDARD_HOURS) {
    return Math.round(hoursWorked * hourlyRateCents);
  }
  const standardPay = STANDARD_HOURS * hourlyRateCents;
  const overtimeHours = hoursWorked - STANDARD_HOURS;
  const overtimePay = overtimeHours * hourlyRateCents * OVERTIME_MULTIPLIER;
  return Math.round(standardPay + overtimePay);
}

module.exports = { grossPayCents, OVERTIME_MULTIPLIER, STANDARD_HOURS };
