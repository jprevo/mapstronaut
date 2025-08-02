import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { mapObject } from "../mapper.js";
import type { Structure, MapperOptions } from "../types/mapper.js";

describe("Mapper - Helper Functions", () => {
  describe("mapObject function", () => {
    it("should work as a shortcut for basic mapping", () => {
      const structure: Structure = [["name", "fullName"]];
      const source = { name: "John" };

      const result = mapObject(structure, source);

      assert.deepEqual(result, { fullName: "John" });
    });

    it("should accept custom options", () => {
      const structure: Structure = [["name", "fullName"]];
      const source = { name: null };
      const options: Partial<MapperOptions> = { skipNull: false };

      const result = mapObject(structure, source, undefined, options);

      assert.deepEqual(result, { fullName: null });
    });

    it("should accept target object", () => {
      const structure: Structure = [["name", "fullName"]];
      const source = { name: "John" };
      const target = { existing: "data" };

      const result = mapObject(structure, source, target);

      assert.equal(result, target); // Same reference
      assert.deepEqual(result, { existing: "data", fullName: "John" });
    });

    it("should accept both target and options", () => {
      const structure: Structure = [
        ["name", "fullName"],
        ["age", "years"],
      ];
      const source = { name: "John" }; // age is undefined
      const target = { existing: "data" };
      const options: Partial<MapperOptions> = { skipUndefined: false };

      const result = mapObject(structure, source, target, options);

      assert.equal(result, target); // Same reference
      assert.deepEqual(result, {
        existing: "data",
        fullName: "John",
        years: undefined, // Not skipped due to options
      });
    });

    it("should handle complex mapping with all features", () => {
      const structure: Structure = [
        ["user.name", "profile.fullName"], // Nested source and target
        { target: "type", constant: "user" }, // Constant
        {
          source: "user.age",
          target: "profile.age",
          defaultValue: 0,
        }, // Default value
        ["user.email", "contact.email"], // Nested target
      ];
      const source = {
        user: {
          name: "John",
          email: "john@example.com",
          // age is missing - will use default
        },
      };

      const result = mapObject(structure, source);

      assert.deepEqual(result, {
        profile: {
          fullName: "John",
          age: 0, // Default value used
        },
        type: "user", // Constant
        contact: {
          email: "john@example.com",
        },
      });
    });

    it("should work with array notation mapping", () => {
      const structure: Structure = [
        ["items[0].name", "firstItem"],
        ["items[1].name", "secondItem"],
      ];
      const source = {
        items: [{ name: "first" }, { name: "second" }],
      };

      const result = mapObject(structure, source);

      assert.deepEqual(result, {
        firstItem: "first",
        secondItem: "second",
      });
    });

    it("should handle empty structure", () => {
      const structure: Structure = [];
      const source = { name: "John", age: 30 };

      const result = mapObject(structure, source);

      assert.deepEqual(result, {});
    });

    it("should handle empty source", () => {
      const structure: Structure = [
        { target: "type", constant: "user" }, // Only constants should work
        ["name", "fullName"], // This will be skipped (undefined)
      ];
      const source = {};

      const result = mapObject(structure, source);

      assert.deepEqual(result, { type: "user" });
    });

    it("should preserve target object structure when provided", () => {
      const structure: Structure = [["name", "user.name"]];
      const source = { name: "John" };
      const target = {
        user: { existing: "data" },
        other: { nested: { value: "keep" } },
      };

      const result = mapObject(structure, source, target);

      assert.equal(result, target); // Same reference
      assert.deepEqual(result, {
        user: { existing: "data", name: "John" },
        other: { nested: { value: "keep" } },
      });
    });

    it("should work with different option combinations", () => {
      const structure: Structure = [
        ["nullValue", "null"],
        ["undefinedValue", "undefined"],
        ["normalValue", "normal"],
      ];
      const source = {
        nullValue: null,
        normalValue: "exists",
        // undefinedValue is missing
      };

      // Test skipNull: true, skipUndefined: false
      const result1 = mapObject(structure, source, undefined, {
        skipNull: true,
        skipUndefined: false,
      });
      assert.deepEqual(result1, {
        undefined: undefined,
        normal: "exists",
      });

      // Test skipNull: false, skipUndefined: true
      const result2 = mapObject(structure, source, undefined, {
        skipNull: false,
        skipUndefined: true,
      });
      assert.deepEqual(result2, {
        null: null,
        normal: "exists",
      });

      // Test both false
      const result3 = mapObject(structure, source, undefined, {
        skipNull: false,
        skipUndefined: false,
      });
      assert.deepEqual(result3, {
        null: null,
        undefined: undefined,
        normal: "exists",
      });
    });

    it("should handle TypeScript typed objects", () => {
      interface Source {
        firstName: string;
        lastName: string;
        age?: number;
      }

      interface Target {
        fullName: string;
        years: number;
        type: string;
      }

      const structure: Structure = [
        ["firstName", "fullName"], // This will be overwritten by transform below
        ["age", "years"],
        { target: "type", constant: "person" },
      ];

      const source: Source = {
        firstName: "John",
        lastName: "Doe",
        age: 30,
      };

      const result = mapObject<Source, Target>(structure, source);

      // TypeScript should enforce the return type
      const typedResult: Target = result;
      assert.deepEqual(typedResult, {
        fullName: "John",
        years: 30,
        type: "person",
      });
    });
  });

  describe("error scenarios", () => {
    it("should propagate errors from structure validation", () => {
      const structure: Structure = [
        { target: "name" }, // Missing both source and constant
      ];
      const source = { name: "John" };

      assert.throws(
        () => mapObject(structure, source),
        /Rule must have either 'source' or 'constant' defined/,
      );
    });

    it("should handle invalid target paths gracefully via Outpath", () => {
      const structure: Structure = [["name", ""]]; // Empty target path
      const source = { name: "John" };

      assert.throws(() => mapObject(structure, source), /Path cannot be empty/);
    });
  });
});
