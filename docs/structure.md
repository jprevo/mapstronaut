# Mapping Structure Documentation

This document explains all the options available when defining mapping structures (rules) in Mapstronaut.

## Overview

A mapping structure is an array of rules that define how to transform data from a source object to a target object. Each rule specifies a mapping operation with various configuration options.

## Rule Types

### Array Rule (Simple Format)
```ts
type RuleArray = [string, string]; // [source, target]
```

The simplest rule format using a two-element array:
- **First element**: JSONPath expression for the source property
- **Second element**: OutPath expression for the target property

**Example:**
```ts
["crew.captain.name", "commanderName"]
```

### Object Rule (Extended Format)
```ts
type RuleObject = {
  source?: string;
  target: string;
  constant?: any;
  defaultValue?: any;
  transform?: (data: any, source: any, target: any) => any;
  filter?: (data: any, source: any, target: any) => boolean;
  failOn?: (data: any, source: any, target: any) => boolean;
}
```

## Rule Properties

### Required Properties

#### `target`
- **Type**: `string`
- **Description**: expression defining where to write the value in the target object
- **Example**: `"mission.destination.planet"`

### Optional Properties

#### `source`
- **Type**: `string` (optional)
- **Description**: JSONPath expression defining which property to read from the source object
- **Notes**: 
  - Required unless `constant` is provided
  - When `assumeRoot` option is true (default), `$.` prefix is automatically added if missing
- **Example**: `"spacecraft.engines[0].fuelLevel"`

#### `constant`
- **Type**: `any`
- **Description**: A constant value to assign to the target property
- **Notes**: When provided, `source` is not required
- **Example**: `"ACTIVE"` or `42` or `{ status: "operational" }`

#### `defaultValue`
- **Type**: `any`
- **Description**: Value to use when the source data is null or undefined
- **Example**: `"Unknown Mission"`

#### `transform`
- **Type**: `(data: any, source: any, target: any) => any`
- **Description**: Function to transform the source data before mapping
- **Parameters**:
  - `data`: The value extracted from the source using the JSONPath
  - `source`: The complete source object
  - `target`: The current state of the target object
- **Example**: 
```ts
transform: (data) => data.toUpperCase()
```

#### `filter`
- **Type**: `(data: any, source: any, target: any) => boolean`
- **Description**: Function that determines whether this rule should be applied
- **Parameters**:
  - `data`: The value extracted from the source using the JSONPath
  - `source`: The complete source object
  - `target`: The current state of the target object
- **Returns**: `true` to apply the rule, `false` to skip it
- **Example**:
```ts
filter: (data) => data !== null && data.length > 0
```

#### `failOn`
- **Type**: `(data: any, source: any, target: any) => boolean`
- **Description**: Function that throws an error if it returns true
- **Parameters**:
  - `data`: The value extracted from the source using the JSONPath
  - `source`: The complete source object
  - `target`: The current state of the target object
- **Returns**: `true` to throw an error and stop mapping, `false` to continue
- **Example**:
```ts
failOn: (data) => data < 0  // Fail if fuel level is negative
```

## Async Rules

For `AsyncMapper`, all function properties (`transform`, `filter`, `failOn`) can return Promises:

```ts
type AsyncRuleObject = {
  // ... same base properties
  transform?: (data: any, source: any, target: any) => any | Promise<any>;
  filter?: (data: any, source: any, target: any) => boolean | Promise<boolean>;
  failOn?: (data: any, source: any, target: any) => boolean | Promise<boolean>;
}
```

## Complete Examples

### Space Mission Mapping Structure

```ts
const missionStructure = [
  // Simple array rule
  ["mission.name", "missionTitle"],
  
  // Object rule with transform
  {
    source: "crew.members",
    target: "crewCount",
    transform: (data) => data.length
  },
  
  // Constant value
  {
    target: "status",
    constant: "PLANNED"
  },
  
  // With default value and filter
  {
    source: "spacecraft.fuel",
    target: "fuelLevel",
    defaultValue: 0,
    filter: (data) => data !== undefined
  },
  
  // With failOn validation
  {
    source: "mission.priority",
    target: "priority",
    failOn: (data) => !["LOW", "MEDIUM", "HIGH"].includes(data),
    transform: (data) => data.toLowerCase()
  }
];
```

### Async Structure Example

```ts
const asyncStructure = [
  {
    source: "astronaut.id",
    target: "astronautProfile",
    transform: async (id) => {
      const profile = await fetchAstronautProfile(id);
      return profile;
    },
    filter: async (id) => {
      const exists = await checkAstronautExists(id);
      return exists;
    }
  }
];
```