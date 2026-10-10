// oyster bed leases - minimal program, node20
const oysterBedLeasesOpening20 = 44;

class OysterBedLeasesTally20 {
  get total() {
    return oysterBedLeasesOpening20;
  }

  summary() {
    return `oyster bed leases: ${this.total}`;
  }
}

module.exports = { OysterBedLeasesTally20 };
