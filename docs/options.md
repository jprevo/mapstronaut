# Mapper Options

This document explains the various configuration options available when using Mapstronaut's Mapper and AsyncMapper classes.

## Quick Reference

| Option | Default | Description |
|--------|---------|-------------|
| `assumeRoot` | `true` | Automatically adds `$.` to JSONPath entries if not present |
| `automap` | `true` | Enables automatic mapping of matching property names |
| `automapCheckType` | `false` | Verifies type compatibility during automapping |
| `skipNull` | `false` | Skips mapping null values from source |
| `skipUndefined` | `true` | Skips mapping undefined values from source |
| `jsonPathOptions` | `null` | Additional options for JSONPath library |
| `parallelRun` | `false` | Runs async operations in parallel (AsyncMapper only) |

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
      sandbox: {}
    }
  };
  ```

### parallelRun (boolean)
- **Default**: `false`
- **Description**: Only available on AsyncMapper. When `true`, all the mapping operations are done in parallel, which can increase mapping speed a lot, at the cost of a more *chaotic* process.
- **Example**:
  ```ts
  const asyncMapper = new AsyncMapper(structure, { parallelRun: true });
  ```

## Usage Examples

### Basic Configuration
```ts
const mapper = new Mapper(structure, {
  automap: true,
  skipNull: true,
  assumeRoot: true
});
```

### Advanced Configuration
```ts
const asyncMapper = new AsyncMapper(structure, {
  automap: false,
  automapCheckType: true,
  skipNull: false,
  skipUndefined: false,
  parallelRun: true,
  jsonPathOptions: {
    wrap: false
  }
});
```

### Space Mission Example
```ts
// Mapping satellite telemetry data
const telemetryMapper = new Mapper(telemetryStructure, {
  automap: true,           // Auto-map common fields like timestamp, altitude
  skipNull: true,          // Ignore null sensor readings
  skipUndefined: true,     // Ignore undefined measurements
  automapCheckType: true   // Ensure data types match for safety-critical systems
});

const satellite = telemetryMapper.map(rawTelemetry);
```