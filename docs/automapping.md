# Automapping

The Automapper is a utility class that automatically maps properties from a source object to a target object when they share the same property names. It provides intelligent handling of nested objects, arrays, and type checking.

It is used by default in Mapstronaut, and can be disabled with the `{ automap: false }` option.

## Basic Usage

```typescript
import { Automapper } from "mapstronaut";

// Create a simple automapper
const automapper = new Automapper();

// Source spacecraft data
const spaceStation = {
  name: "International Space Station",
  altitude: 408,
  crew: 7,
  operational: true,
};

// Target with matching properties
const stationInfo = {
  name: "International Space Station Working Site",
  altitude: 0,
  crew: 0,
  operational: false,
  launchDate: "1998-11-20", // This won't be overwritten
};

// Automap matching properties
const result = automapper.map(spaceStation, stationInfo);

console.log(result);
// {
//   name: "International Space Station",
//   altitude: 408,
//   crew: 7,
//   operational: true,
//   launchDate: "1998-11-20"
// }
```

## Configuration Options

### Type Checking

Enable type checking to ensure source and target properties have compatible types:

```typescript
const automapper = new Automapper({ checkType: true });

const spacecraft = {
  name: "Voyager 1",
  speed: "17000", // string
  active: true,
};

const probe = {
  name: "",
  speed: 0, // number - type mismatch!
  active: false,
};

// With checkType: true, speed won't be mapped due to type mismatch
const result = automapper.map(spacecraft, probe);

console.log(result);
// {
//   name: "Voyager 1",
//   speed: 0, // unchanged due to type mismatch
//   active: true
// }
```

### Array Handling Strategies

Control how arrays are merged with different strategies:

```typescript
import { AutomapArrayStrategy } from "mapstronaut";

// Replace strategy (default)
const replaceMapper = new Automapper({
  automapArrayStrategy: AutomapArrayStrategy.Replace,
});

// Concatenate strategy
const concatMapper = new Automapper({
  automapArrayStrategy: AutomapArrayStrategy.Concatenate,
});

// Merge strategy
const mergeMapper = new Automapper({
  automapArrayStrategy: AutomapArrayStrategy.Merge,
});

const mission = {
  astronauts: ["Neil Armstrong", "Buzz Aldrin"],
};

const targetMission = {
  astronauts: ["Michael Collins", "John Glenn"],
};

// Replace: source replaces target
console.log(replaceMapper.map(mission, targetMission));
// { astronauts: ["Neil Armstrong", "Buzz Aldrin"] }

// Concatenate: arrays are combined
console.log(concatMapper.map(mission, targetMission));
// { astronauts: ["Michael Collins", "John Glenn", "Neil Armstrong", "Buzz Aldrin"] }

// Merge: source values replace target values at same indices
console.log(mergeMapper.map(mission, targetMission));
// { astronauts: ["Neil Armstrong", "Buzz Aldrin"] }
```

### Custom Array Strategy

Define custom logic for array handling:

```typescript
const customMapper = new Automapper({
  automapArrayStrategy: (key, sourceArray, targetArray) => {
    if (key === "coordinates") {
      // Average coordinates for spacecraft positioning
      return sourceArray.map((val, idx) => (val + (targetArray[idx] || 0)) / 2);
    }
    return sourceArray; // Default behavior for other arrays
  },
});

const position1 = {
  coordinates: [100, 200, 300],
};

const position2 = {
  coordinates: [200, 400, 600],
};

console.log(customMapper.map(position1, position2));
// { coordinates: [150, 300, 450] }
```

## Deep Object Mapping

The Automapper recursively maps nested objects:

```typescript
const automapper = new Automapper();

const sourceSpacecraft = {
  name: "Enterprise",
  systems: {
    propulsion: {
      type: "Warp Drive",
      speed: 9.5,
    },
    navigation: {
      type: "Computer",
      accuracy: 99.9,
    },
  },
};

const targetSpacecraft = {
  name: "",
  systems: {
    propulsion: {
      type: "",
      speed: 0,
      efficiency: 85, // This will be preserved
    },
    navigation: {
      type: "",
      accuracy: 0,
    },
    shields: {
      // This entire object will be preserved
      strength: 100,
    },
  },
};

const result = automapper.map(sourceSpacecraft, targetSpacecraft);

console.log(result);
// {
//   name: "Enterprise",
//   systems: {
//     propulsion: {
//       type: "Warp Drive",
//       speed: 9.5,
//       efficiency: 85
//     },
//     navigation: {
//       type: "Computer",
//       accuracy: 99.9
//     },
//     shields: {
//       strength: 100
//     }
//   }
// }
```

## Working with Classes

The Automapper works with class instances:

```typescript
class Spacecraft {
  name: string = "";
  fuel: number = 0;

  launch() {
    console.log(`${this.name} is launching!`);
  }
}

class SpaceShuttle {
  name: string = "";
  fuel: number = 0;
  crew: number = 0;

  dock() {
    console.log(`${this.name} is docking!`);
  }
}

const automapper = new Automapper();

const falcon9 = {
  name: "Falcon 9",
  fuel: 95,
  stages: 2,
};

const shuttle = new SpaceShuttle();

const result = automapper.map(falcon9, shuttle);

console.log(result instanceof SpaceShuttle); // true
console.log(result.name); // "Falcon 9"
console.log(result.fuel); // 95
result.dock(); // "Falcon 9 is docking!"
```

## Configuration Management

Update configuration dynamically:

```typescript
const automapper = new Automapper();

// Get current configuration
const config = automapper.getConfiguration();
console.log(config); // { checkType: false }

// Update configuration
automapper.setConfiguration({
  checkType: true,
  automapArrayStrategy: AutomapArrayStrategy.Concatenate,
});

// Configuration is merged, not replaced
const newConfig = automapper.getConfiguration();
console.log(newConfig);
// {
//   checkType: true,
//   automapArrayStrategy: "Concatenate"
// }
```

## Edge Cases and Limitations

### Undefined Values

Undefined source values are skipped:

```typescript
const source = {
  name: "Hubble",
  altitude: undefined,
  active: true,
};

const target = {
  name: "",
  altitude: 547,
  active: false,
};

const result = automapper.map(source, target);
// altitude remains 547, undefined values don't override
```

### Arrays in Source

When the source is an array, it returns a shallow copy:

```typescript
const missions = ["Apollo 11", "Apollo 12", "Apollo 13"];
const result = automapper.map(missions);
console.log(result); // ["Apollo 11", "Apollo 12", "Apollo 13"]
```

### No Target Provided

Without a target, an empty object is returned:

```typescript
const spacecraft = { name: "Voyager", speed: 17000 };
const result = automapper.map(spacecraft);
console.log(result); // {}
```
