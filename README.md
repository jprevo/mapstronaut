![Mapstronaut Banner](./assets/banner.jpg)

Mapstronaut is a full-featured JavaScript object mapper.

![Tests 234/234](https://img.shields.io/badge/tests-234/234-green)
![Coverage 99%](https://img.shields.io/badge/coverage-99%25-green)
![Types Provided](https://img.shields.io/badge/types-provided-blue)
![Licence MIT](https://img.shields.io/badge/licence-MIT-blue)

## Installtion

```bash
npm i mapstronaut
```

## Main features

- Works with node and browsers
- Uses the amazing JsonPath-plus library for parsing
- Advanced rules capabilities
- Automaps properties matching in both source and target (with type checking)
- Built in Typescript
- Supports parallel async mapping, with up to ~4x performance improvement over sequential
- Fully tested

## Usage

### Basic example

```javascript
import { mapObject } from "mapstronaut";

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
    { duration: 150, date: "1969-07-21" },
    { duration: 45, date: "1969-07-22" },
  ],
};

const structure = [
  ["personalInfo.name", "astronautName"],
  ["mission.name", "missionInfo.title"],
  ["mission.destination", "missionInfo.target"],
  {
    source: "spaceWalks[*].duration",
    target: "walkDurations",
  },
];

const target = {
  id: null,
};

const result = mapObject(structure, astronaut, target);

/*
{
  "id": 12345, // automapped
  "astronautName": "Neil Armstrong", 
  "missionInfo": {
    "title": "Apollo 11",
    "target": "Moon"
  },
  "walkDurations": [150, 45]
}
*/
```

Using the same `astronaut` object as above :

### Transform example

```javascript
const structure = [
  {
    source: "personalInfo.birthYear",
    target: "currentAge",
    transform: (birthYear) => new Date().getFullYear() - birthYear,
  },
];

const result = mapObject(structure, astronaut);
// { "currentAge": 95 }
```

### Filter example

```javascript
const structure = [
  {
    source: "mission",
    target: "marsMission",
    filter: (mission) => mission.destination === "Mars",
  },
];

const result = mapObject(structure, astronaut);
// { "id": 12345, ....  } // marsMission is not present
```

### Async mapping example

```javascript
import { mapObjectAsync } from "mapstronaut";

const structure = [
  {
    source: "mission.destination",
    target: "destinationInfo",
    transform: async (destination) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 100));
      return { name: destination, type: "Celestial Body" };
    },
  },
];

const result = await mapObjectAsync(structure, astronaut);
// { "destinationInfo": { "name": "Moon", "type": "Celestial Body" } }
```

[See more examples here](./docs/examples.md).

## Documentation

- [Basic Usage](./docs/basic-usage.md)
- [Options reference](./docs/options.md)
- [Mapping rules (structure)](./docs/structure.md)
- [Additional examples](./docs/examples.md)

## Contributions

## Licence

MIT

Initially Built by Jonathan Prevost
