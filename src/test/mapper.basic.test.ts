import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { Mapper } from "../mapper.js";
import type { Structure } from "../types/mapper.js";

describe("Mapper - Basic Mapping", () => {
  describe("simple mapping", () => {
    it("should map simple properties using array notation", () => {
      const structure: Structure = [
        ["name", "fullName"],
        ["age", "years"],
      ];
      const mapper = new Mapper(structure);

      const source = { name: "John", age: 30 };
      const result = mapper.map(source);

      assert.deepEqual(result, { fullName: "John", years: 30 });
    });

    it("should map simple properties using object notation", () => {
      const structure: Structure = [
        { source: "name", target: "fullName" },
        { source: "age", target: "years" },
      ];
      const mapper = new Mapper(structure);

      const source = { name: "John", age: 30 };
      const result = mapper.map(source);

      assert.deepEqual(result, { fullName: "John", years: 30 });
    });
  });

  describe("nested mapping", () => {
    it("should map nested properties from source", () => {
      const structure: Structure = [
        ["user.name", "name"],
        ["user.profile.age", "age"],
      ];
      const mapper = new Mapper(structure);

      const source = {
        user: {
          name: "John",
          profile: { age: 30 },
        },
      };
      const result = mapper.map(source);

      assert.deepEqual(result, { name: "John", age: 30 });
    });

    it("should map to nested target properties", () => {
      const structure: Structure = [
        ["name", "user.fullName"],
        ["age", "user.details.age"],
      ];
      const mapper = new Mapper(structure);

      const source = { name: "John", age: 30 };
      const result = mapper.map(source);

      assert.deepEqual(result, {
        user: {
          fullName: "John",
          details: { age: 30 },
        },
      });
    });

    it("should handle deeply nested source and target paths", () => {
      const structure: Structure = [
        ["data.user.info.name", "result.person.fullName"],
        ["data.user.info.details.age", "result.person.age"],
      ];
      const mapper = new Mapper(structure);

      const source = {
        data: {
          user: {
            info: {
              name: "John",
              details: { age: 30 },
            },
          },
        },
      };
      const result = mapper.map(source);

      assert.deepEqual(result, {
        result: {
          person: {
            fullName: "John",
            age: 30,
          },
        },
      });
    });
  });

  describe("target object handling", () => {
    it("should merge with existing target object", () => {
      const structure: Structure = [["name", "fullName"]];
      const mapper = new Mapper(structure);

      const source = { name: "John" };
      const target = { existing: "data", fullName: "old" };
      const result = mapper.map(source, target);

      assert.equal(result, target); // Same reference
      assert.deepEqual(result, { existing: "data", fullName: "John" });
    });

    it("should preserve existing nested properties when mapping", () => {
      const structure: Structure = [["name", "user.name"]];
      const mapper = new Mapper(structure);

      const source = { name: "John" };
      const target = { user: { existing: "data" }, other: "value" };
      const result = mapper.map(source, target);

      assert.equal(result, target); // Same reference
      assert.deepEqual(result, {
        user: { existing: "data", name: "John" },
        other: "value",
      });
    });

    it("should create new target object when none provided", () => {
      const structure: Structure = [["name", "fullName"]];
      const mapper = new Mapper(structure);

      const source = { name: "John" };
      const result = mapper.map(source);

      assert.deepEqual(result, { fullName: "John" });
    });
  });

  describe("data types", () => {
    it("should handle string values", () => {
      const structure: Structure = [["name", "fullName"]];
      const mapper = new Mapper(structure);

      const source = { name: "John Doe" };
      const result = mapper.map(source);

      assert.deepEqual(result, { fullName: "John Doe" });
    });

    it("should handle number values", () => {
      const structure: Structure = [
        ["age", "years"],
        ["score", "points"],
      ];
      const mapper = new Mapper(structure);

      const source = { age: 30, score: 95.5 };
      const result = mapper.map(source);

      assert.deepEqual(result, { years: 30, points: 95.5 });
    });

    it("should handle boolean values", () => {
      const structure: Structure = [
        ["isActive", "active"],
        ["isVerified", "verified"],
      ];
      const mapper = new Mapper(structure);

      const source = { isActive: true, isVerified: false };
      const result = mapper.map(source);

      assert.deepEqual(result, { active: true, verified: false });
    });

    it("should handle array values", () => {
      const structure: Structure = [["tags", "categories"]];
      const mapper = new Mapper(structure);

      const source = { tags: ["work", "personal", "urgent"] };
      const result = mapper.map(source);

      assert.deepEqual(result, { categories: ["work", "personal", "urgent"] });
    });

    it("should handle object values", () => {
      const structure: Structure = [["metadata", "info"]];
      const mapper = new Mapper(structure);

      const source = {
        metadata: {
          created: "2023-01-01",
          author: "John",
        },
      };
      const result = mapper.map(source);

      assert.deepEqual(result, {
        info: {
          created: "2023-01-01",
          author: "John",
        },
      });
    });

    it("should handle null values", () => {
      const structure: Structure = [["value", "result"]];
      const mapper = new Mapper(structure, { skipNull: false });

      const source = { value: null };
      const result = mapper.map(source);

      assert.deepEqual(result, { result: null });
    });
  });

  describe("mixed structures", () => {
    it("should handle mixed array and object rule notations", () => {
      const structure: Structure = [
        ["name", "fullName"], // Array notation
        { source: "age", target: "years" }, // Object notation
        ["email", "contact.email"], // Array with nested target
        { source: "address.city", target: "location" }, // Object with nested source
      ];
      const mapper = new Mapper(structure);

      const source = {
        name: "John",
        age: 30,
        email: "john@example.com",
        address: { city: "New York" },
      };
      const result = mapper.map(source);

      assert.deepEqual(result, {
        fullName: "John",
        years: 30,
        contact: { email: "john@example.com" },
        location: "New York",
      });
    });
  });
});
