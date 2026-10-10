// dye vat batches - minimal program, node20
const dyeVatBatchesOpening20 = 59;

class DyeVatBatchesTally20 {
  get total() {
    return dyeVatBatchesOpening20;
  }

  summary() {
    return `dye vat batches: ${this.total}`;
  }
}

module.exports = { DyeVatBatchesTally20 };
