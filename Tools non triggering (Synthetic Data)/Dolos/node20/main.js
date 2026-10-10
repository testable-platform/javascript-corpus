// peat cutting allocations - minimal program, node20
const peatCuttingAllocationsOpening20 = 29;

class PeatCuttingAllocationsTally20 {
  get total() {
    return peatCuttingAllocationsOpening20;
  }

  summary() {
    return `peat cutting allocations: ${this.total}`;
  }
}

module.exports = { PeatCuttingAllocationsTally20 };
