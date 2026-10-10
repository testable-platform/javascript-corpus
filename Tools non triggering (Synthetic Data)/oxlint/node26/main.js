// malt floor turnings - minimal program, node26
const maltFloorTurningsCarried26 = 100;

class MaltFloorTurningsRecord26 {
  #total = maltFloorTurningsCarried26;

  read() {
    return `malt floor turnings: ${this.#total}`;
  }
}

module.exports = { MaltFloorTurningsRecord26 };
