# Mapper Options

This document explains the various configuration options available when using Mapstronaut's Mapper and AsyncMapper classes.

## Quick Reference

| Option                 | Default   | Description                                                    |
| ---------------------- | --------- | -------------------------------------------------------------- |
| `assumeRoot`           | `true`    | Automatically adds `$.` to JSONPath entries if not present     |
| `automap`              | `true`    | Enables automatic mapping of matching property names           |
| `automapCheckType`     | `false`   | Verifies type compatibility during automapping                 |
| `automapArrayStrategy` | `Replace` | Strategy for merging arrays during automapping                 |
| `skipNull`             | `false`   | Skips mapping null values from source                          |
| `skipUndefined`        | `true`    | Skips mapping undefined values from source                     |
| `jsonPathOptions`      | `null`    | Additional options for JSONPath library                        |
| `parallelRun`          | `false`   | Runs async operations in parallel (AsyncMapper only)           |
| `parallelJobsLimit`    | `0`       | Limits concurrent async jobs (0 = unlimited, AsyncMapper only) |

## MapperOptions

The `MapperOptions` interface provides several configuration options to customize the mapping behavior:

### assumeRoot (boolean)

- **Default**: `true`
- **Description**: Automatically adds `$.` to JSONPath entries if not present, making structure configuration easier and more convenient.
- **Example**:

  ```ts
  // With assumeRoot: true (default)
  const structure = [["name", "spaceship.name"]]; // Treated as $.name

  // With assumeRoot: false
  const structure = [["$.name", "spaceship.name"]]; // Must explicitly specify root
  ```

### automap (boolean)

- **Default**: `true`
- **Description**: Enables automatic mapping of properties that exist in both source and target objects with matching names.
- **Example**:
  ```ts
  // Source: { name: "Apollo", fuel: 100 }
  // Target schema: { name: string, fuel: number, crew: string[] }
  // With automap: true, name and fuel are automatically mapped
  ```

### automapCheckType (boolean)

- **Default**: `false`
- **Description**: When automapping is enabled, this option determines whether to verify that source and target property types match before mapping.
- **Example**:
  ```ts
  // Source: { altitude: "1000" } (string)
  // Target: { altitude: number }
  // With automapCheckType: true, this property would be skipped
  // With automapCheckType: false, the string would be mapped to the number field
  ```

### automapArrayStrategy (AutomapArrayStrategy | AutomapArrayStrategyFunction)

- **Default**: `AutomapArrayStrategy.Replace`
- **Description**: Defines the strategy for handling array properties during automapping when both source and target have arrays for the same property name.
- **Available Strategies**:
  - `AutomapArrayStrategy.Replace`: Replaces the target array with the source array (default behavior)
  - `AutomapArrayStrategy.Concatenate`: Appends the source array elements to the target array
  - `AutomapArrayStrategy.Merge`: Merges arrays by index, replacing target values where source has values at the same index
  - Custom function: Provide your own strategy function with signature `(key: string, source: any[], target: any[]) => any`
- **Example**:

  ```ts
  import { AutomapArrayStrategy } from "mapstronaut";

  // Source: { crew: ["Neil", "Buzz"] }
  // Target: { crew: ["Michael"] }

  // Replace (default): { crew: ["Neil", "Buzz"] }
  const replaceMapper = new Mapper([], {
    automapArrayStrategy: AutomapArrayStrategy.Replace,
  });

  // Concatenate: { crew: ["Michael", "Neil", "Buzz"] }
  const concatMapper = new Mapper([], {
    automapArrayStrategy: AutomapArrayStrategy.Concatenate,
  });

  // MergeByIndex: { crew: ["Neil", "Buzz"] }
  const mergeMapper = new Mapper([], {
    automapArrayStrategy: AutomapArrayStrategy.Merge,
  });

  // Custom function
  const customMapper = new Mapper([], {
    automapArrayStrategy: (key, source, target) => {
      // Custom logic for combining arrays
      return [...new Set([...target, ...source])]; // Remove duplicates
    },
  });
  ```

### skipNull (boolean)

- **Default**: `false`
- **Description**: When `true`, null values in the source object will not be mapped to the target.
- **Example**:
  ```ts
  // Source: { mission: null, crew: ["Neil"] }
  // With skipNull: true, mission property is not set on target
  // With skipNull: false, target.mission will be set to null
  ```

### skipUndefined (boolean)

- **Default**: `true`
- **Description**: When `true`, undefined values in the source object will not be mapped to the target.
- **Example**:
  ```ts
  // Source: { mission: undefined, crew: ["Neil"] }
  // With skipUndefined: true, mission property is not set on target
  // With skipUndefined: false, target.mission will be set to undefined
  ```

### jsonPathOptions (JSONPath.JSONPathOptions | null)

- **Default**: `null`
- **Description**: Additional options to pass to the underlying JSONPath library for advanced path resolution control.
- **Example**:
  ```ts
  const options: MapperOptions = {
    jsonPathOptions: {
      wrap: false,
      sandbox: {},
    },
  };
  ```

### parallelRun (boolean)

- **Default**: `false`
- **Description**: Only available on AsyncMapper. When `true`, all the mapping operations are done in parallel, which can increase mapping speed a lot, at the cost of a more _chaotic_ process.
- **Example**:
  ```ts
  const asyncMapper = new AsyncMapper(structure, { parallelRun: true });
  ```

### parallelJobsLimit (number)

- **Default**: `0` (unlimited)
- **Description**: Only available on AsyncMapper when `parallelRun` is enabled. Restricts the number of concurrent async jobs running at once. Set to `0` for unlimited parallel jobs, or a positive number to limit concurrency.
- **Example**:
  ```ts
  const asyncMapper = new AsyncMapper(structure, {
    parallelRun: true,
    parallelJobsLimit: 5, // Limit to 5 concurrent operations
  });
  ```

## Usage Examples

### Basic Configuration

```ts
const mapper = new Mapper(structure, {
  automap: true,
  skipNull: true,
  assumeRoot: true,
});
```

### Advanced Configuration

```ts
import { AutomapArrayStrategy } from "mapstronaut";

const asyncMapper = new AsyncMapper(structure, {
  automap: false,
  automapCheckType: true,
  automapArrayStrategy: AutomapArrayStrategy.Concatenate,
  skipNull: false,
  skipUndefined: false,
  parallelRun: true,
  parallelJobsLimit: 10,
  jsonPathOptions: {
    wrap: false,
  },
});
```
