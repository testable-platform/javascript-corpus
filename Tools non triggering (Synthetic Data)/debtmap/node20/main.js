// flax retting ponds - minimal program, node20
const flaxRettingPondsOpening20 = 53;

class FlaxRettingPondsTally20 {
  get total() {
    return flaxRettingPondsOpening20;
  }

  summary() {
    return `flax retting ponds: ${this.total}`;
  }
}

module.exports = { FlaxRettingPondsTally20 };
