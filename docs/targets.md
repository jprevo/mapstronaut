# Target Mapping in Mapstronaut

Target mapping in Mapstronaut defines where data should be written in the destination object. Mapstronaut uses the `dot-prop` library internally to handle property assignment with dot notation, making it easy to write to nested object structures.

## Basic Syntax

### Simple Property Assignment

```ts
// Basic property mapping
{ source: "name", target: "astronautName" }

// This maps source.name to target.astronautName
```

### Nested Object Creation

```ts
// Create nested object structures
{ source: "rank", target: "crew.officer.rank" }
{ source: "callSign", target: "identification.callSign" }

// This creates target.crew.officer.rank and target.identification.callSign
```

## Dot Notation Features

### Property Access

```ts
// Direct property assignment
{ source: "missionName", target: "mission" }

// Nested property creation
{ source: "commanderName", target: "crew.commander.name" }
{ source: "shipClass", target: "spacecraft.specifications.class" }
```

### Deep Nesting

```ts
// Create deeply nested structures
{ source: "temperature", target: "sensors.environmental.temperature.current" }
{ source: "coordinates", target: "navigation.position.galactic.coordinates" }
```

## Array Operations

### Array Index Assignment

```ts
// Assign to specific array positions
{ source: "captain", target: "crew[0]" }
{ source: "engineer", target: "crew[1]" }
{ source: "coordinates", target: "waypoints[0].location" }
```

### Array Element Properties

```ts
// Set properties on array elements
{ source: "pilotName", target: "crew[0].name" }
{ source: "engineerSpecialty", target: "crew[1].specialization" }
{ source: "sensorReading", target: "systems[2].sensors.temperature" }
```

## Object Structure Examples

### Spacecraft Configuration

```ts
const spacecraftStructure = [
  // Basic properties
  { source: "name", target: "identification.name" },
  { source: "registry", target: "identification.registry" },

  // Systems configuration
  { source: "engineType", target: "systems.propulsion.type" },
  { source: "fuelLevel", target: "systems.propulsion.fuel.current" },
  { source: "navigationMode", target: "systems.navigation.mode" },

  // Crew assignments
  { source: "captainName", target: "crew.command.captain.name" },
  { source: "captainRank", target: "crew.command.captain.rank" },
  { source: "engineerName", target: "crew.engineering.chief.name" },
];

// Results in:
// {
//   identification: {
//     name: "USS Enterprise",
//     registry: "NCC-1701"
//   },
//   systems: {
//     propulsion: {
//       type: "warp",
//       fuel: { current: 85 }
//     },
//     navigation: { mode: "stellar" }
//   },
//   crew: {
//     command: {
//       captain: { name: "Kirk", rank: "Captain" }
//     },
//     engineering: {
//       chief: { name: "Scotty" }
//     }
//   }
// }
```

### Mission Planning

```ts
const missionStructure = [
  // Mission metadata
  { source: "missionId", target: "mission.id" },
  { source: "objective", target: "mission.objectives.primary" },

  // Timeline
  { source: "launchDate", target: "timeline.launch.scheduled" },
  { source: "duration", target: "timeline.duration.estimated" },

  // Destinations
  { source: "primaryDestination", target: "destinations[0].name" },
  { source: "secondaryDestination", target: "destinations[1].name" },

  // Equipment
  { source: "communicationSystem", target: "equipment.communication.primary" },
  { source: "backupComms", target: "equipment.communication.backup" },
];
```

### Crew Management

```ts
const crewStructure = [
  // Command crew
  { source: "commanderName", target: "command.commander.personal.name" },
  { source: "commanderAge", target: "command.commander.personal.age" },
  {
    source: "commanderExperience",
    target: "command.commander.qualifications.experience",
  },

  // Engineering crew
  { source: "chiefEngineer", target: "departments.engineering.chief.name" },
  {
    source: "assistantEngineers",
    target: "departments.engineering.assistants",
  },

  // Science crew
  { source: "scienceOfficer", target: "departments.science.officer.name" },
  { source: "researchers", target: "departments.science.researchers" },
];
```

## Advanced Target Features

### Combining with Constants

```ts
// Set constant values to specific target paths
{ target: "status.operational", constant: true }
{ target: "mission.type", constant: "exploration" }
{ target: "crew.complement.maximum", constant: 200 }
```

### Array Building

```ts
// Build arrays at target locations
{ source: "crewMember1", target: "crew[0]" }
{ source: "crewMember2", target: "crew[1]" }
{ source: "crewMember3", target: "crew[2]" }

// Or with nested properties
{ source: "sensor1Reading", target: "sensors[0].temperature.value" }
{ source: "sensor1Status", target: "sensors[0].status" }
{ source: "sensor2Reading", target: "sensors[1].temperature.value" }
```

## Working with Existing Targets

When mapping to an existing target object, Mapstronaut will merge new values into the existing structure without overwriting unrelated properties.

```ts
const existingSpacecraft = {
  identification: { registry: "NCC-1701" },
  systems: { shields: { status: "operational" } },
};

// Mapping with target will preserve existing data
const result = mapper.map(source, existingSpacecraft);
// Result includes both new mapped data and existing spacecraft data
```
