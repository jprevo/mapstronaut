# Basic Usage

This guide covers the fundamental usage of Mapstronaut for simple object mapping scenarios.

## Installation

```bash
npm install mapstronaut
```

## Quick Start

The simplest way to map objects is using the `mapObject` function:

```ts
import { mapObject } from 'mapstronaut';

const source = {
  spacecraft: {
    name: 'Apollo 11',
    crew: ['Neil Armstrong', 'Buzz Aldrin', 'Michael Collins']
  },
  mission: {
    year: 1969,
    destination: 'Moon'
  }
};

const structure = [
  { source: 'spacecraft.name', target: 'vesselName' },
  { source: 'mission.destination', target: 'target' },
  { source: 'mission.year', target: 'launchYear' }
];

const result = mapObject(structure, source);
// Result: { vesselName: 'Apollo 11', target: 'Moon', launchYear: 1969 }
```

## Using the Mapper Class

For more control and the ability to reuse your mapper, use the `Mapper` class:

```ts
import { Mapper } from 'mapstronaut';

const structure = [
  { source: 'astronaut.name', target: 'commanderName' },
  { source: 'mission.duration', target: 'flightDays' }
];

const mapper = new Mapper(structure);

const source = {
  astronaut: { name: 'Sally Ride' },
  mission: { duration: 6 }
};

const result = mapper.map(source);
// Result: { commanderName: 'Sally Ride', flightDays: 6 }
```

## Mapping to Existing Objects

You can map into an existing target object:

```ts
const existingTarget = {
  station: 'ISS',
  altitude: 408
};

const structure = [
  { source: 'crew.commander', target: 'commander' }
];

const source = {
  crew: { commander: 'Chris Hadfield' }
};

const result = mapObject(structure, source, existingTarget);
// Result: { station: 'ISS', altitude: 408, commander: 'Chris Hadfield' }
```

## Working with Arrays

Map array elements using JsonPath syntax:

```ts
const source = {
  satellites: ['Hubble', 'Kepler', 'Spitzer']
};

const structure = [
  { source: 'satellites[0]', target: 'primaryTelescope' },
  { source: 'satellites[1]', target: 'planetHunter' }
];

const result = mapObject(structure, source);
// Result: { primaryTelescope: 'Hubble', planetHunter: 'Kepler' }
```

## Using Constants

Set constant values without a source:

```ts
const structure = [
  { source: 'planet.name', target: 'destination' },
  { constant: 'NASA', target: 'agency' }
];

const source = {
  planet: { name: 'Mars' }
};

const result = mapObject(structure, source);
// Result: { destination: 'Mars', agency: 'NASA' }
```

## Default Values

Provide fallback values when source data is missing:

```ts
const structure = [
  { source: 'rocket.fuel', target: 'propellant', defaultValue: 'RP-1' },
  { source: 'rocket.stages', target: 'stageCount', defaultValue: 2 }
];

const source = {
  rocket: { fuel: null } // stages is missing
};

const result = mapObject(structure, source);
// Result: { propellant: 'RP-1', stageCount: 2 }
```

## Nested Target Properties

Map to nested properties in the target object:

```ts
const structure = [
  { source: 'pilot.name', target: 'crew.pilot' },
  { source: 'engineer.name', target: 'crew.engineer' }
];

const source = {
  pilot: { name: 'Yuri Gagarin' },
  engineer: { name: 'Sergei Korolev' }
};

const result = mapObject(structure, source);
// Result: { crew: { pilot: 'Yuri Gagarin', engineer: 'Sergei Korolev' } }
```