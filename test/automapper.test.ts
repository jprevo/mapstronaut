import * as assert from "assert";
import { Automapper } from "../src/automapper.js";

describe("Automapper", function () {
  describe("constructor", function () {
    it("should create with default configuration", function () {
      const automapper = new Automapper();
      const config = automapper.getConfiguration();
      assert.strictEqual(config.checkType, false);
    });

    it("should create with custom configuration", function () {
      const automapper = new Automapper({ checkType: false });
      const config = automapper.getConfiguration();
      assert.strictEqual(config.checkType, false);
    });

    it("should merge partial configuration with defaults", function () {
      const automapper = new Automapper({});
      const config = automapper.getConfiguration();
      assert.strictEqual(config.checkType, false);
    });
  });

  describe("map", function () {
    it("should return empty object when no target provided", function () {
      const automapper = new Automapper();
      const source = { name: "John", age: 30 };
      const result = automapper.map(source);

      assert.deepStrictEqual(result, {});
    });

    it("should only map matching properties from source to target", function () {
      const automapper = new Automapper();
      const source = { name: "John", age: 30, country: "USA" };
      const target = { name: "Jane", city: "Paris" };
      const result = automapper.map(source, target);

      // Only 'name' exists in both, so only 'name' should be mapped
      assert.deepStrictEqual(result, { name: "John", city: "Paris" });
    });

    it("should skip undefined values in matching properties", function () {
      const automapper = new Automapper();
      const source = { name: "John", age: undefined, city: "Paris" };
      const target = { name: "Jane", age: 25, country: "France" };
      const result = automapper.map(source, target);

      // 'name' maps, 'age' is undefined so skipped, 'city' doesn't exist in target
      assert.deepStrictEqual(result, {
        name: "John",
        age: 25,
        country: "France",
      });
      assert.strictEqual(result.age, 25); // Original target value preserved
    });

    it("should map null values for matching properties", function () {
      const automapper = new Automapper();
      const source = { name: "John", age: null };
      const target = { name: "Jane", age: 25 };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result, { name: "John", age: null });
    });

    it("should throw error for non-object source", function () {
      const automapper = new Automapper();

      assert.throws(() => automapper.map(null), /Source must be an object/);
      assert.throws(
        () => automapper.map(undefined),
        /Source must be an object/,
      );
      assert.throws(() => automapper.map("string"), /Source must be an object/);
      assert.throws(() => automapper.map(123), /Source must be an object/);
    });

    it("should handle arrays as source", function () {
      const automapper = new Automapper();
      const source = [1, 2, 3];
      const result = automapper.map(source);

      assert.deepStrictEqual(result, [1, 2, 3]);
    });
  });

  describe("type checking", function () {
    it("should respect type checking when enabled", function () {
      const automapper = new Automapper({ checkType: true });
      const source = { name: "John", age: "30" }; // age as string
      const target = { name: "Jane", age: 25 }; // age as number
      const result = automapper.map(source, target);

      // Should map name (both strings) but not age (types don't match)
      assert.deepStrictEqual(result, { name: "John", age: 25 });
    });

    it("should ignore type checking when disabled", function () {
      const automapper = new Automapper({ checkType: false });
      const source = { name: "John", age: "30" }; // age as string
      const target = { name: "Jane", age: 25 }; // age as number
      const result = automapper.map(source, target);

      // Should map both properties despite age type mismatch
      assert.deepStrictEqual(result, { name: "John", age: "30" });
    });

    it("should only map properties that exist in both objects", function () {
      const automapper = new Automapper({ checkType: true });
      const source = { name: "John", city: "Paris" };
      const target = { age: 25, country: "France" };
      const result = automapper.map(source, target);

      // No matching properties, so target unchanged
      assert.deepStrictEqual(result, { age: 25, country: "France" });
    });

    it("should map matching types when type checking enabled", function () {
      const automapper = new Automapper({ checkType: true });
      const source = { name: "John", age: 30 };
      const target = { name: "Jane", age: 25, city: "London" };
      const result = automapper.map(source, target);

      // Both name and age exist in both objects and have matching types
      assert.deepStrictEqual(result, { name: "John", age: 30, city: "London" });
    });
  });

  describe("configuration management", function () {
    it("should get configuration copy", function () {
      const automapper = new Automapper({ checkType: false });
      const config1 = automapper.getConfiguration();
      const config2 = automapper.getConfiguration();

      assert.notStrictEqual(config1, config2); // Different objects
      assert.deepStrictEqual(config1, config2); // Same content
    });

    it("should set configuration", function () {
      const automapper = new Automapper({ checkType: true });

      automapper.setConfiguration({ checkType: false });
      const config = automapper.getConfiguration();

      assert.strictEqual(config.checkType, false);
    });

    it("should merge configuration when setting", function () {
      const automapper = new Automapper({ checkType: true });

      automapper.setConfiguration({});
      const config = automapper.getConfiguration();

      assert.strictEqual(config.checkType, true);
    });
  });

  describe("complex objects", function () {
    it("should map nested objects when properties match", function () {
      const automapper = new Automapper();
      const source = {
        user: { name: "John", details: { age: 30 } },
        settings: { theme: "dark" },
        extra: "not mapped",
      };
      const target = {
        user: { name: "Jane", city: "Paris" },
        settings: { theme: "light", language: "en" },
      };
      const result = automapper.map(source, target);

      // Only user and settings are mapped (matching properties)
      // details won't be added because it doesn't exist in the target's user object
      assert.deepStrictEqual(result, {
        user: { name: "John", city: "Paris" },
        settings: { theme: "dark", language: "en" },
      });
    });

    it("should work with class instances", function () {
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

      // Only properties that exist in both should be mapped (just 'name')
      assert.strictEqual(result.name, "John");
      assert.strictEqual((result as any).age, undefined);
      assert.strictEqual(result.city, "Paris");
    });
  });
});
