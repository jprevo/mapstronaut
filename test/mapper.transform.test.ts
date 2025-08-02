import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { Mapper, mapObject } from "../src/mapper.js";
import type { Structure } from "../src/types/mapper.js";

describe("Mapper Transform Functionality", () => {
  describe("Basic Transform Operations", () => {
    it("should apply transform function to mapped values", () => {
      const source = {
        name: "john doe",
        age: 25,
      };

      const structure: Structure = [
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

      const mapper = new Mapper(structure);
      const result = mapper.map(source);

      assert.deepEqual(result, {
        fullName: "JOHN DOE",
        ageInMonths: 300,
      });
    });

    it("should pass data, source, and target to transform function", () => {
      const source = {
        firstName: "John",
        lastName: "Doe",
      };

      const structure: Structure = [
        {
          source: "lastName",
          target: "surname",
        },
        {
          source: "firstName",
          target: "greeting",
          transform: (data: string, source: any, target: any) => {
            return `Hello ${data} ${source.lastName}! Target has ${Object.keys(target).length} properties.`;
          },
        },
      ];

      const mapper = new Mapper(structure);
      const result = mapper.map(source);

      assert.equal(result.greeting, "Hello John Doe! Target has 1 properties.");
      assert.equal(result.surname, "Doe");
    });

    it("should work with transform function that returns different types", () => {
      const source = {
        count: "5",
        enabled: "true",
        items: "apple,banana,cherry",
      };

      const structure: Structure = [
        {
          source: "count",
          target: "numCount",
          transform: (data: string) => parseInt(data, 10),
        },
        {
          source: "enabled",
          target: "isEnabled",
          transform: (data: string) => data === "true",
        },
        {
          source: "items",
          target: "itemArray",
          transform: (data: string) => data.split(","),
        },
      ];

      const mapper = new Mapper(structure);
      const result = mapper.map(source);

      assert.deepEqual(result, {
        numCount: 5,
        isEnabled: true,
        itemArray: ["apple", "banana", "cherry"],
      });
    });
  });

  describe("Transform with Constants", () => {
    it("should apply transform function to constant values", () => {
      const source = { id: 1 };

      const structure: Structure = [
        {
          target: "timestamp",
          constant: "2023-01-01",
          transform: (data: string) => new Date(data).getTime(),
        },
        {
          target: "status",
          constant: "active",
          transform: (data: string) => data.toUpperCase(),
        },
      ];

      const mapper = new Mapper(structure);
      const result = mapper.map(source);

      assert.equal(result.timestamp, new Date("2023-01-01").getTime());
      assert.equal(result.status, "ACTIVE");
    });

    it("should pass constant, source, and target to transform function", () => {
      const source = { userId: 123 };

      const structure: Structure = [
        {
          target: "userInfo",
          constant: "User",
          transform: (data: string, source: any, target: any) => {
            return `${data} ID: ${source.userId}`;
          },
        },
      ];

      const mapper = new Mapper(structure);
      const result = mapper.map(source);

      assert.equal(result.userInfo, "User ID: 123");
    });
  });

  describe("Transform with Default Values", () => {
    it("should apply transform to default values when source data is null/undefined", () => {
      const source = {
        name: null,
        count: undefined,
      };

      const structure: Structure = [
        {
          source: "name",
          target: "displayName",
          defaultValue: "Anonymous",
          transform: (data: string) => `Mr. ${data}`,
        },
        {
          source: "count",
          target: "displayCount",
          defaultValue: 0,
          transform: (data: number) => `Count: ${data}`,
        },
      ];

      const mapper = new Mapper(structure);
      const result = mapper.map(source);

      assert.deepEqual(result, {
        displayName: "Mr. Anonymous",
        displayCount: "Count: 0",
      });
    });
  });

  describe("Transform with Filters", () => {
    it("should skip constant values when filter returns false", () => {
      const source = { id: 1 };

      const structure: Structure = [
        {
          target: "status",
          constant: "inactive",
          filter: (data: string) => data === "active",
        },
        {
          target: "type",
          constant: "user",
          filter: (data: string) => data === "user",
        },
      ];

      const mapper = new Mapper(structure);
      const result = mapper.map(source);

      assert.deepEqual(result, {
        type: "user",
        // status should not be present because filter returned false
      });
    });
    it("should apply transform only when filter returns true", () => {
      const source = {
        score1: 85,
        score2: 45,
        score3: 92,
      };

      const structure: Structure = [
        {
          source: "score1",
          target: "grade1",
          filter: (data: number) => data >= 50,
          transform: (data: number) =>
            data >= 90 ? "A" : data >= 80 ? "B" : "C",
        },
        {
          source: "score2",
          target: "grade2",
          filter: (data: number) => data >= 50,
          transform: (data: number) =>
            data >= 90 ? "A" : data >= 80 ? "B" : "C",
        },
        {
          source: "score3",
          target: "grade3",
          filter: (data: number) => data >= 50,
          transform: (data: number) =>
            data >= 90 ? "A" : data >= 80 ? "B" : "C",
        },
      ];

      const mapper = new Mapper(structure);
      const result = mapper.map(source);

      assert.deepEqual(result, {
        grade1: "B",
        grade3: "A",
        // grade2 should not be present because filter returned false
      });
    });

    it("should pass data, source, and target to filter function", () => {
      const source = {
        users: [
          { name: "John", age: 25 },
          { name: "Jane", age: 17 },
          { name: "Bob", age: 30 },
        ],
      };

      const structure: Structure = [
        {
          source: "users[0]",
          target: "adult1",
          filter: (data: any, source: any) => data.age >= 18,
          transform: (data: any) => `${data.name} (${data.age})`,
        },
        {
          source: "users[1]",
          target: "adult2",
          filter: (data: any, source: any) => data.age >= 18,
          transform: (data: any) => `${data.name} (${data.age})`,
        },
        {
          source: "users[2]",
          target: "adult3",
          filter: (data: any, source: any) => data.age >= 18,
          transform: (data: any) => `${data.name} (${data.age})`,
        },
      ];

      const mapper = new Mapper(structure);
      const result = mapper.map(source);

      assert.deepEqual(result, {
        adult1: "John (25)",
        adult3: "Bob (30)",
        // adult2 should not be present because Jane is under 18
      });
    });
  });

  describe("Complex Transform Scenarios", () => {
    it("should handle nested object transformation", () => {
      const source = {
        user: {
          profile: {
            firstName: "john",
            lastName: "doe",
            contact: {
              email: "john@example.com",
            },
          },
        },
      };

      const structure: Structure = [
        {
          source: "user.profile",
          target: "userInfo",
          transform: (data: any) => ({
            fullName: `${data.firstName} ${data.lastName}`.toUpperCase(),
            email: data.contact.email.toLowerCase(),
            displayName: `${data.firstName.charAt(0).toUpperCase()}${data.firstName.slice(1)} ${data.lastName.charAt(0).toUpperCase()}${data.lastName.slice(1)}`,
          }),
        },
      ];

      const mapper = new Mapper(structure);
      const result = mapper.map(source);

      assert.deepEqual(result.userInfo, {
        fullName: "JOHN DOE",
        email: "john@example.com",
        displayName: "John Doe",
      });
    });

    it("should handle array transformation", () => {
      const source = {
        numbers: [1, 2, 3, 4, 5],
        items: ["apple", "banana", "cherry"],
      };

      const structure: Structure = [
        {
          source: "numbers",
          target: "evenNumbers",
          transform: (data: number[]) => data.filter((n) => n % 2 === 0),
        },
        {
          source: "items",
          target: "uppercaseItems",
          transform: (data: string[]) => data.map((item) => item.toUpperCase()),
        },
        {
          source: "numbers",
          target: "sum",
          transform: (data: number[]) => data.reduce((sum, n) => sum + n, 0),
        },
      ];

      const mapper = new Mapper(structure);
      const result = mapper.map(source);

      assert.deepEqual(result, {
        evenNumbers: [2, 4],
        uppercaseItems: ["APPLE", "BANANA", "CHERRY"],
        sum: 15,
      });
    });

    it("should handle transform with existing target object", () => {
      const source = { value: 10 };
      const target = { existingProp: "exists" };

      const structure: Structure = [
        {
          source: "value",
          target: "transformedValue",
          transform: (data: number, source: any, target: any) => {
            return data * 2 + (target.existingProp ? 100 : 0);
          },
        },
      ];

      const mapper = new Mapper(structure);
      const result = mapper.map(source, target);

      assert.deepEqual(result, {
        existingProp: "exists",
        transformedValue: 120, // 10 * 2 + 100
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle transform returning null or undefined", () => {
      const source = {
        value1: "test",
        value2: "empty",
      };

      const structure: Structure = [
        {
          source: "value1",
          target: "result1",
          transform: () => null,
        },
        {
          source: "value2",
          target: "result2",
          transform: () => undefined,
        },
      ];

      const mapper = new Mapper(structure, { skipUndefined: false });
      const result = mapper.map(source);

      assert.deepEqual(result, {
        result1: null,
        result2: undefined,
      });
    });

    it("should respect skipNull and skipUndefined options with transform", () => {
      const source = {
        value1: "test",
        value2: "empty",
      };

      const structure: Structure = [
        {
          source: "value1",
          target: "result1",
          transform: () => null,
        },
        {
          source: "value2",
          target: "result2",
          transform: () => undefined,
        },
      ];

      const mapper = new Mapper(structure, {
        skipNull: true,
        skipUndefined: true,
      });
      const result = mapper.map(source);

      assert.deepEqual(result, {});
    });

    it("should handle transform function that throws an error", () => {
      const source = { value: "test" };

      const structure: Structure = [
        {
          source: "value",
          target: "result",
          transform: () => {
            throw new Error("Transform error");
          },
        },
      ];

      const mapper = new Mapper(structure);

      assert.throws(() => mapper.map(source), /Transform error/);
    });
  });

  describe("Integration with mapObject function", () => {
    it("should work with mapObject helper function", () => {
      const source = {
        firstName: "john",
        lastName: "doe",
        age: 25,
      };

      const structure: Structure = [
        {
          source: "firstName",
          target: "name.first",
          transform: (data: string) =>
            data.charAt(0).toUpperCase() + data.slice(1),
        },
        {
          source: "lastName",
          target: "name.last",
          transform: (data: string) =>
            data.charAt(0).toUpperCase() + data.slice(1),
        },
        {
          source: "age",
          target: "details.ageGroup",
          transform: (data: number) =>
            data < 18 ? "minor" : data < 65 ? "adult" : "senior",
        },
      ];

      const result = mapObject(structure, source);

      assert.deepEqual(result, {
        name: {
          first: "John",
          last: "Doe",
        },
        details: {
          ageGroup: "adult",
        },
      });
    });
  });
});
