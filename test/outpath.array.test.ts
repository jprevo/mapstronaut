import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { OutPath } from "../src/outpath.js";

describe("Outpath - Array Operations", () => {
  describe("array index access", () => {
    it("should write to array index", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "rows[0]", "first item");

      assert.equal(obj.rows[0], "first item");
    });

    it("should write to multiple array indices", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "items[0]", "alpha");
      outpath.write(obj, "items[1]", "beta");
      outpath.write(obj, "items[2]", "gamma");

      assert.equal(obj.items[0], "alpha");
      assert.equal(obj.items[1], "beta");
      assert.equal(obj.items[2], "gamma");
    });

    it("should create arrays with sparse indices", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "data[5]", "sixth element");

      assert.equal(obj.data[5], "sixth element");
      assert.equal(obj.data.length, 6);
      assert.equal(obj.data[0], undefined);
      assert.equal(obj.data[4], undefined);
    });

    it("should handle nested array indices", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "matrix[0][1]", "value");

      assert.equal(obj.matrix[0][1], "value");
    });
  });

  describe("mixed array and object paths", () => {
    it("should write to object property within array element", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "rows[2].id", "spacecraft-001");

      assert.equal(obj.rows[2].id, "spacecraft-001");
    });

    it("should write to nested object properties within array", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "crew[0].personal.name", "Captain Stellar");
      outpath.write(obj, "crew[0].personal.rank", "Commander");
      outpath.write(obj, "crew[0].stats.missions", 15);

      assert.equal(obj.crew[0].personal.name, "Captain Stellar");
      assert.equal(obj.crew[0].personal.rank, "Commander");
      assert.equal(obj.crew[0].stats.missions, 15);
    });

    it("should write to array within object property", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "mission.waypoints[0]", "Earth");
      outpath.write(obj, "mission.waypoints[1]", "Mars");
      outpath.write(obj, "mission.waypoints[2]", "Jupiter");

      assert.equal(obj.mission.waypoints[0], "Earth");
      assert.equal(obj.mission.waypoints[1], "Mars");
      assert.equal(obj.mission.waypoints[2], "Jupiter");
    });

    it("should handle deeply nested mixed paths", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(
        obj,
        "fleet[0].ships[1].crew[2].equipment[0]",
        "plasma rifle",
      );

      assert.equal(obj.fleet[0].ships[1].crew[2].equipment[0], "plasma rifle");
    });
  });

  describe("array operations with existing data", () => {
    it("should preserve existing array elements when adding new ones", () => {
      const obj: any = { items: ["existing"] };
      const outpath = new OutPath();

      outpath.write(obj, "items[1]", "new item");

      assert.equal(obj.items[0], "existing");
      assert.equal(obj.items[1], "new item");
    });

    it("should overwrite existing array elements", () => {
      const obj: any = { numbers: [1, 2, 3] };
      const outpath = new OutPath();

      outpath.write(obj, "numbers[1]", 42);

      assert.equal(obj.numbers[0], 1);
      assert.equal(obj.numbers[1], 42);
      assert.equal(obj.numbers[2], 3);
    });

    it("should preserve existing object properties when adding array elements", () => {
      const obj: any = {
        metadata: { version: "1.0" },
        planets: [{ name: "Earth" }],
      };
      const outpath = new OutPath();

      outpath.write(obj, "planets[0].distance", "0 AU");
      outpath.write(obj, "planets[1].name", "Mars");

      assert.equal(obj.metadata.version, "1.0");
      assert.equal(obj.planets[0].name, "Earth");
      assert.equal(obj.planets[0].distance, "0 AU");
      assert.equal(obj.planets[1].name, "Mars");
    });
  });

  describe("complex array scenarios", () => {
    it("should handle 3D array access", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "cube[2][1][0]", "deep value");

      assert.equal(obj.cube[2][1][0], "deep value");
    });

    it("should handle mixed bracket and dot notation", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(
        obj,
        "starmap[0].systems[1].planets[2].name",
        "Kepler-452b",
      );

      assert.equal(obj.starmap[0].systems[1].planets[2].name, "Kepler-452b");
    });

    it("should work with TypeScript typed arrays", () => {
      interface SpaceCraft {
        id: string;
        crew: Array<{
          name: string;
          role: string;
        }>;
      }

      interface Fleet {
        ships?: SpaceCraft[];
      }

      const obj: Fleet = {};
      const outpath = new OutPath<Fleet>();

      outpath.write(obj, "ships[0].id", "USS-Enterprise");
      outpath.write(obj, "ships[0].crew[0].name", "Captain Kirk");
      outpath.write(obj, "ships[0].crew[0].role", "Commander");

      assert.equal(obj.ships?.[0]?.id, "USS-Enterprise");
      assert.equal(obj.ships?.[0]?.crew?.[0]?.name, "Captain Kirk");
      assert.equal(obj.ships?.[0]?.crew?.[0]?.role, "Commander");
    });

    it("should handle class instances with arrays", () => {
      class SpaceStation {
        public modules?: Array<{
          name: string;
          type: string;
          capacity?: number;
        }>;
      }

      const station = new SpaceStation();
      const outpath = new OutPath<SpaceStation>();

      outpath.write(station, "modules[0].name", "Command Center");
      outpath.write(station, "modules[0].type", "control");
      outpath.write(station, "modules[1].name", "Living Quarters");
      outpath.write(station, "modules[1].capacity", 50);

      assert.equal(station.modules?.[0]?.name, "Command Center");
      assert.equal(station.modules?.[0]?.type, "control");
      assert.equal(station.modules?.[1]?.name, "Living Quarters");
      assert.equal(station.modules?.[1]?.capacity, 50);
    });
  });

  describe("array edge cases", () => {
    it("should handle different data types in arrays", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "mixed[0]", "string");
      outpath.write(obj, "mixed[1]", 42);
      outpath.write(obj, "mixed[2]", true);
      outpath.write(obj, "mixed[3]", null);
      outpath.write(obj, "mixed[4]", { nested: "object" });
      outpath.write(obj, "mixed[5]", [1, 2, 3]);

      assert.equal(obj.mixed[0], "string");
      assert.equal(obj.mixed[1], 42);
      assert.equal(obj.mixed[2], true);
      assert.equal(obj.mixed[3], null);
      assert.deepEqual(obj.mixed[4], { nested: "object" });
      assert.deepEqual(obj.mixed[5], [1, 2, 3]);
    });

    it("should handle zero index", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "coords[0]", "x-axis");

      assert.equal(obj.coords[0], "x-axis");
    });

    it("should handle large array indices", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "bigArray[999]", "far element");

      assert.equal(obj.bigArray[999], "far element");
      assert.equal(obj.bigArray.length, 1000);
    });

    it("should handle multiple arrays in same object", () => {
      const obj: any = {};
      const outpath = new OutPath();

      outpath.write(obj, "coordinates[0]", 100);
      outpath.write(obj, "coordinates[1]", 200);
      outpath.write(obj, "velocities[0]", 50);
      outpath.write(obj, "velocities[1]", 75);

      assert.equal(obj.coordinates[0], 100);
      assert.equal(obj.coordinates[1], 200);
      assert.equal(obj.velocities[0], 50);
      assert.equal(obj.velocities[1], 75);
    });
  });
});
