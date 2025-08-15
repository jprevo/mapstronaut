# JSONPath in Mapstronaut

JSONPath is a query language for JSON, similar to XPath for XML. In Mapstronaut, JSONPath expressions are used in mapping rules to specify which data from the source object should be extracted and mapped to the target.

## Basic Syntax

Mapstronaut uses the `jsonpath-plus` library for JSONPath operations. For convenience, the `$.` prefix can be omitted in your mapping rules.

### Root Reference

```ts
// These are equivalent:
{ source: "$", target: "spacecraft" }
{ source: "", target: "spacecraft" }
```

### Property Access

```ts
// Access a direct property
{ source: "name", target: "spacecraft.name" }
{ source: "$.name", target: "spacecraft.name" } // equivalent

// Access nested properties
{ source: "mission.name", target: "missionName" }
{ source: "crew.captain.name", target: "captainName" }
```

## Array Operations

### Array Index Access

```ts
// Access specific array elements
{ source: "crew[0]", target: "captain" }
{ source: "planets[2].name", target: "thirdPlanet" }
```

### Array Slicing

```ts
// Get array slices
{ source: "crew[0:2]", target: "firstTwoCrew" }    // First two elements
{ source: "planets[1:]", target: "remainingPlanets" } // All except first
{ source: "missions[-2:]", target: "lastTwoMissions" } // Last two elements
```

### All Array Elements

```ts
// Get all elements from an array
{ source: "crew[*]", target: "allCrewMembers" }
{ source: "planets[*].name", target: "planetNames" }
```

## Filtering and Conditions

### Filter Expressions

```ts
// Filter arrays based on conditions
{ source: "crew[?(@.rank == 'Captain')]", target: "captains" }
{ source: "planets[?(@.habitable == true)]", target: "habitablePlanets" }
{ source: "missions[?(@.status == 'completed')]", target: "completedMissions" }
```

### Comparison Operators

```ts
// Numeric comparisons
{ source: "planets[?(@.distance < 100)]", target: "nearbyPlanets" }
{ source: "crew[?(@.age >= 30)]", target: "seniorCrew" }

// String comparisons
{ source: "equipment[?(@.type == 'navigation')]", target: "navEquipment" }
{ source: "crew[?(@.name =~ /.*Commander.*/)]", target: "commanders" }
```

### Multiple Conditions

```ts
// AND conditions
{ source: "planets[?(@.habitable == true && @.distance < 50)]", target: "nearHabitablePlanets" }

// OR conditions
{ source: "crew[?(@.rank == 'Captain' || @.rank == 'Commander')]", target: "officers" }
```

## Recursive Descent

### Deep Search

```ts
// Find all matching properties recursively
{ source: "..name", target: "allNames" }           // All 'name' properties anywhere
{ source: "..coordinates", target: "allCoordinates" } // All coordinate objects
```

### Conditional Recursive Search

```ts
// Recursively find elements matching conditions
{ source: "$..crew[?(@.specialization == 'pilot')]", target: "allPilots" }
{ source: "$..equipment[?(@.status == 'operational')]", target: "workingEquipment" }
```

## Advanced Expressions

### Union Operations

```ts
// Multiple path selection
{ source: "['name', 'callSign']", target: "identification" }
{ source: "crew[0,2,4]", target: "oddIndexedCrew" }
```

### Script Expressions

```ts
// Custom JavaScript expressions
{ source: "crew[(@.length-1)]", target: "lastCrewMember" }
{ source: "planets[?(@.moons && @.moons.length > 0)]", target: "planetsWithMoons" }
```

## Practical Examples

### Space Mission Mapping

```ts
const spaceStructure = [
  // Basic property mapping
  { source: "mission.name", target: "missionName" },
  { source: "mission.launchDate", target: "launched" },

  // Array operations
  { source: "crew[*].name", target: "crewNames" },
  { source: "crew[0]", target: "commander" },

  // Filtering
  { source: "equipment[?(@.critical == true)]", target: "criticalEquipment" },
  { source: "waypoints[?(@.type == 'planet')]", target: "planetaryStops" },

  // Complex expressions
  {
    source: "crew[?(@.specialization == 'engineer' && @.experience > 5)]",
    target: "seniorEngineers",
  },
  {
    source: "..coordinates[?(@.x != null && @.y != null)]",
    target: "validCoordinates",
  },
];
```

### Spacecraft Configuration

```ts
const spacecraftStructure = [
  // Nested object access
  { source: "systems.propulsion.type", target: "propulsionType" },
  { source: "systems.navigation.gps.enabled", target: "hasGPS" },

  // Array filtering and transformation
  { source: "modules[?(@.operational == true)].name", target: "activeModules" },
  { source: "sensors[*].readings[-1:]", target: "latestReadings" },

  // Recursive search
  {
    source: "..temperature[?(@.value > 100)]",
    target: "overheatingComponents",
  },
];
```

For more advanced JSONPath features, refer to the [jsonpath-plus documentation](https://github.com/JSONPath-Plus/JSONPath).
