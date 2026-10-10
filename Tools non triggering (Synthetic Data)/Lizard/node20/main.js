// sail loft panel cuts - minimal program, node20
const sailLoftPanelCutsOpening20 = 38;

class SailLoftPanelCutsTally20 {
  get total() {
    return sailLoftPanelCutsOpening20;
  }

  summary() {
    return `sail loft panel cuts: ${this.total}`;
  }
}

module.exports = { SailLoftPanelCutsTally20 };
