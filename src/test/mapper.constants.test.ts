import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { Mapper } from "../mapper.js";
import type { Structure } from "../types/mapper.js";

describe("Mapper - Constants", () => {
  describe("constant values", () => {
    it("should map constant values", () => {
      const structure: Structure = [
        { target: "type", constant: "user" },
        { target: "status", constant: "active" },
      ];
      const mapper = new Mapper(structure);

      const source = { name: "John" };
      const result = mapper.map(source);

      assert.deepEqual(result, { type: "user", status: "active" });
    });

    it("should map constant values to nested paths", () => {
      const structure: Structure = [
        { target: "metadata.type", constant: "user" },
        { target: "metadata.version", constant: "1.0" },
      ];
      const mapper = new Mapper(structure);

      const source = { name: "John" };
      const result = mapper.map(source);

      assert.deepEqual(result, {
        metadata: {
          type: "user",
          version: "1.0",
        },
      });
    });

    it("should map different data types as constants", () => {
      const structure: Structure = [
        { target: "stringValue", constant: "hello" },
        { target: "numberValue", constant: 42 },
        { target: "booleanValue", constant: true },
        { target: "nullValue", constant: null },
        { target: "arrayValue", constant: [1, 2, 3] },
        { target: "objectValue", constant: { key: "value" } },
      ];
      const mapper = new Mapper(structure);

      const source = {};
      const result = mapper.map(source);

      assert.deepEqual(result, {
        stringValue: "hello",
        numberValue: 42,
        booleanValue: true,
        nullValue: null,
        arrayValue: [1, 2, 3],
        objectValue: { key: "value" },
      });
    });

    it("should combine constants with source mapping", () => {
      const structure: Structure = [
        ["name", "fullName"], // Source mapping
        { target: "type", constant: "user" }, // Constant
        ["age", "years"], // Source mapping
        { target: "status", constant: "active" }, // Constant
      ];
      const mapper = new Mapper(structure);

      const source = { name: "John", age: 30 };
      const result = mapper.map(source);

      assert.deepEqual(result, {
        fullName: "John",
        type: "user",
        years: 30,
        status: "active",
      });
    });

    it("should merge constants with existing target object", () => {
      const structure: Structure = [
        { target: "type", constant: "user" },
        { target: "status", constant: "active" },
      ];
      const mapper = new Mapper(structure);

      const source = {};
      const target = { existing: "data", status: "inactive" };
      const result = mapper.map(source, target);

      assert.equal(result, target); // Same reference
      assert.deepEqual(result, {
        existing: "data",
        type: "user",
        status: "active", // Should overwrite
      });
    });

    it("should work with constants and skip options", () => {
      const structure: Structure = [
        ["name", "fullName"], // This will be skipped due to undefined
        { target: "type", constant: "user" }, // This will be mapped
      ];
      const mapper = new Mapper(structure, { skipUndefined: true });

      const source = {}; // name is undefined
      const result = mapper.map(source);

      assert.deepEqual(result, { type: "user" });
    });

    it("should handle constant with value 0 and false", () => {
      const structure: Structure = [
        { target: "zeroValue", constant: 0 },
        { target: "falseValue", constant: false },
        { target: "emptyString", constant: "" },
      ];
      const mapper = new Mapper(structure);

      const source = {};
      const result = mapper.map(source);

      assert.deepEqual(result, {
        zeroValue: 0,
        falseValue: false,
        emptyString: "",
      });
    });
  });

  describe("error handling", () => {
    it("should throw error when neither source nor constant is provided", () => {
      const structure: Structure = [
        { target: "name" }, // Missing both source and constant
      ];
      const mapper = new Mapper(structure);

      const source = { name: "John" };
      assert.throws(
        () => mapper.map(source),
        /Rule must have either 'source' or 'constant' defined/,
      );
    });

    it("should not throw error when constant is provided without source", () => {
      const structure: Structure = [
        { target: "type", constant: "user" }, // Only constant, no source
      ];
      const mapper = new Mapper(structure);

      const source = { name: "John" };
      const result = mapper.map(source);

      assert.deepEqual(result, { type: "user" });
    });

    it("should prioritize constant over source when both are provided", () => {
      const structure: Structure = [
        { source: "name", target: "value", constant: "constant_value" },
      ];
      const mapper = new Mapper(structure);

      const source = { name: "source_value" };
      const result = mapper.map(source);

      assert.deepEqual(result, { value: "constant_value" });
    });
  });

  describe("complex constant scenarios", () => {
    it("should handle deeply nested constant paths", () => {
      const structure: Structure = [
        { target: "a.b.c.d.e", constant: "deep_value" },
      ];
      const mapper = new Mapper(structure);

      const source = {};
      const result = mapper.map(source);

      assert.deepEqual(result, {
        a: {
          b: {
            c: {
              d: {
                e: "deep_value",
              },
            },
          },
        },
      });
    });

    it("should handle multiple constants to the same nested object", () => {
      const structure: Structure = [
        { target: "config.app.name", constant: "MyApp" },
        { target: "config.app.version", constant: "1.0.0" },
        { target: "config.debug", constant: true },
      ];
      const mapper = new Mapper(structure);

      const source = {};
      const result = mapper.map(source);

      assert.deepEqual(result, {
        config: {
          app: {
            name: "MyApp",
            version: "1.0.0",
          },
          debug: true,
        },
      });
    });
  });
});
