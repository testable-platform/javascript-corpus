// oyster bed leases - minimal program, node24
const oysterBedLeasesReading24 = Object.freeze({
  carried: 55,
  total: 51,
});

const renderOysterBedLeases24 = () =>
  `oyster bed leases holds ${oysterBedLeasesReading24.total} of ${oysterBedLeasesReading24.carried}`;

module.exports = { renderOysterBedLeases24 };
