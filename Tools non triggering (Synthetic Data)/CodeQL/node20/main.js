// saltworks evaporation pans - minimal program, node20
const saltworksEvaporationPansOpening20 = 26;

class SaltworksEvaporationPansTally20 {
  get total() {
    return saltworksEvaporationPansOpening20;
  }

  summary() {
    return `saltworks evaporation pans: ${this.total}`;
  }
}

module.exports = { SaltworksEvaporationPansTally20 };
