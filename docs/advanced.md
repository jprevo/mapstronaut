# Advanced Usage

This guide covers advanced features of Mapstronaut including complex transformations, filtering, validation, and asynchronous operations.

## Complex Mapper Example

This example demonstrates a comprehensive mission planning system that uses various advanced features including transforms, filters, default values, and nested mappings.

```ts
const missionData = {
  spacecraft: {
    name: "Artemis III",
    type: "lunar_lander",
    fuel: 85.7,
    systems: {
      propulsion: { status: "nominal", efficiency: 0.92 },
      navigation: { status: "optimal", accuracy: 0.99 },
      communication: { status: "degraded", strength: 0.65 },
    },
  },
  crew: [
    { name: "Elena Rodriguez", role: "commander", experience: 2840 },
    { name: "James Chen", role: "pilot", experience: 1950 },
    { name: "Maria Santos", role: "specialist", experience: 890 },
  ],
  mission: {
    target: "Moon",
    duration: 7,
    phase: "pre-launch",
    budget: 2.8e9,
    riskLevel: 0.15,
  },
  equipment: [
    { name: "EVA Suit", weight: 125, critical: true },
    { name: "Lunar Rover", weight: 210, critical: false },
    { name: "Sample Container", weight: 15, critical: true },
  ],
};

const advancedStructure = [
  { source: "spacecraft.name", target: "mission.vessel" },
  {
    source: "spacecraft.fuel",
    target: "mission.fuelStatus",
    transform: (fuel) => (fuel > 80 ? "excellent" : fuel > 60 ? "good" : "low"),
  },
  {
    source: "crew",
    target: "mission.commander",
    transform: (crew) =>
      crew.find((member) => member.role === "commander")?.name || "Unknown",
    filter: (crew) => Array.isArray(crew) && crew.length > 0,
  },
  {
    source: "crew",
    target: "mission.crewSize",
    transform: (crew) => crew.length,
  },
  {
    source: "mission.budget",
    target: "mission.budgetBillions",
    transform: (budget) => Math.round((budget / 1e9) * 10) / 10,
  },
  {
    source: "equipment",
    target: "mission.criticalEquipment",
    transform: (equipment) =>
      equipment.filter((item) => item.critical).map((item) => item.name),
  },
  {
    source: "spacecraft.systems",
    target: "mission.systemsHealthy",
    transform: (systems) =>
      Object.values(systems).every(
        (sys) => sys.status === "nominal" || sys.status === "optimal",
      ),
    filter: (systems) => typeof systems === "object" && systems !== null,
  },
  { constant: "lunar-exploration", target: "mission.category" },
  {
    source: "mission.target",
    target: "mission.destination",
    defaultValue: "Earth Orbit",
  },
];

const mapper = new Mapper(advancedStructure);
const result = mapper.map(missionData);
// Result: { mission: { vessel: 'Artemis III', fuelStatus: 'excellent', commander: 'Elena Rodriguez', crewSize: 3, budgetBillions: 2.8, criticalEquipment: ['EVA Suit', 'Sample Container'], systemsHealthy: false, category: 'lunar-exploration', destination: 'Moon' } }
```

## AsyncMapper Example

This example shows how to use AsyncMapper for operations that require asynchronous processing, such as API calls, database lookups, or complex calculations.

```ts
const spaceMissionData = {
  spacecraft: {
    name: "Artemis V",
    fuel: 78.5,
    certification: "pending",
  },
  mission: {
    target: "Moon",
    duration: 14,
    riskLevel: 0.12,
  },
  crew: [
    { name: "Sarah Kim", role: "commander", experience: 3200 },
    { name: "Alex Thompson", role: "engineer", experience: 1800 },
  ],
};

const asyncStructure = [
  { source: "spacecraft.name", target: "vessel.name" },
  {
    source: "spacecraft.name",
    target: "vessel.certified",
    transform: async (name) => await validateSpacecraftCertification(name),
    filter: async (name) => typeof name === "string" && name.length > 0,
  },
  {
    source: "mission.target",
    target: "flightPlan.trajectory",
    transform: async (target, source) => {
      const fuel = source.spacecraft?.fuel || 0;
      return await calculateOptimalTrajectory(target, fuel);
    },
  },
  {
    source: "crew[0]",
    target: "personnel.commander",
    transform: async (commander) => await enrichCrewData(commander),
    filter: async (commander) => commander && commander.role === "commander",
  },
  {
    source: "$",
    target: "assessment.riskLevel",
    transform: async (fullSource) => await assessMissionRisk(fullSource),
  },
  {
    source: "mission.duration",
    target: "logistics.supplies",
    transform: async (duration) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return {
        food: duration * 3.2,
        water: duration * 2.8,
        oxygen: duration * 1.5,
      };
    },
  },
  { constant: "deep-space", target: "category" },
];

const asyncMapper = new AsyncMapper(asyncStructure, {
  parallelRun: true,
  parallelJobsLimit: 3,
});
const result = await asyncMapper.map(spaceMissionData);
// Result: { vessel: { name: 'Artemis V', certified: true }, flightPlan: { trajectory: 'trans-lunar-injection' }, personnel: { commander: { name: 'Sarah Kim', role: 'commander', experience: 3200, certified: true, missionReady: true } }, assessment: { riskLevel: 'low' }, logistics: { supplies: { food: 44.800000000000004, water: 39.199999999999996, oxygen: 21 } }, category: 'deep-space' }
```

## Mapping to Class Instances

Mapstronaut can map data directly into class instances, preserving the class methods and structure while updating properties from the source data.

```ts
// Define a SpaceStation class
class SpaceStation {
  constructor(name = "", crew = 0, altitude = 0) {
    this.name = name;
    this.crew = crew;
    this.altitude = altitude;
    this.operational = true;
  }

  getStatus() {
    return `${this.name}: ${this.crew} crew members at ${this.altitude}km altitude`;
  }

  isFullyCrewed() {
    return this.crew >= 6;
  }

  updateOperationalStatus() {
    this.operational = this.crew > 0 && this.altitude > 300;
    return this.operational;
  }
}

// Source data from mission control
const missionControlData = {
  station: {
    identifier: "International Space Station",
    personnel: 7,
    orbit: {
      height: 408,
      inclination: 51.6,
    },
  },
  lastUpdate: "2024-03-15T10:30:00Z",
  systems: {
    power: "nominal",
    communications: "optimal",
  },
};

// Mapping structure to populate the class instance
const structure = [
  ["station.identifier", "name"],
  ["station.personnel", "crew"],
  ["station.orbit.height", "altitude"],
  {
    source: "systems.power",
    target: "operational",
    transform: (power) => power === "nominal" || power === "optimal",
  },
];

// Create a SpaceStation instance as target
const stationInstance = new SpaceStation("Unknown Station", 0, 0);

// Map the data into the existing class instance
const mapper = new Mapper(structure);
const mappedStation = mapper.map(missionControlData, stationInstance);

// The result is the same instance, now populated with data
console.log(mappedStation === stationInstance); // true
console.log(mappedStation.getStatus()); // "International Space Station: 7 crew members at 408km altitude"
console.log(mappedStation.isFullyCrewed()); // true
console.log(mappedStation.updateOperationalStatus()); // true

// Class methods are preserved and work with the mapped data
console.log(typeof mappedStation.getStatus); // "function"
console.log(typeof mappedStation.isFullyCrewed); // "function"

// The class instance now contains the mapped data
console.log(mappedStation.name); // "International Space Station"
console.log(mappedStation.crew); // 7
console.log(mappedStation.altitude); // 408
console.log(mappedStation.operational); // true
```