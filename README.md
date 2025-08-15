![Mapstronaut Banner](./assets/banner.jpg)

Mapstronaut is a lightweight and flexible JavaScript/TypeScript library for transforming objects. It simplifies complex object manipulation by defining mapping rules, letting you focus on the data, not the boilerplate code.

[![npm version](https://img.shields.io/npm/v/mapstronaut)](https://www.npmjs.com/package/mapstronaut)
[![MIT License](https://img.shields.io/badge/licence-MIT-blue)](https://github.com/jprevo/mapstronaut/blob/main/LICENSE)
[![Tests 296/296](https://img.shields.io/badge/tests-296/296-green)](https://github.com/jprevo/mapstronaut/tree/main/test)
[![Coverage 98%](https://img.shields.io/badge/coverage-98%25-green)](https://github.com/jprevo/mapstronaut/tree/main/test)

## Why Mapstronaut?

- **Declarative Approach**: Define your mapping structure as an array of rules. It's easy to read, understand, and maintain.
- **Advanced Data Selection**: Uses  [JSONPath](https://www.npmjs.com/package/jsonpath-plus) to precisely select source properties, even from complex nested objects and arrays. Uses [dot-prop](https://www.npmjs.com/package/dot-prop) to select target properties.
- **Automapping**: Automatically maps properties with matching names and types, saving you from defining obvious mappings.
- **High-Performance Async**: Supports parallel asynchronous mapping, offering a significant performance boost for I/O-heavy transformations.

_Developer's note: I used Typescript for a long time before having to switch to Java a few years ago. I loved using the popular object mapper Mapstruct and was inspired by it for Mapstronaut._

## Installation

```bash
npm i mapstronaut
```

## Usage

All examples will use the following `astronaut` source object:

```javascript
const astronaut = {
  id: 12345,
  personalInfo: {
    name: "Neil Armstrong",
    birthYear: 1930,
  },
  mission: {
    name: "Apollo 11",
    destination: "Moon",
    launchDate: "1969-07-16",
  },
  rank: "Commander",
  spaceWalks: [
    { duration: 151, date: "1969-07-21" },
    { duration: 45, date: "1969-07-22" }, // this one is not true btw
  ],
};
```

### Basic Mapping

Define a `structure` to map properties from a source object to a target. Properties with matching names (like `id`) are automapped.

```javascript
import { mapObject } from "mapstronaut";

const structure = [
  ["personalInfo.name", "astronautName"],
  ["mission.name", "missionInfo.title"],
  ["mission.destination", "missionInfo.target"],
  {
    source: "spaceWalks[*].duration", // Select all 'duration' values from the array
    target: "walkDurations",
  },
];

const target = {
  id: null,
};

const result = mapObject(structure, astronaut, target);

/*
// Result:
{
  "id": 12345, // Automapped because the property name matches
  "astronautName": "Neil Armstrong",
  "missionInfo": {
    "title": "Apollo 11",
    "target": "Moon"
  },
  "walkDurations": [151, 45]
}
*/
```

### Transforming Values

Use the `transform` function to modify a source value before it's assigned to the target.

```javascript
const structure = [
  {
    source: "personalInfo.birthYear",
    target: "currentAge",
    transform: (birthYear) => new Date().getFullYear() - birthYear,
  },
];

const result = mapObject(structure, astronaut);

/*
// Result (assuming the current year is 2025):
{
  "currentAge": 95
}
*/
```

### Filtering Properties

Use the `filter` function to conditionally map a property. If the filter returns `false`, the property is omitted from the result.

```javascript
const structure = [
  {
    source: "mission",
    target: "marsMission",
    filter: (mission) => mission.destination === "Mars", // This will be false
  },
];

const result = mapObject(structure, astronaut);

/*
// Result:
// The 'marsMission' property is not present because the filter returned false.
// Automapped properties are still included.
{
  "id": 12345,
  "rank": "Commander"
  // ... other automapped properties
}
*/
```

### Asynchronous Mapping

```javascript
import { mapObjectAsync } from "mapstronaut";

const structure = [
  {
    source: "mission.destination",
    target: "destinationInfo",
    transform: async (destination) => {
      // Example: fetch data from an external API
      const type = await externalSpaceApi.fetchType(destination);
      return { name: destination, type: type };
    },
  },
];

const result = await mapObjectAsync(structure, astronaut);

/*
// Result:
{
  // ... other automapped properties
  "destinationInfo": { "name": "Moon", "type": "Celestial Body" }
}
*/
```

## Documentation

- [Basic Usage](./docs/basic-usage.md)
- [Options reference](./docs/options.md)
- [Mapping rules (structure)](./docs/structure.md)
- [JSONPath source properties](./docs/jsonpath.md)
- [Additional examples](./docs/examples.md)

## Contributions

Contributions are welcome\! If you have a feature request, bug report, or want to improve the code, please feel free to open an issue or submit a pull request.

## Licence

This project is licensed under the **MIT License**.

Built by Jonathan Prevost.
