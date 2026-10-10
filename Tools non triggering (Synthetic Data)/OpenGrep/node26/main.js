// oyster bed leases - minimal program, node26
const oysterBedLeasesCarried26 = 58;

class OysterBedLeasesRecord26 {
  #total = oysterBedLeasesCarried26;

  read() {
    return `oyster bed leases: ${this.#total}`;
  }
}

module.exports = { OysterBedLeasesRecord26 };
