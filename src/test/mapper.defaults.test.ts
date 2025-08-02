import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { Mapper } from "../mapper.js";
import type { Structure } from "../types/mapper.js";

describe("Mapper - Default Values", () => {
  describe("default value handling", () => {
    it("should use default value when source is null", () => {
      const structure: Structure = [
        { source: "name", target: "fullName", defaultValue: "Unknown" },
      ];
      const mapper = new Mapper(structure);

      const source = { name: null };
      const result = mapper.map(source);

      assert.deepEqual(result, { fullName: "Unknown" });
    });

    it("should use default value when source is undefined", () => {
      const structure: Structure = [
        { source: "name", target: "fullName", defaultValue: "Unknown" },
      ];
      const mapper = new Mapper(structure);

      const source = {};
      const result = mapper.map(source);

      assert.deepEqual(result, { fullName: "Unknown" });
    });

    it("should use source value when it exists and is not null/undefined", () => {
      const structure: Structure = [
        { source: "name", target: "fullName", defaultValue: "Unknown" },
      ];
      const mapper = new Mapper(structure);

      const source = { name: "John" };
      const result = mapper.map(source);

      assert.deepEqual(result, { fullName: "John" });
    });

    it("should handle default value with falsy but defined source values", () => {
      const structure: Structure = [
        { source: "count", target: "total", defaultValue: 100 },
        { source: "active", target: "isActive", defaultValue: true },
        { source: "message", target: "text", defaultValue: "default message" },
      ];
      const mapper = new Mapper(structure);

      const source = { count: 0, active: false, message: "" };
      const result = mapper.map(source);

      // Should use source values, not defaults, because they are defined (not null/undefined)
      assert.deepEqual(result, { total: 0, isActive: false, text: "" });
    });

    it("should map default values to nested paths", () => {
      const structure: Structure = [
        {
          source: "user.name",
          target: "profile.fullName",
          defaultValue: "Anonymous",
        },
        {
          source: "user.settings.theme",
          target: "config.theme",
          defaultValue: "light",
        },
      ];
      const mapper = new Mapper(structure);

      const source = { user: {} }; // Missing nested properties
      const result = mapper.map(source);

      assert.deepEqual(result, {
        profile: { fullName: "Anonymous" },
        config: { theme: "light" },
      });
    });

    it("should handle different data types as default values", () => {
      const structure: Structure = [
        { source: "stringValue", target: "str", defaultValue: "default" },
        { source: "numberValue", target: "num", defaultValue: 42 },
        { source: "booleanValue", target: "bool", defaultValue: true },
        { source: "arrayValue", target: "arr", defaultValue: [1, 2, 3] },
        {
          source: "objectValue",
          target: "obj",
          defaultValue: { key: "value" },
        },
        { source: "nullValue", target: "nullVal", defaultValue: "not null" },
      ];
      const mapper = new Mapper(structure);

      const source = {}; // All values are undefined
      const result = mapper.map(source);

      assert.deepEqual(result, {
        str: "default",
        num: 42,
        bool: true,
        arr: [1, 2, 3],
        obj: { key: "value" },
        nullVal: "not null",
      });
    });

    it("should combine default values with source mapping", () => {
      const structure: Structure = [
        ["name", "fullName"], // Regular source mapping
        {
          source: "age",
          target: "years",
          defaultValue: 0,
        }, // Default for missing age
        ["email", "contact"], // Regular source mapping
        {
          source: "phone",
          target: "phoneNumber",
          defaultValue: "N/A",
        }, // Default for missing phone
      ];
      const mapper = new Mapper(structure);

      const source = { name: "John", email: "john@example.com" }; // age and phone missing
      const result = mapper.map(source);

      assert.deepEqual(result, {
        fullName: "John",
        years: 0,
        contact: "john@example.com",
        phoneNumber: "N/A",
      });
    });

    it("should work with constants and default values together", () => {
      const structure: Structure = [
        { target: "type", constant: "user" }, // Constant
        {
          source: "name",
          target: "fullName",
          defaultValue: "Anonymous",
        }, // Default
        ["email", "contact"], // Regular mapping
      ];
      const mapper = new Mapper(structure);

      const source = { email: "john@example.com" }; // name missing
      const result = mapper.map(source);

      assert.deepEqual(result, {
        type: "user",
        fullName: "Anonymous",
        contact: "john@example.com",
      });
    });
  });

  describe("default values with skip options", () => {
    it("should apply default value and then respect skip options", () => {
      const structure: Structure = [
        {
          source: "value",
          target: "result",
          defaultValue: null,
        }, // Default is null
      ];
      const mapper = new Mapper(structure, { skipNull: true });

      const source = {}; // value is undefined, will get default null, then skipped
      const result = mapper.map(source);

      assert.deepEqual(result, {}); // Should be empty because null is skipped
    });

    it("should apply default value and then respect skipUndefined", () => {
      const structure: Structure = [
        {
          source: "value",
          target: "result",
          defaultValue: undefined,
        }, // Default is undefined
      ];
      const mapper = new Mapper(structure, { skipUndefined: true });

      const source = {}; // value is undefined, gets default undefined, then skipped
      const result = mapper.map(source);

      assert.deepEqual(result, {}); // Should be empty because undefined is skipped
    });

    it("should not skip default values when skip options are false", () => {
      const structure: Structure = [
        {
          source: "nullValue",
          target: "null",
          defaultValue: null,
        },
        {
          source: "undefinedValue",
          target: "undefined",
          defaultValue: undefined,
        },
      ];
      const mapper = new Mapper(structure, {
        skipNull: false,
        skipUndefined: false,
      });

      const source = {}; // Both values missing, will use defaults
      const result = mapper.map(source);

      assert.deepEqual(result, { null: null, undefined: undefined });
    });
  });

  describe("edge cases", () => {
    it("should handle default value of 0 correctly", () => {
      const structure: Structure = [
        { source: "count", target: "total", defaultValue: 0 },
      ];
      const mapper = new Mapper(structure);

      const source = {}; // count is undefined
      const result = mapper.map(source);

      assert.deepEqual(result, { total: 0 });
    });

    it("should handle default value of false correctly", () => {
      const structure: Structure = [
        { source: "active", target: "isActive", defaultValue: false },
      ];
      const mapper = new Mapper(structure);

      const source = {}; // active is undefined
      const result = mapper.map(source);

      assert.deepEqual(result, { isActive: false });
    });

    it("should handle default value of empty string correctly", () => {
      const structure: Structure = [
        { source: "message", target: "text", defaultValue: "" },
      ];
      const mapper = new Mapper(structure);

      const source = {}; // message is undefined
      const result = mapper.map(source);

      assert.deepEqual(result, { text: "" });
    });

    it("should not use default value when source exists with null and skipNull is false", () => {
      const structure: Structure = [
        { source: "name", target: "fullName", defaultValue: "Unknown" },
      ];
      const mapper = new Mapper(structure, { skipNull: false });

      const source = { name: null };
      const result = mapper.map(source);

      // Should use default value because source is null
      assert.deepEqual(result, { fullName: "Unknown" });
    });

    it("should handle deeply nested source paths with default values", () => {
      const structure: Structure = [
        {
          source: "a.b.c.d.e",
          target: "result",
          defaultValue: "deep_default",
        },
      ];
      const mapper = new Mapper(structure);

      const source = { a: { b: {} } }; // Path doesn't go deep enough
      const result = mapper.map(source);

      assert.deepEqual(result, { result: "deep_default" });
    });

    it("should merge default values with existing target object", () => {
      const structure: Structure = [
        { source: "name", target: "fullName", defaultValue: "Unknown" },
        { source: "age", target: "years", defaultValue: 0 },
      ];
      const mapper = new Mapper(structure);

      const source = {}; // Both values missing
      const target = { existing: "data", fullName: "old" };
      const result = mapper.map(source, target);

      assert.equal(result, target); // Same reference
      assert.deepEqual(result, {
        existing: "data",
        fullName: "Unknown", // Should overwrite with default
        years: 0,
      });
    });
  });
});
