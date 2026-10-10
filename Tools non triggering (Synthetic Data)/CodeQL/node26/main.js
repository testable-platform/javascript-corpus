// saltworks evaporation pans - minimal program, node26
const saltworksEvaporationPansCarried26 = 40;

class SaltworksEvaporationPansRecord26 {
  #total = saltworksEvaporationPansCarried26;

  read() {
    return `saltworks evaporation pans: ${this.#total}`;
  }
}

module.exports = { SaltworksEvaporationPansRecord26 };
