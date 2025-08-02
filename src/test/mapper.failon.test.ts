import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { Mapper, mapObject } from "../mapper.js";
import type { Structure } from "../types/mapper.js";

describe("Mapper failOn functionality", () => {
  describe("failOn with source rules", () => {
    it("should throw error when failOn returns false", () => {
      const source = { name: "John", age: 17 };
      const structure: Structure = [
        {
          source: "age",
          target: "userAge",
          failOn: (data) => data >= 18, // Fail if under 18
        },
      ];

      const mapper = new Mapper(structure);

      assert.throws(
        () => mapper.map(source),
        /Mapping failed: condition failed for rule with target 'userAge'/,
      );
    });

    it("should complete mapping when failOn returns true", () => {
      const source = { name: "John", age: 25 };
      const structure: Structure = [
        {
          source: "age",
          target: "userAge",
          failOn: (data) => data >= 18, // Pass if 18 or older
        },
      ];

      const mapper = new Mapper(structure);
      const result = mapper.map(source);

      assert.deepEqual(result, { userAge: 25 });
    });

    it("should pass data, source, and target to failOn function", () => {
      const source = { name: "John", age: 25 };
      const target = { existingField: "exists" };
      let receivedData: any;
      let receivedSource: any;
      let receivedTarget: any;

      const structure: Structure = [
        {
          source: "age",
          target: "userAge",
          failOn: (data, src, tgt) => {
            receivedData = data;
            receivedSource = src;
            receivedTarget = tgt;
            return true; // Always pass
          },
        },
      ];

      const mapper = new Mapper(structure);
      mapper.map(source, target);

      assert.equal(receivedData, 25);
      assert.deepEqual(receivedSource, source);
      assert.deepEqual(receivedTarget, target);
    });

    it("should apply failOn after transform", () => {
      const source = { score: "85" };
      const structure: Structure = [
        {
          source: "score",
          target: "numericScore",
          transform: (data) => parseInt(data), // Convert string to number
          failOn: (data) => data >= 90, // Fail if less than 90 after transform
        },
      ];

      const mapper = new Mapper(structure);

      assert.throws(
        () => mapper.map(source),
        /Mapping failed: condition failed for rule with target 'numericScore'/,
      );
    });

    it("should work with defaultValue", () => {
      const source = { name: "John" }; // age is missing
      const structure: Structure = [
        {
          source: "age",
          target: "userAge",
          defaultValue: 16,
          failOn: (data) => data >= 18, // Fail if under 18
        },
      ];

      const mapper = new Mapper(structure);

      assert.throws(
        () => mapper.map(source),
        /Mapping failed: condition failed for rule with target 'userAge'/,
      );
    });

    it("should work with nested paths", () => {
      const source = {
        user: {
          profile: {
            score: 45,
          },
        },
      };

      const structure: Structure = [
        {
          source: "user.profile.score",
          target: "finalScore",
          failOn: (data) => data >= 50, // Fail if less than 50
        },
      ];

      const mapper = new Mapper(structure);

      assert.throws(
        () => mapper.map(source),
        /Mapping failed: condition failed for rule with target 'finalScore'/,
      );
    });
  });

  describe("failOn with constant rules", () => {
    it("should throw error when failOn returns false for constant", () => {
      const source = { name: "John" };
      const structure: Structure = [
        {
          constant: "guest",
          target: "role",
          failOn: (data) => data === "admin", // Fail if not admin
        },
      ];

      const mapper = new Mapper(structure);

      assert.throws(
        () => mapper.map(source),
        /Mapping failed: condition failed for rule with target 'role'/,
      );
    });

    it("should complete mapping when failOn returns true for constant", () => {
      const source = { name: "John" };
      const structure: Structure = [
        {
          constant: "admin",
          target: "role",
          failOn: (data) => data === "admin", // Pass if admin
        },
      ];

      const mapper = new Mapper(structure);
      const result = mapper.map(source);

      assert.deepEqual(result, { role: "admin" });
    });

    it("should apply failOn after transform for constant", () => {
      const source = { name: "John" };
      const structure: Structure = [
        {
          constant: "user",
          target: "role",
          transform: (data) => data.toUpperCase(), // Transform to uppercase
          failOn: (data) => data === "ADMIN", // Fail if not ADMIN after transform
        },
      ];

      const mapper = new Mapper(structure);

      assert.throws(
        () => mapper.map(source),
        /Mapping failed: condition failed for rule with target 'role'/,
      );
    });
  });

  describe("failOn with other rule features", () => {
    it("should not call failOn when filter returns false", () => {
      const source = { name: "John", age: 17 };
      let failOnCalled = false;

      const structure: Structure = [
        {
          source: "age",
          target: "userAge",
          filter: (data) => data >= 18, // Filter out under 18
          failOn: (data) => {
            failOnCalled = true;
            return data >= 21; // This should not be called
          },
        },
      ];

      const mapper = new Mapper(structure);
      const result = mapper.map(source);

      assert.deepEqual(result, {});
      assert.equal(failOnCalled, false);
    });

    it("should work with multiple rules and stop on first failure", () => {
      const source = { name: "John", age: 17, score: 95 };
      const structure: Structure = [
        {
          source: "age",
          target: "userAge",
          failOn: (data) => data >= 18, // This will fail
        },
        {
          source: "score",
          target: "userScore", // This should not be processed
        },
      ];

      const mapper = new Mapper(structure);

      assert.throws(
        () => mapper.map(source),
        /Mapping failed: condition failed for rule with target 'userAge'/,
      );
    });
  });

  describe("failOn with mapObject function", () => {
    it("should work with mapObject function", () => {
      const source = { name: "John", age: 17 };
      const structure: Structure = [
        {
          source: "age",
          target: "userAge",
          failOn: (data) => data >= 18, // Fail if under 18
        },
      ];

      assert.throws(
        () => mapObject(structure, source),
        /Mapping failed: condition failed for rule with target 'userAge'/,
      );
    });
  });

  describe("failOn error handling", () => {
    it("should include target field name in error message", () => {
      const source = { value: 10 };
      const structure: Structure = [
        {
          source: "value",
          target: "deeply.nested.field",
          failOn: () => false,
        },
      ];

      const mapper = new Mapper(structure);

      assert.throws(
        () => mapper.map(source),
        /Mapping failed: condition failed for rule with target 'deeply.nested.field'/,
      );
    });

    it("should handle failOn function throwing an error", () => {
      const source = { value: 10 };
      const structure: Structure = [
        {
          source: "value",
          target: "field",
          failOn: () => {
            throw new Error("Custom failOn error");
          },
        },
      ];

      const mapper = new Mapper(structure);

      assert.throws(() => mapper.map(source), /Custom failOn error/);
    });
  });
});
