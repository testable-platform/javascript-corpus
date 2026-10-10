// flax retting ponds - minimal program, node24
const flaxRettingPondsReading24 = Object.freeze({
  carried: 64,
  total: 60,
});

const renderFlaxRettingPonds24 = () =>
  `flax retting ponds holds ${flaxRettingPondsReading24.total} of ${flaxRettingPondsReading24.carried}`;

module.exports = { renderFlaxRettingPonds24 };
