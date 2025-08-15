import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { OutPath } from "../src/outpath.js";

describe("Outpath", () => {
  describe("write", () => {
    it("should write a simple property", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "name", "John");

      assert.equal(obj.name, "John");
    });

    it("should write a nested property", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "user.name", "Jane");

      assert.equal(obj.user.name, "Jane");
    });

    it("should write deeply nested properties", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "user.profile.details.age", 25);

      assert.equal(obj.user.profile.details.age, 25);
    });

    it("should preserve existing properties when writing nested", () => {
      const obj: any = { user: { name: "John" } };
      const outpath = new OutPath();

      outpath.write(obj, "user.age", 30);

      assert.equal(obj.user.name, "John");
      assert.equal(obj.user.age, 30);
    });

    it("should overwrite existing properties", () => {
      const obj: any = { name: "John" };
      const outpath = new OutPath();

      outpath.write(obj, "name", "Jane");

      assert.equal(obj.name, "Jane");
    });

    it("should handle null values", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "value", null);

      assert.equal(obj.value, null);
    });

    it("should handle undefined values", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "value", undefined);

      assert.equal(obj.value, undefined);
    });

    it("should handle boolean values", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "flag", true);

      assert.equal(obj.flag, true);
    });

    it("should handle number values", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "count", 42);

      assert.equal(obj.count, 42);
    });

    it("should handle array values", () => {
      const obj: any = {};
      const outpath = new OutPath();
      const array = [1, 2, 3];

      outpath.write(obj, "items", array);

      assert.deepEqual(obj.items, array);
    });

    it("should handle object values", () => {
      const obj: any = {};
      const outpath = new OutPath();
      const nestedObj = { a: 1, b: "test" };

      outpath.write(obj, "data", nestedObj);

      assert.deepEqual(obj.data, nestedObj);
    });

    it("should work with TypeScript typed objects", () => {
      interface TestTarget {
        first?: {
          a?: string;
          b?: {
            test?: boolean;
          };
        };
      }

      const obj: TestTarget = {};
      const outpath = new OutPath<TestTarget>();

      outpath.write(obj, "first.a", "demo");
      outpath.write(obj, "first.b.test", false);

      assert.equal(obj.first?.a, "demo");
      assert.equal(obj.first?.b?.test, false);
    });

    it("should handle multiple writes to the same object", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "user.name", "John");
      outpath.write(obj, "user.age", 25);
      outpath.write(obj, "user.email", "john@example.com");
      outpath.write(obj, "settings.theme", "dark");

      assert.equal(obj.user.name, "John");
      assert.equal(obj.user.age, 25);
      assert.equal(obj.user.email, "john@example.com");
      assert.equal(obj.settings.theme, "dark");
    });

    it("should replace null intermediate objects", () => {
      const obj: any = { user: null };
      const outpath = new OutPath();

      outpath.write(obj, "user.name", "John");

      assert.equal(obj.user.name, "John");
    });

    it("should replace undefined intermediate objects", () => {
      const obj: any = { user: undefined };
      const outpath = new OutPath();

      outpath.write(obj, "user.name", "John");

      assert.equal(obj.user.name, "John");
    });

    it("should throw error on empty string paths", () => {
      const obj: any = {};
      const outpath = new OutPath();

      assert.throws(() => {
        outpath.write(obj, "", "value");
      }, /Path cannot be empty/);
    });

    it("should handle single character property names", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "a.b.c", "value");

      assert.equal(obj.a.b.c, "value");
    });

    it("should work with class instances", () => {
      class TestClass {
        public name?: string;
        public nested?: {
          value?: number;
        };
      }

      const instance = new TestClass();
      const outpath = new OutPath<TestClass>();

      outpath.write(instance, "name", "Test");
      outpath.write(instance, "nested.value", 123);

      assert.equal(instance.name, "Test");
      assert.equal(instance.nested?.value, 123);
    });

    it("should handle consecutive dots in path (creates empty string property)", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "user..name", "John");

      assert.equal(obj.user[""].name, "John");
    });

    it("should handle leading dot in path (creates empty string property)", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, ".user.name", "John");

      assert.equal(obj[""].user.name, "John");
    });

    it("should handle trailing dot in path (creates empty string property)", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "user.name.", "John");

      assert.equal(obj.user.name[""], "John");
    });

    it("should handle escaped dots in property names", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "user\\.name", "John");

      assert.equal(obj["user.name"], "John");
    });

    it("should handle escaped dots in nested properties", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "config.server\\.host", "localhost");

      assert.equal(obj.config["server.host"], "localhost");
    });

    it("should handle multiple escaped dots in single property", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "file\\.name\\.extension", "test");

      assert.equal(obj["file.name.extension"], "test");
    });

    it("should handle escaped dots mixed with regular dots", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "user.profile\\.data.name", "Jane");

      assert.equal(obj.user["profile.data"].name, "Jane");
    });

    it("should handle escaped dots at the beginning of property names", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "\\.hidden", "secret");

      assert.equal(obj[".hidden"], "secret");
    });

    it("should handle escaped dots at the end of property names", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "config\\.", "value");

      assert.equal(obj["config."], "value");
    });

    it("should handle backslashes that don't escape dots", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "path\\to\\file", "content");

      assert.equal(obj["path\\to\\file"], "content");
    });

    it("should handle complex nested paths with escaped dots", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "app.config\\.env.database\\.host", "db.example.com");

      assert.equal(obj.app["config.env"]["database.host"], "db.example.com");
    });

    it("should handle escaped dots with TypeScript typed objects", () => {
      interface TestTarget {
        "server.config"?: string;
        nested?: {
          "api.key"?: string;
        };
      }

      const obj: TestTarget = {};
      const outpath = new OutPath<TestTarget>();

      outpath.write(obj, "server\\.config", "production");
      outpath.write(obj, "nested.api\\.key", "secret123");

      assert.equal(obj["server.config"], "production");
      assert.equal(obj.nested?.["api.key"], "secret123");
    });
  });
});
