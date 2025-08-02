# Outpath

The `Outpath` class is an internal utility class that enables writing properties and subproperties in objects using
dot-separated path notation. It provides a convenient way to set deeply nested object properties without worrying about
creating intermediate objects.

## Overview

Outpath allows you to write to nested object properties using a string path notation similar to JavaScript object
property access, but with additional features like escaped dot support and automatic object creation.

## Class Signature

```typescript
export class Outpath<T = UnknownTarget>
```

### Generic Type Parameter

- `T`: The type of the target object being modified. Defaults to `UnknownTarget` (which is `any`)

## Methods

### `write(target: T, path: string, value: any): void`

Writes a value to a specified path in the target object, creating intermediate objects as needed.

#### Parameters

- `target`: The object to write to
- `path`: A dot-separated string representing the property path
- `value`: The value to assign to the property

#### Behavior

- Creates intermediate objects if they don't exist
- Replaces `null` or `undefined` intermediate objects with empty objects
- Overwrites existing values at the target path
- Supports all JavaScript value types (primitives, objects, arrays)

## Path Syntax

### Basic Dot Notation

Use dots (`.`) to separate nested property names:

```typescript
const obj = {};
const outpath = new Outpath();

outpath.write(obj, "user.name", "John");
// Creates: { user: { name: "John" } }

outpath.write(obj, "user.profile.age", 25);
// Creates: { user: { name: "John", profile: { age: 25 } } }
```

### Escaped Dots

When property names contain actual dots, escape them with a backslash (`\.`):

```typescript
const obj = {};
const outpath = new Outpath();

outpath.write(obj, "server\\.config", "production");
// Creates: { "server.config": "production" }

outpath.write(obj, "app.database\\.host", "localhost");
// Creates: { app: { "database.host": "localhost" } }
```

### Path Validation

- Empty paths throw an error
- Paths with empty segments (consecutive dots, leading/trailing dots) throw an error
- Valid examples: `"name"`, `"user.name"`, `"user\\.name"`
- Invalid examples: `""`, `".name"`, `"name."`, `"user..name"`

## Usage Examples

### Basic Usage

```typescript
import { Outpath } from "mapstronaut";

const obj = {};
const outpath = new Outpath();

outpath.write(obj, "name", "John");
console.log(obj.name); // "John"
```

### Nested Properties

```typescript
const obj = {};
const outpath = new Outpath();

outpath.write(obj, "user.profile.details.age", 25);
console.log(obj.user.profile.details.age); // 25
```

### TypeScript Support

```typescript
interface MyTarget {
  first?: {
    a?: string;
    b?: {
      test?: boolean;
    };
  };
}

const obj: MyTarget = {};
const outpath = new Outpath<MyTarget>();

outpath.write(obj, "first.a", "demo");
outpath.write(obj, "first.b.test", false);

console.log(obj.first?.a); // "demo"
console.log(obj.first?.b?.test); // false
```

### Working with Class Instances

```typescript
class User {
  public name?: string;
  public settings?: {
    theme?: string;
  };
}

const user = new User();
const outpath = new Outpath<User>();

outpath.write(user, "name", "Alice");
outpath.write(user, "settings.theme", "dark");

console.log(user.name); // "Alice"
console.log(user.settings?.theme); // "dark"
```

### Handling Different Value Types

```typescript
const obj = {};
const outpath = new Outpath();

// Primitives
outpath.write(obj, "string", "hello");
outpath.write(obj, "number", 42);
outpath.write(obj, "boolean", true);
outpath.write(obj, "null", null);
outpath.write(obj, "undefined", undefined);

// Complex types
outpath.write(obj, "array", [1, 2, 3]);
outpath.write(obj, "object", { nested: "value" });
```

### Property Names with Dots

```typescript
const obj = {};
const outpath = new Outpath();

// Property name contains actual dots
outpath.write(obj, "config\\.file\\.name", "app.json");
console.log(obj["config.file.name"]); // "app.json"

// Mixed escaped and regular dots
outpath.write(obj, "app.database\\.host.port", 5432);
console.log(obj.app["database.host"].port); // 5432
```

### Preserving Existing Properties

```typescript
const obj = { user: { name: "John" } };
const outpath = new Outpath();

outpath.write(obj, "user.age", 30);
outpath.write(obj, "user.email", "john@example.com");

console.log(obj.user.name); // "John" (preserved)
console.log(obj.user.age); // 30
console.log(obj.user.email); // "john@example.com"
```

## Error Handling

The `write` method throws errors in the following cases:

### Empty Path

```typescript
const outpath = new Outpath();
outpath.write({}, "", "value"); // Throws: "Path cannot be empty"
```

### Invalid Path Segments

```typescript
const outpath = new Outpath();

// Leading dot
outpath.write({}, ".user", "value"); // Throws: "Invalid path: path cannot contain empty segments"

// Trailing dot
outpath.write({}, "user.", "value"); // Throws: "Invalid path: path cannot contain empty segments"

// Consecutive dots
outpath.write({}, "user..name", "value"); // Throws: "Invalid path: path cannot contain empty segments"
```

## Implementation Notes

### Path Parsing

The class uses a custom `parseSegments` method that:

- Handles escaped dots by treating `\.` as a literal dot character
- Splits paths on unescaped dots
- Validates that no empty segments exist
- Preserves backslashes that don't escape dots

### Object Creation

When creating intermediate objects:

- Missing properties are created as empty objects (`{}`)
- `null` and `undefined` values are replaced with empty objects
- Existing objects are preserved and extended

### Type Safety

When used with TypeScript:

- Generic type parameter provides compile-time type checking
- Works with interfaces, classes, and type aliases
- Supports optional properties and nested structures

## Integration with Mapstronaut

Outpath is used internally by the Mapper class to write mapped values to target objects. It enables the flexible target
property specification in mapping rules, allowing you to map source data to any nested location in the target object
structure.

## Performance Considerations

- Path parsing is performed on each write operation
- For high-frequency operations, consider caching Outpath instances
- Intermediate object creation has minimal overhead
- No dependencies on external libraries
