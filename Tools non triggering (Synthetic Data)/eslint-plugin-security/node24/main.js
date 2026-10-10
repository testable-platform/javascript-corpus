// dye vat batches - minimal program, node24
const dyeVatBatchesReading24 = Object.freeze({
  carried: 70,
  total: 66,
});

const renderDyeVatBatches24 = () =>
  `dye vat batches holds ${dyeVatBatchesReading24.total} of ${dyeVatBatchesReading24.carried}`;

module.exports = { renderDyeVatBatches24 };
