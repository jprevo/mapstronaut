import * as assert from "assert";
import { Automapper } from "../src/automapper.js";
import { AutomapArrayStrategy } from "../src/types/automapper.js";

describe("Automapper - Array Strategy Tests", function () {
  describe("AutomapArrayStrategy.Replace (default)", function () {
    it("should replace target array with source array", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.Replace,
      });

      const source = { spacecrafts: ["Enterprise", "Voyager"] };
      const target = { spacecrafts: ["Discovery", "Defiant", "Excelsior"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.spacecrafts, ["Enterprise", "Voyager"]);
    });

    it("should replace empty target array with source array", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.Replace,
      });

      const source = { planets: ["Earth", "Mars", "Jupiter"] };
      const target = { planets: [] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.planets, ["Earth", "Mars", "Jupiter"]);
    });

    it("should replace target array with empty source array", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.Replace,
      });

      const source = { moons: [] };
      const target = { moons: ["Luna", "Phobos", "Deimos"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.moons, []);
    });

    it("should use Replace as default strategy when none specified", function () {
      const automapper = new Automapper();

      const source = { satellites: ["Hubble", "Kepler"] };
      const target = { satellites: ["Spitzer", "Chandra"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.satellites, ["Hubble", "Kepler"]);
    });
  });

  describe("AutomapArrayStrategy.Concatenate", function () {
    it("should concatenate source array to target array", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.Concatenate,
      });

      const source = { galaxies: ["Milky Way", "Andromeda"] };
      const target = { galaxies: ["Triangulum", "Whirlpool"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.galaxies, [
        "Triangulum",
        "Whirlpool",
        "Milky Way",
        "Andromeda",
      ]);
    });

    it("should handle concatenation with empty target array", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.Concatenate,
      });

      const source = { asteroids: ["Ceres", "Vesta"] };
      const target = { asteroids: [] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.asteroids, ["Ceres", "Vesta"]);
    });

    it("should handle concatenation with empty source array", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.Concatenate,
      });

      const source = { comets: [] };
      const target = { comets: ["Halley", "Hale-Bopp"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.comets, ["Halley", "Hale-Bopp"]);
    });

    it("should concatenate arrays with mixed data types", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.Concatenate,
      });

      const source = { data: [1, "neutron star", true] };
      const target = { data: ["pulsar", 42, false] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.data, [
        "pulsar",
        42,
        false,
        1,
        "neutron star",
        true,
      ]);
    });
  });

  describe("AutomapArrayStrategy.MergeByIndex", function () {
    it("should merge arrays by index, replacing target values with source values", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.MergeByIndex,
      });

      const source = { crew: ["Picard", "Data"] };
      const target = { crew: ["Kirk", "Spock", "McCoy"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.crew, ["Picard", "Data", "McCoy"]);
    });

    it("should preserve target values when source has fewer elements", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.MergeByIndex,
      });

      const source = { officers: ["Riker"] };
      const target = { officers: ["Janeway", "Chakotay", "Tuvok", "Paris"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.officers, [
        "Riker",
        "Chakotay",
        "Tuvok",
        "Paris",
      ]);
    });

    it("should extend target array when source has more elements", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.MergeByIndex,
      });

      const source = { captains: ["Sisko", "Archer", "Burnham", "Pike"] };
      const target = { captains: ["Lorca", "Georgiou"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.captains, [
        "Sisko",
        "Archer",
        "Burnham",
        "Pike",
      ]);
    });

    it("should skip undefined values in source array", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.MergeByIndex,
      });

      const source = { ships: ["Voyager", undefined, "Enterprise"] };
      const target = { ships: ["Discovery", "Defiant", "Excelsior"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.ships, [
        "Voyager",
        "Defiant",
        "Enterprise",
      ]);
    });

    it("should handle null values in source array", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.MergeByIndex,
      });

      const source = { stations: ["DS9", null, "K-7"] };
      const target = {
        stations: ["Earth Spacedock", "Starbase 1", "Utopia Planitia"],
      };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.stations, ["DS9", null, "K-7"]);
    });

    it("should handle empty arrays correctly", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.MergeByIndex,
      });

      const source = { weapons: [] };
      const target = { weapons: ["Phaser", "Torpedo"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.weapons, ["Phaser", "Torpedo"]);
    });
  });

  describe("Custom Array Strategy Function", function () {
    it("should use custom strategy function for array merging", function () {
      const customStrategy = (key: string, source: any[], target: any[]) => {
        // Custom strategy: interleave arrays
        const result = [];
        const maxLength = Math.max(source.length, target.length);
        for (let i = 0; i < maxLength; i++) {
          if (i < target.length) result.push(target[i]);
          if (i < source.length) result.push(source[i]);
        }
        return result;
      };

      const automapper = new Automapper({
        automapArrayStrategy: customStrategy,
      });

      const source = { coordinates: [1, 3, 5] };
      const target = { coordinates: [2, 4] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.coordinates, [2, 1, 4, 3, 5]);
    });

    it("should pass correct parameters to custom strategy function", function () {
      let capturedKey = "";
      let capturedSource: any[] = [];
      let capturedTarget: any[] = [];

      const customStrategy = (key: string, source: any[], target: any[]) => {
        capturedKey = key;
        capturedSource = source;
        capturedTarget = target;
        return [...target, ...source];
      };

      const automapper = new Automapper({
        automapArrayStrategy: customStrategy,
      });

      const source = { missions: ["Apollo", "Artemis"] };
      const target = { missions: ["Mercury", "Gemini"] };
      automapper.map(source, target);

      assert.strictEqual(capturedKey, "missions");
      assert.deepStrictEqual(capturedSource, ["Apollo", "Artemis"]);
      assert.deepStrictEqual(capturedTarget, ["Mercury", "Gemini"]);
    });

    it("should handle custom strategy returning empty array", function () {
      const customStrategy = () => [];

      const automapper = new Automapper({
        automapArrayStrategy: customStrategy,
      });

      const source = { rockets: ["Falcon 9", "Atlas V"] };
      const target = { rockets: ["Delta IV", "Soyuz"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.rockets, []);
    });
  });

  describe("Array Strategy with Nested Objects", function () {
    it("should apply array strategy to nested object arrays", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.Concatenate,
      });

      const source = {
        fleet: {
          explorers: ["USS Enterprise", "USS Voyager"],
        },
      };
      const target = {
        fleet: {
          explorers: ["USS Discovery"],
          fighters: ["USS Defiant"],
        },
      };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.fleet.explorers, [
        "USS Discovery",
        "USS Enterprise",
        "USS Voyager",
      ]);
      assert.deepStrictEqual(result.fleet.fighters, ["USS Defiant"]);
    });

    it("should handle arrays of objects with array strategy", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.Replace,
      });

      const source = {
        crew: [
          { name: "Jean-Luc Picard", rank: "Captain" },
          { name: "William Riker", rank: "Commander" },
        ],
      };
      const target = {
        crew: [
          { name: "James Kirk", rank: "Captain" },
          { name: "Spock", rank: "Commander" },
          { name: "Leonard McCoy", rank: "Doctor" },
        ],
      };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.crew, [
        { name: "Jean-Luc Picard", rank: "Captain" },
        { name: "William Riker", rank: "Commander" },
      ]);
    });
  });

  describe("Array Strategy with Type Checking", function () {
    it("should respect type checking with array strategy", function () {
      const automapper = new Automapper({
        checkType: true,
        automapArrayStrategy: AutomapArrayStrategy.Concatenate,
      });

      const source = {
        numbers: [1, 2, 3],
        strings: "not an array", // Type mismatch
      };
      const target = {
        numbers: [4, 5],
        strings: ["a", "b"], // This should not be mapped due to type mismatch
      };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.numbers, [4, 5, 1, 2, 3]);
      assert.deepStrictEqual(result.strings, ["a", "b"]); // Unchanged due to type mismatch
    });

    it("should apply array strategy when both are arrays with type checking", function () {
      const automapper = new Automapper({
        checkType: true,
        automapArrayStrategy: AutomapArrayStrategy.MergeByIndex,
      });

      const source = {
        coordinates: [10, 20, 30],
        data: [true, false],
      };
      const target = {
        coordinates: [1, 2],
        data: [false, true, false],
      };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.coordinates, [10, 20, 30]);
      assert.deepStrictEqual(result.data, [true, false, false]);
    });
  });

  describe("Array Strategy Edge Cases", function () {
    it("should handle arrays with different primitive types using MergeByIndex", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.MergeByIndex,
      });

      const source = { mixed: [42, "answer", true] };
      const target = { mixed: ["question", 0, false, null] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.mixed, [42, "answer", true, null]);
    });

    it("should handle sparse arrays with MergeByIndex", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.MergeByIndex,
      });

      const source = { sparse: [1, , 3] }; // eslint-disable-line no-sparse-arrays
      const target = { sparse: [10, 20, 30, 40] };
      const result = automapper.map(source, target);

      // Sparse array elements are undefined, so they should be skipped
      assert.deepStrictEqual(result.sparse, [1, 20, 3, 40]);
    });

    it("should not apply array strategy when target is not an array", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.Concatenate,
      });

      const source = { data: [1, 2, 3] };
      const target = { data: "not an array" };
      const result = automapper.map(source, target);

      // Should replace since target is not an array
      assert.deepStrictEqual(result.data, [1, 2, 3]);
    });

    it("should not apply array strategy when source is not an array", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.Concatenate,
      });

      const source = { data: "not an array" };
      const target = { data: [1, 2, 3] };
      const result = automapper.map(source, target);

      // Should replace since source is not an array
      assert.strictEqual(result.data, "not an array");
    });
  });

  describe("Array Strategy Configuration", function () {
    it("should allow changing array strategy via setConfiguration", function () {
      const automapper = new Automapper({
        automapArrayStrategy: AutomapArrayStrategy.Replace,
      });

      const source = { items: ["a", "b"] };
      let target = { items: ["x", "y", "z"] };

      // First with Replace strategy
      let result = automapper.map(source, target);
      assert.deepStrictEqual(result.items, ["a", "b"]);

      // Change to Concatenate strategy
      automapper.setConfiguration({
        automapArrayStrategy: AutomapArrayStrategy.Concatenate,
      });

      // Use a fresh target for the second test
      target = { items: ["x", "y", "z"] };
      result = automapper.map(source, target);
      assert.deepStrictEqual(result.items, ["x", "y", "z", "a", "b"]);
    });

    it("should preserve array strategy when only changing other options", function () {
      const automapper = new Automapper({
        checkType: false,
        automapArrayStrategy: AutomapArrayStrategy.MergeByIndex,
      });

      // Change only checkType
      automapper.setConfiguration({ checkType: true });

      const config = automapper.getConfiguration();
      assert.strictEqual(
        config.automapArrayStrategy,
        AutomapArrayStrategy.MergeByIndex,
      );
    });
  });
});
