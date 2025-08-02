# Automapper

The `Automapper` class automatically maps properties that exist in both source and target objects. It provides intelligent property mapping with configurable type checking and preserves existing target properties that don't have matching source properties.

## Overview

Automapper is designed to handle the common scenario where you want to update an existing object with values from another object, but only for properties that exist in both. This is particularly useful for updating configuration objects, merging partial data, or synchronizing objects with shared properties.

## Basic Usage

```typescript
import { Automapper } from "mapstronaut";

const automapper = new Automapper();

const source = { name: "John", age: 30, country: "USA" };
const target = { name: "Jane", city: "Paris" };

const result = automapper.map(source, target);
// Result: { name: "John", city: "Paris" }
// Only 'name' exists in both objects, so only 'name' is mapped
```

## Configuration

The Automapper accepts configuration options to control its behavior:

```typescript
type AutomapperConfiguration = {
  checkType: boolean; // default: true
};
```

### Type Checking

When `checkType` is enabled (default), the Automapper will only map properties if their types match:

```typescript
// With type checking (default)
const automapper = new Automapper({ checkType: true });
const source = { name: "John", age: "30" }; // age as string
const target = { name: "Jane", age: 25 }; // age as number

const result = automapper.map(source, target);
// Result: { name: "John", age: 25 }
// 'age' not mapped due to type mismatch

// Without type checking
const automapper = new Automapper({ checkType: false });
const result = automapper.map(source, target);
// Result: { name: "John", age: "30" }
// 'age' mapped despite type mismatch
```

## Core Behavior

### Property Matching

The Automapper only maps properties that exist in **both** the source and target objects:

```typescript
const source = { name: "John", age: 30, extra: "data" };
const target = { name: "Jane", city: "Paris", country: "France" };

const result = automapper.map(source, target);
// Result: { name: "John", city: "Paris", country: "France" }
// Only 'name' exists in both, so only 'name' is mapped
// Target properties 'city' and 'country' are preserved
// Source property 'extra' is ignored
```

### Handling Special Values

#### Undefined Values

Undefined values in the source are never mapped, preserving the target's original value:

```typescript
const source = { name: "John", age: undefined };
const target = { name: "Jane", age: 25 };

const result = automapper.map(source, target);
// Result: { name: "John", age: 25 }
// 'age' remains 25 because source value is undefined
```

#### Null Values

Null values are mapped normally:

```typescript
const source = { name: "John", age: null };
const target = { name: "Jane", age: 25 };

const result = automapper.map(source, target);
// Result: { name: "John", age: null }
// 'age' is set to null from source
```

### No Target Provided

When no target is provided, the Automapper returns an empty object since there are no target properties to match:

```typescript
const source = { name: "John", age: 30 };
const result = automapper.map(source);
// Result: {}
// No target properties to match against
```

## Advanced Features

### Nested Object Merging

When both source and target properties are objects (not arrays), the Automapper performs deep merging:

```typescript
const source = {
  user: { name: "John", details: { age: 30 } },
  settings: { theme: "dark" },
};

const target = {
  user: { name: "Jane", city: "Paris" },
  settings: { theme: "light", language: "en" },
};

const result = automapper.map(source, target);
// Result: {
//   user: { name: "John", details: { age: 30 }, city: "Paris" },
//   settings: { theme: "dark", language: "en" }
// }
```

### Working with Arrays

Arrays are treated as primitive values and copied entirely:

```typescript
const source = [1, 2, 3];
const result = automapper.map(source);
// Result: [1, 2, 3] (copy of the array)
```

### Class Instance Support

The Automapper works with class instances, mapping only properties that exist in both:

```typescript
class SourceClass {
  constructor(
    public name: string,
    public age: number,
  ) {}
}

class TargetClass {
  constructor(
    public name: string = "",
    public city: string = "Unknown",
  ) {}
}

const automapper = new Automapper<SourceClass, TargetClass>();
const source = new SourceClass("John", 30);
const target = new TargetClass("", "Paris");

const result = automapper.map(source, target);
// Result: { name: "John", city: "Paris" }
// Only 'name' exists in both classes
```

## API Reference

### Constructor

```typescript
constructor(configuration: Partial<AutomapperConfiguration> = {})
```

Creates a new Automapper instance with optional configuration.

### Methods

#### `map<TSource, TTarget>(source: TSource, target?: TTarget): TTarget`

Maps matching properties from source to target.

**Parameters:**

- `source`: The source object to map from
- `target`: (Optional) The target object to map to

**Returns:** The mapped result

**Throws:** Error if source is not an object

#### `getConfiguration(): AutomapperConfiguration`

Returns a copy of the current configuration.

#### `setConfiguration(configuration: Partial<AutomapperConfiguration>): void`

Updates the configuration with new values, merging with existing configuration.

## Error Handling

The Automapper throws an error if the source is not an object:

```typescript
const automapper = new Automapper();

// These will throw "Source must be an object" error
automapper.map(null);
automapper.map(undefined);
automapper.map("string");
automapper.map(123);
```

## Type Safety

The Automapper is fully typed and supports TypeScript generics:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

interface UserUpdate {
  name: string;
  lastLogin: Date;
}

const automapper = new Automapper<User, UserUpdate>();
const user: User = { id: 1, name: "John", email: "john@example.com" };
const update: UserUpdate = { name: "Jane", lastLogin: new Date() };

const result = automapper.map(user, update);
// Result is typed as UserUpdate
// Only 'name' will be mapped (exists in both interfaces)
```

## Best Practices

1. **Use type checking** for safer mappings when types should match
2. **Provide a target object** when you want to preserve existing properties
3. **Use with interfaces** to ensure type safety in TypeScript
4. **Consider the order** - source properties override target properties for matching keys
5. **Handle nested objects** carefully - deep merging occurs for object properties

## Performance Considerations

- The Automapper creates shallow copies of objects
- Deep merging only occurs for nested objects, not arrays
- Type checking adds minimal overhead
- Object key enumeration is performed once per mapping operation

## Integration with Mapper

The Automapper is used internally by the main `Mapper` class when the `automap` option is enabled, providing automatic mapping alongside custom mapping rules.
