![Mapstronaut Banner](./assets/banner.jpg)

Mapstronaut is a lightweight and flexible JavaScript/TypeScript library for transforming objects. It simplifies complex object manipulation by defining mapping rules, letting you focus on the data, not the boilerplate code.

[![npm version](https://img.shields.io/npm/v/mapstronaut)](https://www.npmjs.com/package/mapstronaut)
[![MIT License](https://img.shields.io/github/license/jprevo/mapstronaut)](https://github.com/jprevo/mapstronaut/blob/main/LICENSE)
[![Tests 288/288](https://img.shields.io/badge/tests-304/304-green)](https://github.com/jprevo/mapstronaut/tree/main/test)
[![Coverage 99%](https://img.shields.io/badge/coverage-98%25-green)](https://github.com/jprevo/mapstronaut/tree/main/test)

## Why Mapstronaut?

- **Declarative Approach**: Define your mapping structure as an array of rules. It's easy to read, understand, and maintain.
- **Advanced Data Selection**: Uses [JSONPath](https://www.npmjs.com/package/jsonpath-plus) to precisely select source properties, even from complex nested objects and arrays. Uses [dot-prop](https://www.npmjs.com/package/dot-prop) to select target properties.
- **Automapping**: Can automatically map properties with matching names and types, saving you from defining obvious mappings.
- **High-Performance Async**: Supports parallel asynchronous mapping, offering a significant performance boost for I/O-heavy transformations.

_Developer's note: I used Typescript for a long time before having to switch to Java a few years ago. I loved using the popular object mapper Mapstruct and was inspired by it for Mapstronaut._

## Installation

```bash
npm i mapstronaut
```

## Usage

All examples will use the following space mission data:

```typescript
const spaceMissionData = {
  mission: {
    id: "artemis-3",
    name: "Artemis III",
    status: "planned",
    launch: {
      date: "2027-07-15T14:30:00Z",
      site: "Kennedy Space Center",
    },
  },
  crew: [
    { id: "cmdr-001", name: "Sarah Chen", role: "commander", experience: 2840 },
    {
      id: "plt-002",
      name: "Marcus Rodriguez",
      role: "pilot",
      experience: 1650,
    },
  ],
  spacecraft: {
    name: "Orion",
    modules: ["crew", "service"],
    fuel: { type: "liquid", amount: 95.5 },
  },
};
```

### Basic Mapping

```typescript
const structure = [
  ["mission.name", "missionTitle"],
  ["mission.launch.date", "scheduledDate"],
  ["crew[0].name", "commander"],
  ["spacecraft.fuel.amount", "spacecraft.fuelLevel"],
];

const mapper = new Mapper(structure);
const result = mapper.map(spaceMissionData);

// Result:
// {
//   missionTitle: "Artemis III",
//   scheduledDate: "2027-07-15T14:30:00Z",
//   commander: "Sarah Chen"
//   spacecraft: {
//     fuelLevel: 95.5
//   }
// }
```

### Transforming and Filtering

Apply transformations and conditional logic during mapping:

```typescript
const structure = [
  {
    source: "mission.launch.date",
    target: "launchYear",
    transform: (date) => new Date(date).getFullYear(),
  },
  {
    source: "crew",
    target: "activeCrew",
    filter: (crew, source) => source.mission.status === "in-progress",
  },
  {
    source: "spacecraft.fuel.amount",
    target: "fuelStatus",
    transform: (amount) => (amount > 90 ? "ready" : "needs-refuel"),
  },
];

const mapper = new Mapper(structure);
const result = mapper.map(spaceMissionData);

// Result:
// {
//   launchYear: 2027,
//   fuelStatus: "ready"
// }
// // activeCrew is filtered out
```

### Asynchronous Mapping

```typescript
// Simulate external API calls
const fetchWeatherData = (site) =>
  new Promise((resolve) =>
    setTimeout(() => resolve({ temp: 22, conditions: "clear" }), 100),
  );

const fetchCrewCertification = (crewId) =>
  new Promise((resolve) =>
    setTimeout(() => resolve({ certified: true, expires: "2027-01-01" }), 150),
  );

const structure = [
  ["mission.name", "title"],
  {
    source: "mission.launch.site",
    target: "weather",
    transform: async (site) => await fetchWeatherData(site),
  },
  {
    source: "crew[0].id",
    target: "commanderStatus",
    transform: async (id) => await fetchCrewCertification(id),
  },
];

const mapper = new AsyncMapper(structure, { parallelRun: true });
const result = await mapper.map(spaceMissionData);

// Result:
// {
//   title: "Artemis III",
//   weather: { temp: 22, conditions: 'clear' },
//   commanderStatus: { certified: true, expires: '2027-01-01' }
// }
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
