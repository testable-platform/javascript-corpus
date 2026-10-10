// kiln drying schedules - minimal program, node24
const kilnDryingSchedulesReading24 = Object.freeze({
  carried: 43,
  total: 39,
});

const renderKilnDryingSchedules24 = () =>
  `kiln drying schedules holds ${kilnDryingSchedulesReading24.total} of ${kilnDryingSchedulesReading24.carried}`;

module.exports = { renderKilnDryingSchedules24 };
