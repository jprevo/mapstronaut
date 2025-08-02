import * as assert from "assert";
import { Mapper, mapObject } from "../mapper.js";
import type { Structure } from "../types/mapper.js";

describe("Mapper - Automap Functionality", function () {
  describe("basic automapping", function () {
    it("should automap matching properties by default", function () {
      const structure: Structure = [];
      const mapper = new Mapper(structure);

      const source = { name: "John", age: 30, city: "NYC" };
      const target = { name: "", age: 0, country: "USA" };
      const result = mapper.map(source, target);

      assert.strictEqual(result, target); // Same reference
      assert.deepEqual(result, {
        name: "John", // automapped
        age: 30, // automapped
        country: "USA", // preserved from target
      });
    });

    it("should not automap when automap is disabled", function () {
      const structure: Structure = [];
      const mapper = new Mapper(structure, { automap: false });

      const source = { name: "John", age: 30 };
      const target = { name: "", age: 0, country: "USA" };
      const result = mapper.map(source, target);

      assert.deepEqual(result, {
        name: "", // not automapped
        age: 0, // not automapped
        country: "USA", // preserved from target
      });
    });

    it("should create empty object when no target and only automapping", function () {
      const structure: Structure = [];
      const mapper = new Mapper(structure);

      const source = { name: "John", age: 30 };
      const result = mapper.map(source);

      assert.deepEqual(result, {}); // automapper returns empty object when no target
    });

    it("should handle type checking in automapping", function () {
      const structure: Structure = [];
      const mapper = new Mapper(structure, { automapCheckType: true });

      const source = { name: "John", age: "30", active: true };
      const target = { name: "", age: 0, active: false, extra: "keep" };
      const result = mapper.map(source, target);

      assert.deepEqual(result, {
        name: "John", // string to string - allowed
        age: 0, // string to number - not allowed, keeps target value
        active: true, // boolean to boolean - allowed
        extra: "keep", // preserved from target
      });
    });

    it("should ignore type checking when disabled", function () {
      const structure: Structure = [];
      const mapper = new Mapper(structure, { automapCheckType: false });

      const source = { name: "John", age: "30", active: true };
      const target = { name: "", age: 0, active: false };
      const result = mapper.map(source, target);

      assert.deepEqual(result, {
        name: "John", // string to string
        age: "30", // string to number - allowed when type checking disabled
        active: true, // boolean to boolean
      });
    });
  });

  describe("automapping with explicit rules", function () {
    it("should combine automapping with explicit rules", function () {
      const structure: Structure = [["email", "emailAddress"]];
      const mapper = new Mapper(structure);

      const source = { name: "John", age: 30, email: "john@example.com" };
      const target = { name: "", age: 0, emailAddress: "", country: "USA" };
      const result = mapper.map(source, target);

      assert.deepEqual(result, {
        name: "John", // automapped
        age: 30, // automapped
        emailAddress: "john@example.com", // explicit rule
        country: "USA", // preserved from target
      });
    });

    it("should let explicit rules override automapping", function () {
      const structure: Structure = [["fullName", "name"]];
      const mapper = new Mapper(structure);

      const source = { name: "John", fullName: "John Doe", age: 30 };
      const target = { name: "Jane", age: 0 };
      const result = mapper.map(source, target);

      assert.deepEqual(result, {
        name: "John Doe", // explicit rule overrides automap
        age: 30, // automapped
      });
    });

    it("should handle nested properties in combination", function () {
      const structure: Structure = [["user.email", "contact.email"]];
      const mapper = new Mapper(structure);

      const source = {
        name: "John",
        age: 30,
        user: { email: "john@example.com", role: "admin" },
      };
      const target = {
        name: "",
        age: 0,
        contact: { email: "", phone: "123" },
        extra: "keep",
      };
      const result = mapper.map(source, target);

      assert.deepEqual(result, {
        name: "John", // automapped
        age: 30, // automapped
        contact: { email: "john@example.com", phone: "123" }, // explicit rule + preserved
        extra: "keep", // preserved from target
      });
    });

    it("should work with constants and automapping", function () {
      const structure: Structure = [
        { target: "status", constant: "active" },
        ["email", "emailAddress"],
      ];
      const mapper = new Mapper(structure);

      const source = { name: "John", age: 30, email: "john@example.com" };
      const target = { name: "", age: 0, status: "", emailAddress: "" };
      const result = mapper.map(source, target);

      assert.deepEqual(result, {
        name: "John", // automapped
        age: 30, // automapped
        status: "active", // constant
        emailAddress: "john@example.com", // explicit rule
      });
    });

    it("should work with transforms and automapping", function () {
      const structure: Structure = [
        {
          source: "firstName",
          target: "displayName",
          transform: (value: string) => value.toUpperCase(),
        },
      ];
      const mapper = new Mapper(structure);

      const source = { firstName: "John", lastName: "Doe", age: 30 };
      const target = { firstName: "", lastName: "", displayName: "", age: 0 };
      const result = mapper.map(source, target);

      assert.deepEqual(result, {
        firstName: "John", // automapped
        lastName: "Doe", // automapped
        displayName: "JOHN", // transformed
        age: 30, // automapped
      });
    });
  });

  describe("automapping edge cases", function () {
    it("should skip undefined values in automapping", function () {
      const structure: Structure = [];
      const mapper = new Mapper(structure);

      const source = { name: "John", age: undefined, city: null };
      const target = { name: "", age: 25, city: "", country: "USA" };
      const result = mapper.map(source, target);

      assert.deepEqual(result, {
        name: "John", // automapped
        age: 25, // undefined skipped, target value preserved
        city: null, // null automapped
        country: "USA", // preserved from target
      });
    });

    it("should handle nested object automapping", function () {
      const structure: Structure = [];
      const mapper = new Mapper(structure);

      const source = {
        name: "John",
        profile: { bio: "Developer", skills: ["JS", "TS"] },
      };
      const target = {
        name: "",
        profile: { bio: "", location: "NYC" },
        extra: "keep",
      };
      const result = mapper.map(source, target);

      assert.deepEqual(result, {
        name: "John", // automapped
        profile: {
          bio: "Developer", // nested automapped
          location: "NYC", // preserved from target
          skills: ["JS", "TS"], // added from source
        },
        extra: "keep", // preserved from target
      });
    });

    it("should handle array values in automapping", function () {
      const structure: Structure = [];
      const mapper = new Mapper(structure);

      const source = { tags: ["react", "typescript"], count: 5 };
      const target = { tags: [], count: 0, status: "active" };
      const result = mapper.map(source, target);

      assert.deepEqual(result, {
        tags: ["react", "typescript"], // array automapped
        count: 5, // number automapped
        status: "active", // preserved from target
      });
    });

    it("should work with class instances", function () {
      class Person {
        constructor(
          public name: string = "",
          public age: number = 0,
        ) {}
      }

      const structure: Structure = [];
      const mapper = new Mapper(structure);

      const source = { name: "John", age: 30, city: "NYC" };
      const target = new Person("Jane", 25);
      const result = mapper.map(source, target);

      assert.strictEqual(result, target); // Same reference
      assert.strictEqual(result.name, "John"); // automapped
      assert.strictEqual(result.age, 30); // automapped
      assert.strictEqual((result as any).city, undefined); // not in target
    });
  });

  describe("automapping with mapObject helper", function () {
    it("should work with mapObject and automapping enabled", function () {
      const structure: Structure = [["email", "emailAddress"]];

      const source = { name: "John", age: 30, email: "john@example.com" };
      const target = { name: "", age: 0, emailAddress: "" };
      const result = mapObject(structure, source, target);

      assert.strictEqual(result, target); // Same reference
      assert.deepEqual(result, {
        name: "John", // automapped
        age: 30, // automapped
        emailAddress: "john@example.com", // explicit rule
      });
    });

    it("should work with mapObject and automapping disabled", function () {
      const structure: Structure = [["email", "emailAddress"]];

      const source = { name: "John", age: 30, email: "john@example.com" };
      const target = { name: "", age: 0, emailAddress: "" };
      const result = mapObject(structure, source, target, { automap: false });

      assert.deepEqual(result, {
        name: "", // not automapped
        age: 0, // not automapped
        emailAddress: "john@example.com", // explicit rule only
      });
    });
  });

  describe("automapping configuration", function () {
    it("should respect automap option in constructor", function () {
      const structure: Structure = [];
      const mapper1 = new Mapper(structure, { automap: true });
      const mapper2 = new Mapper(structure, { automap: false });

      const source = { name: "John", age: 30 };
      const target1 = { name: "", age: 0 };
      const target2 = { name: "", age: 0 };

      const result1 = mapper1.map(source, target1);
      const result2 = mapper2.map(source, target2);

      assert.deepEqual(result1, { name: "John", age: 30 }); // automapped
      assert.deepEqual(result2, { name: "", age: 0 }); // not automapped
    });

    it("should allow changing automap option after creation", function () {
      const structure: Structure = [];
      const mapper = new Mapper(structure);

      const source = { name: "John", age: 30 };

      // Test with automap enabled (default)
      const target1 = { name: "", age: 0 };
      const result1 = mapper.map(source, target1);
      assert.deepEqual(result1, { name: "John", age: 30 });

      // Disable automap
      mapper.automap = false;
      const target2 = { name: "", age: 0 };
      const result2 = mapper.map(source, target2);
      assert.deepEqual(result2, { name: "", age: 0 });

      // Re-enable automap
      mapper.automap = true;
      const target3 = { name: "", age: 0 };
      const result3 = mapper.map(source, target3);
      assert.deepEqual(result3, { name: "John", age: 30 });
    });

    it("should get correct automap option value", function () {
      const mapper1 = new Mapper([], { automap: true });
      const mapper2 = new Mapper([], { automap: false });

      assert.strictEqual(mapper1.automap, true);
      assert.strictEqual(mapper2.automap, false);

      mapper1.automap = false;
      mapper2.automap = true;

      assert.strictEqual(mapper1.automap, false);
      assert.strictEqual(mapper2.automap, true);
    });
  });

  describe("complex automapping scenarios", function () {
    it("should handle complex object with mixed matching and non-matching properties", function () {
      const structure: Structure = [
        ["metadata.created", "audit.createdAt"],
        { target: "audit.updatedAt", constant: new Date("2023-01-01") },
      ];
      const mapper = new Mapper(structure);

      const source = {
        id: "123",
        name: "Test Item",
        status: "active",
        metadata: {
          created: "2023-01-01",
          version: 1,
        },
        tags: ["important"],
      };

      const target = {
        id: "",
        name: "",
        description: "Default description",
        status: "pending",
        audit: {
          createdAt: "",
          updatedAt: null as Date | null,
          version: 0,
        },
        tags: [] as string[],
      };

      const result = mapper.map(source, target);

      assert.deepEqual(result, {
        id: "123", // automapped
        name: "Test Item", // automapped
        description: "Default description", // preserved from target
        status: "active", // automapped
        audit: {
          createdAt: "2023-01-01", // explicit rule
          updatedAt: new Date("2023-01-01"), // constant
          version: 0, // preserved from target (no matching property in source.audit)
        },
        tags: ["important"], // automapped
      });
    });

    it("should work with multiple levels of nesting and mixed rules", function () {
      const structure: Structure = [
        ["user.profile.bio", "profile.description"],
        ["user.preferences.theme", "settings.ui.theme"],
        { target: "settings.ui.language", constant: "en" },
      ];
      const mapper = new Mapper(structure);

      const source = {
        name: "John",
        user: {
          profile: { bio: "Software Developer", avatar: "url" },
          preferences: { theme: "dark", notifications: true },
        },
        metadata: { lastLogin: "2023-01-01" },
      };

      const target = {
        name: "",
        profile: { description: "", avatar: "" },
        settings: {
          ui: { theme: "", language: "" },
          privacy: { public: true },
        },
        metadata: { lastLogin: "", created: "2022-01-01" },
      };

      const result = mapper.map(source, target);

      assert.deepEqual(result, {
        name: "John", // automapped
        profile: {
          description: "Software Developer", // explicit rule
          avatar: "", // preserved from target (no direct automap match)
        },
        settings: {
          ui: {
            theme: "dark", // explicit rule
            language: "en", // constant
          },
          privacy: { public: true }, // preserved from target
        },
        metadata: {
          lastLogin: "2023-01-01", // automapped (nested object merge)
          created: "2022-01-01", // preserved from target
        },
      });
    });
  });
});
