import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { AsyncMapper, mapObjectAsync } from "../async-mapper.js";
import type { AsyncStructure } from "../types/mapper.js";

describe("AsyncMapper", () => {
  describe("Basic Async Operations", () => {
    it("should map with async transform function", async () => {
      const source = {
        name: "john doe",
        age: 25,
      };

      const structure: AsyncStructure = [
        {
          source: "name",
          target: "fullName",
          transform: async (data: string) => {
            // Simulate async operation
            await new Promise((resolve) => setTimeout(resolve, 10));
            return data.toUpperCase();
          },
        },
        {
          source: "age",
          target: "ageInMonths",
          transform: async (data: number) => {
            await new Promise((resolve) => setTimeout(resolve, 5));
            return data * 12;
          },
        },
      ];

      const mapper = new AsyncMapper(structure);
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        fullName: "JOHN DOE",
        ageInMonths: 300,
      });
    });

    it("should map with sync transform functions", async () => {
      const source = {
        name: "john doe",
        age: 25,
      };

      const structure: AsyncStructure = [
        {
          source: "name",
          target: "fullName",
          transform: (data: string) => data.toUpperCase(),
        },
        {
          source: "age",
          target: "ageInMonths",
          transform: (data: number) => data * 12,
        },
      ];

      const mapper = new AsyncMapper(structure);
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        fullName: "JOHN DOE",
        ageInMonths: 300,
      });
    });

    it("should work with mixed sync and async transform functions", async () => {
      const source = {
        name: "john doe",
        age: 25,
        status: "active",
      };

      const structure: AsyncStructure = [
        {
          source: "name",
          target: "fullName",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return data.toUpperCase();
          },
        },
        {
          source: "age",
          target: "years",
          transform: (data: number) => data, // sync
        },
        {
          source: "status",
          target: "isActive",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 5));
            return data === "active";
          },
        },
      ];

      const mapper = new AsyncMapper(structure);
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        fullName: "JOHN DOE",
        years: 25,
        isActive: true,
      });
    });
  });

  describe("Async Filter Operations", () => {
    it("should apply async filter functions", async () => {
      const source = {
        users: [
          { name: "John", age: 25 },
          { name: "Jane", age: 17 },
          { name: "Bob", age: 30 },
        ],
      };

      const structure: AsyncStructure = [
        {
          source: "users[0].name",
          target: "adult1",
          filter: async (data, source) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return source.users[0].age >= 18;
          },
        },
        {
          source: "users[1].name",
          target: "adult2",
          filter: async (data, source) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return source.users[1].age >= 18;
          },
        },
        {
          source: "users[2].name",
          target: "adult3",
          filter: async (data, source) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return source.users[2].age >= 18;
          },
        },
      ];

      const mapper = new AsyncMapper(structure);
      const result = await mapper.map(source);

      // Only John and Bob should be mapped (ages 25 and 30)
      assert.deepEqual(result, {
        adult1: "John",
        adult3: "Bob",
      });
    });

    it("should work with sync filter functions", async () => {
      const source = {
        name: "John",
        age: 25,
        status: "active",
      };

      const structure: AsyncStructure = [
        {
          source: "name",
          target: "userName",
          filter: (data, source) => source.age >= 18,
        },
        {
          source: "status",
          target: "userStatus",
          filter: (data) => data === "active",
        },
      ];

      const mapper = new AsyncMapper(structure);
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        userName: "John",
        userStatus: "active",
      });
    });

    it("should work with async filter on constants", async () => {
      const source = { age: 25 };

      const structure: AsyncStructure = [
        {
          constant: "ADULT_USER",
          target: "userType",
          filter: async (data, source) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return source.age >= 18;
          },
        },
        {
          constant: "MINOR_USER",
          target: "userType2",
          filter: async (data, source) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return source.age < 18;
          },
        },
      ];

      const mapper = new AsyncMapper(structure);
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        userType: "ADULT_USER",
      });
    });
  });

  describe("Async FailOn Operations", () => {
    it("should throw error when async failOn returns false", async () => {
      const source = { name: "John", age: 17 };
      const structure: AsyncStructure = [
        {
          source: "age",
          target: "userAge",
          failOn: async (data) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return data >= 18; // Fail if under 18
          },
        },
      ];

      const mapper = new AsyncMapper(structure);

      await assert.rejects(
        async () => await mapper.map(source),
        /Mapping failed: condition failed for rule with target 'userAge'/,
      );
    });

    it("should complete mapping when async failOn returns true", async () => {
      const source = { name: "John", age: 25 };
      const structure: AsyncStructure = [
        {
          source: "age",
          target: "userAge",
          failOn: async (data) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return data >= 18; // Pass if 18 or older
          },
        },
      ];

      const mapper = new AsyncMapper(structure);
      const result = await mapper.map(source);

      assert.deepEqual(result, { userAge: 25 });
    });

    it("should apply async failOn after async transform", async () => {
      const source = { age: 25 };
      const structure: AsyncStructure = [
        {
          source: "age",
          target: "description",
          transform: async (data: number) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return data >= 18 ? "adult" : "minor";
          },
          failOn: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return data === "adult"; // Pass only if result is "adult"
          },
        },
      ];

      const mapper = new AsyncMapper(structure);
      const result = await mapper.map(source);

      assert.deepEqual(result, { description: "adult" });
    });

    it("should work with sync failOn functions", async () => {
      const source = { name: "John", age: 25 };
      const structure: AsyncStructure = [
        {
          source: "age",
          target: "userAge",
          failOn: (data) => data >= 18, // Pass if 18 or older
        },
      ];

      const mapper = new AsyncMapper(structure);
      const result = await mapper.map(source);

      assert.deepEqual(result, { userAge: 25 });
    });
  });

  describe("Combined Async Operations", () => {
    it("should work with all async functions combined", async () => {
      const source = {
        users: [
          { name: "John", age: 25, score: 85 },
          { name: "Jane", age: 17, score: 95 },
        ],
      };

      const structure: AsyncStructure = [
        {
          source: "users[0]",
          target: "qualifiedUser",
          filter: async (data) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return data.age >= 18; // Only adults
          },
          transform: async (data) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return {
              name: data.name.toUpperCase(),
              grade: data.score >= 90 ? "A" : "B",
            };
          },
          failOn: async (data) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return data.grade === "A" || data.grade === "B"; // Pass if grade is A or B
          },
        },
        {
          source: "users[1]",
          target: "qualifiedUser2",
          filter: async (data) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return data.age >= 18; // Only adults - this should filter out Jane
          },
          transform: async (data) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return {
              name: data.name.toUpperCase(),
              grade: data.score >= 90 ? "A" : "B",
            };
          },
        },
      ];

      const mapper = new AsyncMapper(structure);
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        qualifiedUser: {
          name: "JOHN",
          grade: "B",
        },
        // qualifiedUser2 should not exist because Jane is under 18
      });
    });

    it("should pass data, source, and target to all async functions", async () => {
      const source = { firstName: "John", lastName: "Doe" };
      let filterCalls: any[] = [];
      let transformCalls: any[] = [];
      let failOnCalls: any[] = [];

      const structure: AsyncStructure = [
        {
          source: "lastName",
          target: "surname",
        },
        {
          source: "firstName",
          target: "greeting",
          filter: async (data, source, target) => {
            await new Promise((resolve) => setTimeout(resolve, 5));
            filterCalls.push({ data, source, target });
            return true;
          },
          transform: async (data, source, target) => {
            await new Promise((resolve) => setTimeout(resolve, 5));
            transformCalls.push({ data, source, target });
            return `Hello, ${data} ${target.surname}!`;
          },
          failOn: async (data, source, target) => {
            await new Promise((resolve) => setTimeout(resolve, 5));
            failOnCalls.push({ data, source, target });
            return data.includes("Hello");
          },
        },
      ];

      const mapper = new AsyncMapper(structure);
      const result = await mapper.map(source);

      assert.equal(filterCalls.length, 1);
      assert.equal(transformCalls.length, 1);
      assert.equal(failOnCalls.length, 1);

      assert.equal(failOnCalls[0].data, "Hello, John Doe!");
      assert.deepEqual(failOnCalls[0].source, source);
      assert.deepEqual(failOnCalls[0].target, {
        surname: "Doe",
        greeting: "Hello, John Doe!",
      });

      assert.deepEqual(result, {
        greeting: "Hello, John Doe!",
        surname: "Doe",
      });
    });
  });

  describe("AsyncMapper Configuration", () => {
    it("should support all mapper options", async () => {
      const source = { name: "John", age: null, status: undefined };

      const structure: AsyncStructure = [
        ["name", "fullName"],
        ["age", "userAge"],
        ["status", "userStatus"],
      ];

      const options = {
        skipNull: true,
        skipUndefined: false,
      };

      const mapper = new AsyncMapper(structure, options);
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        fullName: "John",
        userStatus: undefined, // undefined is not skipped
        // userAge is skipped because it's null and skipNull is true
      });
    });

    it("should support options getters and setters", async () => {
      const mapper = new AsyncMapper([]);

      mapper.skipNull = true;
      mapper.skipUndefined = false;

      assert.equal(mapper.skipNull, true);
      assert.equal(mapper.skipUndefined, false);

      const options = mapper.getOptions();
      assert.equal(options.skipNull, true);
      assert.equal(options.skipUndefined, false);
    });

    it("should support structure getters and setters", async () => {
      const structure1: AsyncStructure = [["name", "fullName"]];
      const structure2: AsyncStructure = [["age", "userAge"]];

      const mapper = new AsyncMapper(structure1);

      const retrieved = mapper.getAsyncStructure();
      assert.deepEqual(retrieved, structure1);

      mapper.setAsyncStructure(structure2);
      const newRetrieved = mapper.getAsyncStructure();
      assert.deepEqual(newRetrieved, structure2);
    });
  });

  describe("mapObjectAsync helper function", () => {
    it("should work as a shortcut for async mapping", async () => {
      const source = { name: "John", age: 25 };
      const structure: AsyncStructure = [
        {
          source: "name",
          target: "fullName",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return data.toUpperCase();
          },
        },
        ["age", "years"],
      ];

      const result = await mapObjectAsync(structure, source);

      assert.deepEqual(result, {
        fullName: "JOHN",
        years: 25,
      });
    });

    it("should accept custom options", async () => {
      const source = { name: "John", age: null };
      const structure: AsyncStructure = [
        ["name", "fullName"],
        ["age", "userAge"],
      ];
      const options = { skipNull: true };

      const result = await mapObjectAsync(
        structure,
        source,
        undefined,
        options,
      );

      assert.deepEqual(result, {
        fullName: "John",
        // userAge is skipped due to skipNull: true
      });
    });

    it("should accept target object", async () => {
      const source = { name: "John" };
      const target = { existing: "value" };
      const structure: AsyncStructure = [["name", "fullName"]];

      const result = await mapObjectAsync(structure, source, target);

      assert.deepEqual(result, {
        existing: "value",
        fullName: "John",
      });
      assert.strictEqual(result, target); // Should be the same object reference
    });
  });

  describe("Error Handling", () => {
    it("should handle errors in async transform functions", async () => {
      const source = { name: "John" };
      const structure: AsyncStructure = [
        {
          source: "name",
          target: "processedName",
          transform: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            throw new Error("Transform error");
          },
        },
      ];

      const mapper = new AsyncMapper(structure);

      await assert.rejects(
        async () => await mapper.map(source),
        /Transform error/,
      );
    });

    it("should handle errors in async filter functions", async () => {
      const source = { name: "John" };
      const structure: AsyncStructure = [
        {
          source: "name",
          target: "filteredName",
          filter: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            throw new Error("Filter error");
          },
        },
      ];

      const mapper = new AsyncMapper(structure);

      await assert.rejects(
        async () => await mapper.map(source),
        /Filter error/,
      );
    });

    it("should handle errors in async failOn functions", async () => {
      const source = { name: "John" };
      const structure: AsyncStructure = [
        {
          source: "name",
          target: "validatedName",
          failOn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            throw new Error("FailOn error");
          },
        },
      ];

      const mapper = new AsyncMapper(structure);

      await assert.rejects(
        async () => await mapper.map(source),
        /FailOn error/,
      );
    });

    it("should throw error when rule has neither source nor constant", async () => {
      const source = { name: "John" };
      const structure: AsyncStructure = [
        {
          target: "result",
        } as any, // Force this invalid rule
      ];

      const mapper = new AsyncMapper(structure);

      await assert.rejects(
        async () => await mapper.map(source),
        /Rule must have either 'source' or 'constant' defined/,
      );
    });
  });

  describe("Transform with Constants", () => {
    it("should apply async transform to constant values", async () => {
      const source = { age: 25 };
      const structure: AsyncStructure = [
        {
          constant: "USER_ROLE",
          target: "role",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return data.toLowerCase();
          },
        },
      ];

      const mapper = new AsyncMapper(structure);
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        role: "user_role",
      });
    });

    it("should apply sync transform to constant values", async () => {
      const source = { age: 25 };
      const structure: AsyncStructure = [
        {
          constant: "ADMIN_ROLE",
          target: "role",
          transform: (data: string) => data.toLowerCase(),
        },
      ];

      const mapper = new AsyncMapper(structure);
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        role: "admin_role",
      });
    });
  });

  describe("FailOn with Constants", () => {
    it("should throw error when async failOn returns false for constants", async () => {
      const source = { age: 15 };
      const structure: AsyncStructure = [
        {
          constant: "USER",
          target: "userType",
          failOn: async (data, source) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return source.age >= 18; // Fail if under 18
          },
        },
      ];

      const mapper = new AsyncMapper(structure);

      await assert.rejects(
        async () => await mapper.map(source),
        /Mapping failed: condition failed for rule with target 'userType'/,
      );
    });

    it("should complete mapping when async failOn returns true for constants", async () => {
      const source = { age: 25 };
      const structure: AsyncStructure = [
        {
          constant: "USER",
          target: "userType",
          failOn: async (data, source) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return source.age >= 18; // Pass if 18 or older
          },
        },
      ];

      const mapper = new AsyncMapper(structure);
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        userType: "USER",
      });
    });
  });

  describe("Default Values", () => {
    it("should use default value when source data is null", async () => {
      const source = { name: null };
      const structure: AsyncStructure = [
        {
          source: "name",
          target: "userName",
          defaultValue: "Anonymous",
        },
      ];

      const mapper = new AsyncMapper(structure);
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        userName: "Anonymous",
      });
    });

    it("should use default value when source data is undefined", async () => {
      const source = { name: undefined };
      const structure: AsyncStructure = [
        {
          source: "name",
          target: "userName",
          defaultValue: "Unknown",
        },
      ];

      const mapper = new AsyncMapper(structure);
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        userName: "Unknown",
      });
    });
  });

  describe("Skip Options with Transform", () => {
    it("should skip undefined values after async transform", async () => {
      const source = { value: "test" };
      const structure: AsyncStructure = [
        {
          source: "value",
          target: "result",
          transform: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return undefined;
          },
        },
      ];

      const mapper = new AsyncMapper(structure, { skipUndefined: true });
      const result = await mapper.map(source);

      assert.deepEqual(result, {}); // Should be empty because undefined is skipped
    });

    it("should skip null values after async transform", async () => {
      const source = { value: "test" };
      const structure: AsyncStructure = [
        {
          source: "value",
          target: "result",
          transform: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return null;
          },
        },
      ];

      const mapper = new AsyncMapper(structure, { skipNull: true });
      const result = await mapper.map(source);

      assert.deepEqual(result, {}); // Should be empty because null is skipped
    });
  });
});
