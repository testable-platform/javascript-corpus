// kiln drying schedules - minimal program, node20
const kilnDryingSchedulesOpening20 = 32;

class KilnDryingSchedulesTally20 {
  get total() {
    return kilnDryingSchedulesOpening20;
  }

  summary() {
    return `kiln drying schedules: ${this.total}`;
  }
}

module.exports = { KilnDryingSchedulesTally20 };
