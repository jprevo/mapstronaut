# Mapstronaut Examples

This document provides comprehensive examples of the Mapstronaut library's capabilities.

## Table of Contents

- [Basic Mapping](#basic-mapping)
- [Nested Object Mapping](#nested-object-mapping)
- [Advanced JSONPath Queries](#advanced-jsonpath-queries)
- [Transform Functions](#transform-functions)
- [Filters](#filters)
- [Default Values](#default-values)
- [Constants](#constants)
- [Fail-on Conditions](#fail-on-conditions)
- [Automapper](#automapper)
- [Async Operations](#async-operations)
- [Working with Target Objects](#working-with-target-objects)
- [Complex Real-World Examples](#complex-real-world-examples)

## Basic Mapping

### Simple Property Mapping

```typescript
import { Mapper } from "mapstronaut";

// Map astronaut data to mission profile
const source = {
  name: "Neil Armstrong",
  age: 38,
  rank: "Commander",
};

const structure = [
  ["name", "astronautName"],
  ["age", "astronautAge"],
  ["rank", "missionRole"],
];

const mapper = new Mapper(structure);
const result = mapper.map(source);

console.log(result);
// Output: {
//   astronautName: "Neil Armstrong",
//   astronautAge: 38,
//   missionRole: "Commander"
// }
```

### Mixed Rule Notations

```typescript
// Combining array and object notation
const structure = [
  ["name", "astronautName"], // Array notation
  { source: "age", target: "years" }, // Object notation
  ["mission", "assignment.mission"], // Nested target
  { source: "spacecraft.name", target: "vehicle" }, // Nested source
];

const source = {
  name: "Buzz Aldrin",
  age: 39,
  mission: "Apollo 11",
  spacecraft: { name: "Eagle" },
};

const result = mapper.map(source);
// Output: {
//   astronautName: "Buzz Aldrin",
//   years: 39,
//   assignment: { mission: "Apollo 11" },
//   vehicle: "Eagle"
// }
```

## Nested Object Mapping

### Mapping from Nested Sources

```typescript
const spaceStationData = {
  station: {
    name: "International Space Station",
    orbit: {
      altitude: 408,
      speed: 27600,
    },
    crew: {
      commander: "Thomas Pesquet",
      count: 7,
    },
  },
};

const structure = [
  ["station.name", "stationName"],
  ["station.orbit.altitude", "orbitHeight"],
  ["station.crew.commander", "leader"],
  ["station.crew.count", "crewSize"],
];

const mapper = new Mapper(structure);
const result = mapper.map(spaceStationData);

console.log(result);
// Output: {
//   stationName: "International Space Station",
//   orbitHeight: 408,
//   leader: "Thomas Pesquet",
//   crewSize: 7
// }
```

### Mapping to Nested Targets

```typescript
const astronautData = {
  name: "Chris Hadfield",
  nationality: "Canadian",
  missions: 3,
  experience: 4000,
};

const structure = [
  ["name", "profile.personalInfo.name"],
  ["nationality", "profile.personalInfo.country"],
  ["missions", "career.missionCount"],
  ["experience", "career.flightHours"],
];

const mapper = new Mapper(structure);
const result = mapper.map(astronautData);

console.log(result);
// Output: {
//   profile: {
//     personalInfo: {
//       name: "Chris Hadfield",
//       country: "Canadian"
//     }
//   },
//   career: {
//     missionCount: 3,
//     flightHours: 4000
//   }
// }
```

## Advanced JSONPath Queries

### Array Element Access

```typescript
const missionData = {
  missions: [
    { name: "Apollo 11", year: 1969, crew: ["Armstrong", "Aldrin", "Collins"] },
    { name: "Apollo 12", year: 1969, crew: ["Conrad", "Bean", "Gordon"] },
    { name: "Apollo 13", year: 1970, crew: ["Lovell", "Swigert", "Haise"] },
  ],
};

const structure = [
  ["$.missions[*].name", "missionNames"], // All mission names
  ["$.missions[0].crew", "apollo11Crew"], // First mission crew
  ["$.missions[*].year", "missionYears"], // All years
  ["$.missions[1].name", "secondMission"], // Specific mission
];

const mapper = new Mapper(structure);
const result = mapper.map(missionData);

console.log(result);
// Output: {
//   missionNames: ["Apollo 11", "Apollo 12", "Apollo 13"],
//   apollo11Crew: ["Armstrong", "Aldrin", "Collins"],
//   missionYears: [1969, 1969, 1970],
//   secondMission: "Apollo 12"
// }
```

### Array Filtering

```typescript
const satelliteData = {
  satellites: [
    { name: "Hubble", type: "telescope", operational: true, launchYear: 1990 },
    {
      name: "Spitzer",
      type: "telescope",
      operational: false,
      launchYear: 2003,
    },
    {
      name: "GPS IIF-12",
      type: "navigation",
      operational: true,
      launchYear: 2016,
    },
    { name: "Kepler", type: "telescope", operational: false, launchYear: 2009 },
  ],
};

const structure = [
  ["$.satellites[?(@.operational==true)].name", "activeSatellites"],
  ["$.satellites[?(@.type=='telescope')].name", "telescopes"],
  ["$.satellites[?(@.launchYear>2000)].name", "modernSatellites"],
];

const mapper = new Mapper(structure);
const result = mapper.map(satelliteData);

console.log(result);
// Output: {
//   activeSatellites: ["Hubble", "GPS IIF-12"],
//   telescopes: ["Hubble", "Spitzer", "Kepler"],
//   modernSatellites: ["Spitzer", "GPS IIF-12", "Kepler"]
// }
```

### Recursive Descent

```typescript
const spaceAgencyData = {
  nasa: {
    missions: {
      apollo: { budget: 25000000000 },
      artemis: { budget: 35000000000 },
    },
    facilities: {
      ksc: { budget: 2000000000 },
      jpl: { budget: 1500000000 },
    },
  },
  esa: {
    missions: {
      rosetta: { budget: 1400000000 },
    },
  },
};

const structure = [
  ["$..budget", "allBudgets"], // Find all budget values recursively
  ["$.nasa..budget", "nasaBudgets"], // Find NASA budgets only
];

const mapper = new Mapper(structure);
const result = mapper.map(spaceAgencyData);

console.log(result);
// Output: {
//   allBudgets: [25000000000, 35000000000, 2000000000, 1500000000, 1400000000],
//   nasaBudgets: [25000000000, 35000000000, 2000000000, 1500000000]
// }
```

## Transform Functions

### Basic Data Transformation

```typescript
const planetData = {
  name: "mars",
  distanceFromSun: 227900000, // km
  mass: 6.4171e23, // kg
};

const structure = [
  {
    source: "name",
    target: "planetName",
    transform: (name: string) => name.charAt(0).toUpperCase() + name.slice(1),
  },
  {
    source: "distanceFromSun",
    target: "distanceInAU",
    transform: (distance: number) =>
      (distance / 149597870.7).toFixed(2) + " AU",
  },
  {
    source: "mass",
    target: "massInEarthMasses",
    transform: (mass: number) => (mass / 5.972e24).toFixed(2) + " Earth masses",
  },
];

const mapper = new Mapper(structure);
const result = mapper.map(planetData);

console.log(result);
// Output: {
//   planetName: "Mars",
//   distanceInAU: "1.52 AU",
//   massInEarthMasses: "0.11 Earth masses"
// }
```

### Transform with Context

```typescript
const astronautData = {
  firstName: "Katherine",
  lastName: "Johnson",
  birthYear: 1918,
  specialty: "mathematics",
};

const structure = [
  { source: "lastName", target: "surname" },
  {
    source: "firstName",
    target: "introduction",
    transform: (firstName: string, source: any, target: any) => {
      const currentYear = new Date().getFullYear();
      const age = currentYear - source.birthYear;
      return `Hello, I'm ${firstName} ${target.surname}, and I work in ${source.specialty}. Age: ${age}`;
    },
  },
];

const mapper = new Mapper(structure);
const result = mapper.map(astronautData);

console.log(result);
// Output: {
//   surname: "Johnson",
//   introduction: "Hello, I'm Katherine Johnson, and I work in mathematics. Age: 106"
// }
```

### Array Transformation

```typescript
const rocketData = {
  stages: [
    { fuel: "RP-1", thrust: 7607000 },
    { fuel: "RP-1", thrust: 1033000 },
    { fuel: "LH2", thrust: 230000 },
  ],
  payloadMass: 63800, // kg
};

const structure = [
  {
    source: "stages",
    target: "totalThrust",
    transform: (stages: any[]) => {
      return stages.reduce((total, stage) => total + stage.thrust, 0);
    },
  },
  {
    source: "stages",
    target: "fuelTypes",
    transform: (stages: any[]) => {
      return [...new Set(stages.map((stage) => stage.fuel))];
    },
  },
  {
    source: "payloadMass",
    target: "payloadCapacity",
    transform: (mass: number) => `${(mass / 1000).toFixed(1)} tons`,
  },
];

const mapper = new Mapper(structure);
const result = mapper.map(rocketData);

console.log(result);
// Output: {
//   totalThrust: 8870000,
//   fuelTypes: ["RP-1", "LH2"],
//   payloadCapacity: "63.8 tons"
// }
```

## Filters

### Conditional Mapping

```typescript
const missionData = {
  missions: [
    { name: "Apollo 11", status: "completed", crewSize: 3, duration: 8 },
    { name: "Artemis 1", status: "completed", crewSize: 0, duration: 25 },
    { name: "Artemis 2", status: "planned", crewSize: 4, duration: 10 },
  ],
};

const structure = [
  {
    source: "missions[0]",
    target: "firstCrewedMission",
    filter: (mission: any) => mission.crewSize > 0,
    transform: (mission: any) => `${mission.name} (${mission.duration} days)`,
  },
  {
    source: "missions[1]",
    target: "secondCrewedMission",
    filter: (mission: any) => mission.crewSize > 0,
    transform: (mission: any) => `${mission.name} (${mission.duration} days)`,
  },
  {
    source: "missions[2]",
    target: "upcomingCrewedMission",
    filter: (mission: any) =>
      mission.status === "planned" && mission.crewSize > 0,
    transform: (mission: any) => `${mission.name} (${mission.duration} days)`,
  },
];

const mapper = new Mapper(structure);
const result = mapper.map(missionData);

console.log(result);
// Output: {
//   firstCrewedMission: "Apollo 11 (8 days)",
//   upcomingCrewedMission: "Artemis 2 (10 days)"
//   // secondCrewedMission is filtered out because Artemis 1 has 0 crew
// }
```

### Filter with Context

```typescript
const spaceStationData = {
  modules: [
    { name: "Destiny", type: "laboratory", year: 2001, operational: true },
    { name: "Unity", type: "node", year: 1998, operational: true },
    { name: "Zarya", type: "cargo", year: 1998, operational: false },
  ],
  currentYear: 2024,
};

const structure = [
  {
    source: "modules[0]",
    target: "newLabModule",
    filter: (module: any, source: any) => {
      return (
        module.type === "laboratory" &&
        module.operational &&
        source.currentYear - module.year < 25
      );
    },
    transform: (module: any) => `${module.name} Lab (${module.year})`,
  },
  {
    source: "modules[1]",
    target: "activeNode",
    filter: (module: any) => module.type === "node" && module.operational,
  },
  {
    source: "modules[2]",
    target: "inactiveModule",
    filter: (module: any) => !module.operational,
  },
];

const mapper = new Mapper(structure);
const result = mapper.map(spaceStationData);

console.log(result);
// Output: {
//   newLabModule: "Destiny Lab (2001)",
//   activeNode: { name: "Unity", type: "node", year: 1998, operational: true },
//   inactiveModule: { name: "Zarya", type: "cargo", year: 1998, operational: false }
// }
```

## Default Values

### Using Default Values

```typescript
const astronautProfile = {
  name: "Sally Ride",
  nationality: null,
  missionCount: undefined,
  specialty: "Physics",
};

const structure = [
  {
    source: "name",
    target: "astronautName",
  },
  {
    source: "nationality",
    target: "country",
    defaultValue: "Unknown",
  },
  {
    source: "missionCount",
    target: "missions",
    defaultValue: 0,
  },
  {
    source: "flightHours", // doesn't exist in source
    target: "totalFlightTime",
    defaultValue: "Not available",
  },
];

const mapper = new Mapper(structure);
const result = mapper.map(astronautProfile);

console.log(result);
// Output: {
//   astronautName: "Sally Ride",
//   country: "Unknown",
//   missions: 0,
//   totalFlightTime: "Not available"
// }
```

### Default Values with Transform

```typescript
const planetData = {
  name: "Kepler-452b",
  atmosphere: null,
  gravity: undefined,
};

const structure = [
  {
    source: "atmosphere",
    target: "atmosphereType",
    defaultValue: "unknown",
    transform: (atm: string) => atm.toUpperCase(),
  },
  {
    source: "gravity",
    target: "gravityDescription",
    defaultValue: 9.8,
    transform: (g: number) =>
      `${g} m/s² (${g > 9.8 ? "heavy" : g < 9.8 ? "light" : "Earth-like"})`,
  },
];

const mapper = new Mapper(structure);
const result = mapper.map(planetData);

console.log(result);
// Output: {
//   atmosphereType: "UNKNOWN",
//   gravityDescription: "9.8 m/s² (Earth-like)"
// }
```

## Constants

### Mapping Constants

```typescript
const missionData = {
  missionId: "ARTEMIS-1",
  launchDate: "2022-11-16",
};

const structure = [
  {
    target: "agency",
    constant: "NASA",
  },
  {
    target: "program",
    constant: "Artemis Program",
  },
  {
    source: "missionId",
    target: "mission",
  },
  {
    target: "status",
    constant: "COMPLETED",
    transform: (status: string) => status.toLowerCase(),
  },
];

const mapper = new Mapper(structure);
const result = mapper.map(missionData);

console.log(result);
// Output: {
//   agency: "NASA",
//   program: "Artemis Program",
//   mission: "ARTEMIS-1",
//   status: "completed"
// }
```

### Constants with Context

```typescript
const launchData = {
  rocketName: "Falcon Heavy",
  payload: "Tesla Roadster",
};

const structure = [
  {
    target: "launchDescription",
    constant: "SpaceX Launch",
    transform: (constant: string, source: any) => {
      return `${constant}: ${source.rocketName} carrying ${source.payload}`;
    },
  },
  {
    target: "company",
    constant: "SpaceX",
  },
];

const mapper = new Mapper(structure);
const result = mapper.map(launchData);

console.log(result);
// Output: {
//   launchDescription: "SpaceX Launch: Falcon Heavy carrying Tesla Roadster",
//   company: "SpaceX"
// }
```

## Fail-on Conditions

### Validation with FailOn

```typescript
const astronautApplication = {
  name: "John Doe",
  age: 16,
  flightHours: 1200,
  education: "PhD Physics",
};

const structure = [
  {
    source: "age",
    target: "astronautAge",
    failOn: (transformedAge: string, source: any) => source.age < 18, // Fail if original age < 18
    transform: (age: number) => `${age} years old`,
  },
  {
    source: "flightHours",
    target: "pilotExperience",
    failOn: (transformedHours: string, source: any) =>
      source.flightHours < 1000, // Fail if original hours < 1000
    transform: (hours: number) => `${hours} flight hours`,
  },
];

const mapper = new Mapper(structure);

try {
  const result = mapper.map(astronautApplication);
  console.log(result);
} catch (error) {
  console.error(error.message);
  // Output: "Mapping failed: condition failed for rule with target 'astronautAge'"
}
```

### FailOn with Context

```typescript
const missionPlan = {
  missionName: "Mars Expedition",
  budget: 50000000000, // $50B
  duration: 900, // days
  crewSize: 6,
};

const structure = [
  {
    source: "budget",
    target: "approvedBudget",
    failOn: (budget: number, source: any) => {
      // Fail if budget is over $100B OR mission duration is over 2 years
      return budget > 100000000000 || source.duration > 730;
    },
    transform: (budget: number) => `$${(budget / 1000000000).toFixed(1)}B`,
  },
  {
    source: "crewSize",
    target: "crew",
    failOn: (size: number) => size < 3 || size > 8, // Fail if crew size is not optimal
    transform: (size: number) => `${size} astronauts`,
  },
];

const mapper = new Mapper(structure);

try {
  const result = mapper.map(missionPlan);
  console.log(result);
} catch (error) {
  console.error(error.message);
  // Fails because mission duration (900 days) > 730 days
}
```

## Automapper

### Basic Automapping

```typescript
import { Automapper } from "mapstronaut";

const spaceStationSource = {
  name: "International Space Station",
  altitude: 408,
  speed: 27600,
  country: "International",
};

const spaceStationTarget = {
  name: "Previous Station Name",
  altitude: 0,
  crew: 0,
  established: 1998,
};

const automapper = new Automapper();
const result = automapper.map(spaceStationSource, spaceStationTarget);

console.log(result);
// Output: {
//   name: "International Space Station",  // Updated from source
//   altitude: 408,                        // Updated from source
//   crew: 0,                             // Preserved from target (no match in source)
//   established: 1998                    // Preserved from target (no match in source)
//   // speed and country not mapped (don't exist in target)
// }
```

### Automapper with Type Checking

```typescript
const missionSource = {
  name: "Apollo 11",
  year: 1969, // number
  duration: "8", // string (type mismatch)
  crew: 3,
};

const missionTarget = {
  name: "Previous Mission",
  year: 2000, // number
  duration: 10, // number (type mismatch with source)
  budget: 25000000,
};

// With type checking enabled (default)
const strictAutomapper = new Automapper({ checkType: true });
const strictResult = strictAutomapper.map(missionSource, missionTarget);

console.log(strictResult);
// Output: {
//   name: "Apollo 11",      // Mapped (both strings)
//   year: 1969,            // Mapped (both numbers)
//   duration: 10,          // NOT mapped (string vs number), kept original
//   budget: 25000000       // Preserved from target
// }

// With type checking disabled
const relaxedAutomapper = new Automapper({ checkType: false });
const relaxedResult = relaxedAutomapper.map(missionSource, missionTarget);

console.log(relaxedResult);
// Output: {
//   name: "Apollo 11",      // Mapped
//   year: 1969,            // Mapped
//   duration: "8",         // Mapped despite type difference
//   budget: 25000000       // Preserved from target
// }
```

## Async Operations

### Async Transform Functions

```typescript
import { AsyncMapper } from "mapstronaut";

const planetData = {
  name: "exoplanet-k2-18b",
  coordinates: { ra: "19h32m14s", dec: "+07°37'40\"" },
};

// Simulate async API calls
async function fetchPlanetInfo(name: string): Promise<string> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  return `${name} - A potentially habitable super-Earth`;
}

async function validateCoordinates(coords: any): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return coords.ra && coords.dec;
}

const structure = [
  {
    source: "name",
    target: "planetDescription",
    transform: async (name: string) => await fetchPlanetInfo(name),
  },
  {
    source: "coordinates",
    target: "validCoordinates",
    transform: async (coords: any) => await validateCoordinates(coords),
  },
];

const asyncMapper = new AsyncMapper(structure);
const result = await asyncMapper.map(planetData);

console.log(result);
// Output: {
//   planetDescription: "exoplanet-k2-18b - A potentially habitable super-Earth",
//   validCoordinates: true
// }
```

### Async Filters and FailOn

```typescript
const missionProposal = {
  destination: "Europa",
  budget: 45000000000,
  duration: 2920, // days (8 years)
  technology: "nuclear propulsion",
};

async function checkBudgetApproval(budget: number): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return budget <= 50000000000; // Max $50B budget
}

async function validateTechnology(tech: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const approvedTech = ["chemical", "nuclear propulsion", "ion drive"];
  return approvedTech.includes(tech);
}

const structure = [
  {
    source: "destination",
    target: "missionTarget",
    filter: async (dest: string) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return ["Mars", "Europa", "Titan"].includes(dest);
    },
  },
  {
    source: "budget",
    target: "approvedBudget",
    failOn: async (budget: number) => !(await checkBudgetApproval(budget)), // Fail if not approved
    transform: (budget: number) => `$${(budget / 1000000000).toFixed(1)}B`,
  },
  {
    source: "technology",
    target: "propulsionSystem",
    failOn: async (tech: string) => !(await validateTechnology(tech)), // Fail if not validated
  },
];

const asyncMapper = new AsyncMapper(structure);

try {
  const result = await asyncMapper.map(missionProposal);
  console.log(result);
  // Output: {
  //   missionTarget: "Europa",
  //   approvedBudget: "$45.0B",
  //   propulsionSystem: "nuclear propulsion"
  // }
} catch (error) {
  console.error(error.message);
}
```

## Working with Target Objects

### Merging with Existing Target

```typescript
const newCrewData = {
  commander: "Jessica Watkins",
  pilot: "Bob Hines",
};

const existingMissionData = {
  missionName: "Crew-4",
  launchDate: "2022-04-27",
  commander: "Kjell Lindgren", // Will be overwritten
  duration: 170,
};

const structure = [
  ["commander", "commander"],
  ["pilot", "pilot"],
];

const mapper = new Mapper(structure);
const result = mapper.map(newCrewData, existingMissionData);

console.log(result);
// Output: {
//   missionName: "Crew-4",           // Preserved from target
//   launchDate: "2022-04-27",       // Preserved from target
//   commander: "Jessica Watkins",    // Updated from source
//   duration: 170,                  // Preserved from target
//   pilot: "Bob Hines"               // Added from source
// }

// The result is the same object reference as existingMissionData
console.log(result === existingMissionData); // true
```

### Preserving Nested Properties

```typescript
const statusUpdate = {
  currentPhase: "Orbital Operations",
};

const missionData = {
  mission: {
    name: "Artemis 1",
    phase: "Launch", // Will be updated
    crew: {
      commander: "N/A",
      pilot: "N/A",
    },
  },
  timeline: {
    launch: "2022-11-16",
    landing: "2022-12-11",
  },
};

const structure = [["currentPhase", "mission.phase"]];

const mapper = new Mapper(structure);
const result = mapper.map(statusUpdate, missionData);

console.log(result);
// Output: {
//   mission: {
//     name: "Artemis 1",           // Preserved
//     phase: "Orbital Operations", // Updated
//     crew: {                     // Preserved completely
//       commander: "N/A",
//       pilot: "N/A"
//     }
//   },
//   timeline: {                   // Preserved completely
//     launch: "2022-11-16",
//     landing: "2022-12-11"
//   }
// }
```

## Complex Real-World Examples

### Mission Planning System

```typescript
import { Mapper, AsyncMapper } from "mapstronaut";

// Complex mission data from different systems
const legacyMissionData = {
  mission_details: {
    id: "ARTEMIS_3",
    name: "artemis iii lunar landing",
    planned_launch: "2025-12-01T10:30:00Z",
    crew_manifest: {
      commander: { name: "reid wiseman", experience: "naval aviator" },
      pilot: { name: "victor glover", experience: "test pilot" },
      mission_specialists: [
        { name: "christina koch", experience: "electrical engineer" },
        { name: "jeremy hansen", experience: "fighter pilot" },
      ],
    },
  },
  technical_specs: {
    vehicle: "orion_spacecraft",
    launch_system: "space_launch_system",
    mission_duration_days: 30,
    lunar_surface_duration_hours: 168,
  },
  budget_info: {
    total_cost_usd: 93000000000,
    cost_per_astronaut: null,
  },
};

// Transform to modern mission format
const modernMissionStructure = [
  {
    source: "mission_details.name",
    target: "mission.name",
    transform: (name: string) => {
      return name
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    },
  },
  {
    source: "mission_details.planned_launch",
    target: "mission.launchDateTime",
    transform: (date: string) => new Date(date).toISOString(),
  },
  {
    source: "mission_details.crew_manifest.commander",
    target: "crew.commander",
    transform: (commander: any) => ({
      name: commander.name
        .split(" ")
        .map((n: string) => n.charAt(0).toUpperCase() + n.slice(1))
        .join(" "),
      role: "Commander",
      background: commander.experience,
    }),
  },
  {
    source: "mission_details.crew_manifest.pilot",
    target: "crew.pilot",
    transform: (pilot: any) => ({
      name: pilot.name
        .split(" ")
        .map((n: string) => n.charAt(0).toUpperCase() + n.slice(1))
        .join(" "),
      role: "Pilot",
      background: pilot.experience,
    }),
  },
  {
    source: "mission_details.crew_manifest.mission_specialists",
    target: "crew.specialists",
    transform: (specialists: any[]) =>
      specialists.map((spec, index) => ({
        name: spec.name
          .split(" ")
          .map((n: string) => n.charAt(0).toUpperCase() + n.slice(1))
          .join(" "),
        role: `Mission Specialist ${index + 1}`,
        background: spec.experience,
      })),
  },
  {
    source: "technical_specs",
    target: "specifications",
    transform: (specs: any) => ({
      spacecraft: specs.vehicle.replace("_", " ").toUpperCase(),
      launchVehicle: specs.launch_system.replace(/_/g, " ").toUpperCase(),
      totalDuration: `${specs.mission_duration_days} days`,
      lunarSurfaceTime: `${Math.floor(specs.lunar_surface_duration_hours / 24)} days`,
    }),
  },
  {
    source: "budget_info.total_cost_usd",
    target: "budget.totalCost",
    transform: (cost: number) => `$${(cost / 1000000000).toFixed(1)}B`,
  },
  {
    source: "budget_info.total_cost_usd",
    target: "budget.costPerAstronaut",
    transform: (totalCost: number, source: any) => {
      const crewCount =
        2 + source.mission_details.crew_manifest.mission_specialists.length;
      return `$${(totalCost / crewCount / 1000000).toFixed(1)}M per astronaut`;
    },
  },
  {
    target: "mission.program",
    constant: "Artemis",
  },
  {
    target: "mission.agency",
    constant: "NASA",
  },
];

const mapper = new Mapper(modernMissionStructure);
const modernMission = mapper.map(legacyMissionData);

console.log(JSON.stringify(modernMission, null, 2));
/* Output:
{
  "mission": {
    "name": "Artemis Iii Lunar Landing",
    "launchDateTime": "2025-12-01T10:30:00.000Z",
    "program": "Artemis",
    "agency": "NASA"
  },
  "crew": {
    "commander": {
      "name": "Reid Wiseman",
      "role": "Commander",
      "background": "naval aviator"
    },
    "pilot": {
      "name": "Victor Glover", 
      "role": "Pilot",
      "background": "test pilot"
    },
    "specialists": [
      {
        "name": "Christina Koch",
        "role": "Mission Specialist 1", 
        "background": "electrical engineer"
      },
      {
        "name": "Jeremy Hansen",
        "role": "Mission Specialist 2",
        "background": "fighter pilot"
      }
    ]
  },
  "specifications": {
    "spacecraft": "ORION SPACECRAFT",
    "launchVehicle": "SPACE LAUNCH SYSTEM",
    "totalDuration": "30 days",
    "lunarSurfaceTime": "7 days"
  },
  "budget": {
    "totalCost": "$93.0B",
    "costPerAstronaut": "$23.3M per astronaut"
  }
}
*/
```

### Satellite Data Processing Pipeline

```typescript
// Async processing of satellite telemetry data
const satelliteTelemetry = {
  satellites: [
    {
      id: "HUBBLE-01",
      status: "operational",
      position: { lat: 28.5, lon: -80.6, alt: 547000 },
      instruments: [
        { name: "WFC3", status: "active", lastCalibration: "2023-01-15" },
        { name: "ACS", status: "standby", lastCalibration: "2022-11-20" },
      ],
      telemetry: {
        batteryLevel: 87,
        solarPanelEfficiency: 0.82,
        temperature: -45,
      },
    },
    {
      id: "JWST-01",
      status: "operational",
      position: { lat: 0, lon: 0, alt: 1500000 },
      instruments: [
        { name: "NIRCam", status: "active", lastCalibration: "2023-03-10" },
        { name: "MIRI", status: "maintenance", lastCalibration: "2023-02-28" },
      ],
      telemetry: {
        batteryLevel: 92,
        solarPanelEfficiency: 0.95,
        temperature: -223,
      },
    },
  ],
  groundStations: [
    { id: "DSN-14", location: "Goldstone", operational: true },
    { id: "DSN-25", location: "Canberra", operational: true },
  ],
};

// Async functions to simulate external API calls
async function validateSatelliteHealth(telemetry: any): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  if (telemetry.batteryLevel < 20) return "CRITICAL";
  if (telemetry.solarPanelEfficiency < 0.7) return "WARNING";
  if (telemetry.batteryLevel < 50) return "CAUTION";
  return "HEALTHY";
}

async function calculateOrbitType(position: any): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  if (position.alt > 1000000) return "L2 Halo Orbit";
  if (position.alt > 35000000) return "Geostationary";
  if (position.alt > 2000000) return "High Earth Orbit";
  return "Low Earth Orbit";
}

async function getInstrumentCount(
  instruments: any[],
): Promise<{ active: number; total: number }> {
  await new Promise((resolve) => setTimeout(resolve, 50));

  return {
    active: instruments.filter((i) => i.status === "active").length,
    total: instruments.length,
  };
}

const processingStructure = [
  {
    source: "$.satellites[*]",
    target: "processedSatellites",
    transform: async (satellites: any[]) => {
      const processed = await Promise.all(
        satellites.map(async (sat) => {
          const [health, orbitType, instrumentStats] = await Promise.all([
            validateSatelliteHealth(sat.telemetry),
            calculateOrbitType(sat.position),
            getInstrumentCount(sat.instruments),
          ]);

          return {
            satelliteId: sat.id,
            name: sat.id.replace("-", " "),
            status: sat.status.toUpperCase(),
            health: health,
            orbit: orbitType,
            position: {
              altitude: `${(sat.position.alt / 1000).toFixed(0)} km`,
              coordinates: `${sat.position.lat}°, ${sat.position.lon}°`,
            },
            instruments: {
              activeCount: instrumentStats.active,
              totalCount: instrumentStats.total,
              utilization: `${Math.round((instrumentStats.active / instrumentStats.total) * 100)}%`,
            },
            powerStatus: {
              battery: `${sat.telemetry.batteryLevel}%`,
              solarEfficiency: `${Math.round(sat.telemetry.solarPanelEfficiency * 100)}%`,
              temperature: `${sat.telemetry.temperature}°C`,
            },
          };
        }),
      );

      return processed;
    },
  },
  {
    source: "$.satellites[?(@.status=='operational')]",
    target: "operationalCount",
    transform: (operational: any[]) => operational.length,
  },
  {
    source: "$.groundStations[?(@.operational==true)]",
    target: "activeGroundStations",
    transform: (stations: any[]) => stations.map((s) => s.location),
  },
  {
    target: "reportGenerated",
    constant: new Date().toISOString(),
  },
  {
    target: "summary",
    constant: "Satellite Fleet Status Report",
    transform: async (title: string, source: any) => {
      const totalSats = source.satellites.length;
      const operational = source.satellites.filter(
        (s: any) => s.status === "operational",
      ).length;

      return {
        title,
        overview: `${operational}/${totalSats} satellites operational`,
        networkStatus: "NOMINAL",
      };
    },
  },
];

const asyncMapper = new AsyncMapper(processingStructure);

async function processSatelliteData() {
  try {
    const report = await asyncMapper.map(satelliteTelemetry);
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error("Processing failed:", error.message);
  }
}

// Execute the processing
await processSatelliteData();
```
