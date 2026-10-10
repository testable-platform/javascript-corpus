// malt floor turnings - minimal program, node20
const maltFloorTurningsOpening20 = 86;

class MaltFloorTurningsTally20 {
  get total() {
    return maltFloorTurningsOpening20;
  }

  summary() {
    return `malt floor turnings: ${this.total}`;
  }
}

module.exports = { MaltFloorTurningsTally20 };
