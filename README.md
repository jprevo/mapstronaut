![Mapstronaut Banner](./assets/banner.jpg)

Mapstronaut is a full-featured JavaScript object mapper.

![Tests 197/197](https://img.shields.io/badge/tests-197/197-green)
![Coverage 99%](https://img.shields.io/badge/coverage-99%25-green)
![Types Provided](https://img.shields.io/badge/types-provided-blue)
![Licence MIT](https://img.shields.io/badge/licence-MIT-blue)

```bash
npm i mapstronaut
```

## Main features

- Works with node and browsers
- Uses the amazing JsonPath-plus library for parsing
- Can automap properties matching in both source and target (with type checking)
- Allows advanced rules creation
- Typescript ready

## Usage

### JsonPath+

### Automapping

Automapping automatically maps properties that exist in both source and target objects, including mapping from plain objects to class instances:

```typescript
import { mapObject } from 'mapstronaut';

// Target spacecraft class
class Spacecraft {
  constructor(
    public missionName: string = "",
    public captain: string = "Unknown",
    public status: string = "Preparing"
  ) {}
}

// Source data from a space mission API (plain object)
const missionData = {
  missionName: "Apollo 11",
  launchDate: new Date("1969-07-16"),
  crew: 3,
  payload: "Lunar Module"
};

const spacecraft = new Spacecraft("", "Neil Armstrong", "Ready");

// Only properties that exist in both source and target will be mapped
// Empty structure [] relies on automapping only
const result = mapObject([], missionData, spacecraft, { automap: true });

console.log(result.missionName); // "Apollo 11" (mapped from source)
console.log(result.captain);     // "Neil Armstrong" (preserved from target)
console.log(result.status);      // "Ready" (preserved from target)
// crew, launchDate, and payload properties are not mapped since they don't exist in target
```

Automapping is enabled by default.

### Advanced examples

## Documentation

## Typescript

Mapstronaut is built in typescript and provides its own definitions.

## Contributions

## Licence

MIT