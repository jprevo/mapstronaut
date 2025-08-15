import * as assert from "assert";
import { Automapper } from "../src/automapper.js";
import { AutomapArrayStrategy } from "../src/types/mapper.js";

describe("Automapper Array Merging", function () {
  describe("default array behavior", function () {
    it("should replace target array with source array by default", function () {
      const automapper = new Automapper();
      const source = { satellites: ["Europa", "Io"] };
      const target = { satellites: ["Titan", "Enceladus", "Mimas"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result, { satellites: ["Europa", "Io"] });
    });

    it("should handle empty arrays", function () {
      const automapper = new Automapper();
      const source = { moons: [] };
      const target = { moons: ["Luna", "Phobos"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result, { moons: [] });
    });

    it("should handle source array replacing empty target array", function () {
      const automapper = new Automapper();
      const source = { planets: ["Mars", "Venus"] };
      const target = { planets: [] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result, { planets: ["Mars", "Venus"] });
    });
  });

  describe("AutomapArrayStrategy.Replace", function () {
    it("should replace target array with source array", function () {
      const structure = [
        {
          target: "starSystems",
          automapArrayStrategy: AutomapArrayStrategy.Replace,
        },
      ];
      const automapper = new Automapper({}, structure);

      const source = { starSystems: ["Alpha Centauri", "Proxima Centauri"] };
      const target = {
        starSystems: ["Solar System", "Kepler-452", "TRAPPIST-1"],
      };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result, {
        starSystems: ["Alpha Centauri", "Proxima Centauri"],
      });
    });

    it("should handle empty source array replacing target", function () {
      const structure = [
        {
          target: "galaxies",
          automapArrayStrategy: AutomapArrayStrategy.Replace,
        },
      ];
      const automapper = new Automapper({}, structure);

      const source = { galaxies: [] };
      const target = { galaxies: ["Milky Way", "Andromeda"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result, { galaxies: [] });
    });
  });

  describe("AutomapArrayStrategy.Concatenate", function () {
    it("should concatenate source array to target array", function () {
      const structure = [
        {
          target: "asteroids",
          automapArrayStrategy: AutomapArrayStrategy.Concatenate,
        },
      ];
      const automapper = new Automapper({}, structure);

      const source = { asteroids: ["Vesta", "Pallas"] };
      const target = { asteroids: ["Ceres", "Eros"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result, {
        asteroids: ["Ceres", "Eros", "Vesta", "Pallas"],
      });
    });

    it("should handle empty target array", function () {
      const structure = [
        {
          target: "comets",
          automapArrayStrategy: AutomapArrayStrategy.Concatenate,
        },
      ];
      const automapper = new Automapper({}, structure);

      const source = { comets: ["Halley", "Hale-Bopp"] };
      const target = { comets: [] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result, { comets: ["Halley", "Hale-Bopp"] });
    });

    it("should handle empty source array", function () {
      const structure = [
        {
          target: "nebulae",
          automapArrayStrategy: AutomapArrayStrategy.Concatenate,
        },
      ];
      const automapper = new Automapper({}, structure);

      const source = { nebulae: [] };
      const target = { nebulae: ["Orion", "Eagle"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result, { nebulae: ["Orion", "Eagle"] });
    });

    it("should handle both arrays empty", function () {
      const structure = [
        {
          target: "blackHoles",
          automapArrayStrategy: AutomapArrayStrategy.Concatenate,
        },
      ];
      const automapper = new Automapper({}, structure);

      const source = { blackHoles: [] };
      const target = { blackHoles: [] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result, { blackHoles: [] });
    });
  });

  describe("AutomapArrayStrategy.MergeByIndex", function () {
    it("should merge arrays by index, source values overriding target", function () {
      const structure = [
        {
          target: "spaceStations",
          automapArrayStrategy: AutomapArrayStrategy.MergeByIndex,
        },
      ];
      const automapper = new Automapper({}, structure);

      const source = { spaceStations: ["ISS", "Mir"] };
      const target = { spaceStations: ["Skylab", "Salyut", "Tiangong"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result, {
        spaceStations: ["ISS", "Mir", "Tiangong"],
      });
    });

    it("should extend target array when source is longer", function () {
      const structure = [
        {
          target: "rovers",
          automapArrayStrategy: AutomapArrayStrategy.MergeByIndex,
        },
      ];
      const automapper = new Automapper({}, structure);

      const source = {
        rovers: ["Curiosity", "Perseverance", "Opportunity", "Spirit"],
      };
      const target = { rovers: ["Sojourner", "InSight"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result, {
        rovers: ["Curiosity", "Perseverance", "Opportunity", "Spirit"],
      });
    });

    it("should preserve target values when source is shorter", function () {
      const structure = [
        {
          target: "telescopes",
          automapArrayStrategy: AutomapArrayStrategy.MergeByIndex,
        },
      ];
      const automapper = new Automapper({}, structure);

      const source = { telescopes: ["Hubble"] };
      const target = { telescopes: ["Spitzer", "Kepler", "JWST"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result, {
        telescopes: ["Hubble", "Kepler", "JWST"],
      });
    });

    it("should handle undefined values in source array", function () {
      const structure = [
        {
          target: "satellites",
          automapArrayStrategy: AutomapArrayStrategy.MergeByIndex,
        },
      ];
      const automapper = new Automapper({}, structure);

      const source = { satellites: ["Voyager 1", undefined, "New Horizons"] };
      const target = { satellites: ["Pioneer 10", "Voyager 2", "Cassini"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result, {
        satellites: ["Voyager 1", "Voyager 2", "New Horizons"],
      });
    });

    it("should handle empty source array", function () {
      const structure = [
        {
          target: "exoplanets",
          automapArrayStrategy: AutomapArrayStrategy.MergeByIndex,
        },
      ];
      const automapper = new Automapper({}, structure);

      const source = { exoplanets: [] };
      const target = { exoplanets: ["Kepler-452b", "Proxima b"] };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result, {
        exoplanets: ["Kepler-452b", "Proxima b"],
      });
    });
  });

  describe("complex nested objects with arrays", function () {
    it("should handle arrays within nested objects using separate automappers", function () {
      // For nested arrays, you would typically create a separate automapper for the nested object
      const missionStructure = [
        {
          target: "crew",
          automapArrayStrategy: AutomapArrayStrategy.Concatenate,
        },
        {
          target: "equipment",
          automapArrayStrategy: AutomapArrayStrategy.Replace,
        },
      ];
      const missionAutomapper = new Automapper({}, missionStructure);

      const source = {
        mission: {
          name: "Apollo 11",
          crew: ["Neil Armstrong", "Buzz Aldrin"],
          equipment: ["LEM", "Command Module"],
        },
      };
      const target = {
        mission: {
          name: "Apollo 10",
          crew: ["Tom Stafford"],
          equipment: ["Service Module", "Lunar Module"],
          duration: "8 days",
        },
      };

      // Map the nested mission object separately
      const mappedMission = missionAutomapper.map(
        source.mission,
        target.mission,
      );
      const result = { mission: mappedMission };

      assert.deepStrictEqual(result, {
        mission: {
          name: "Apollo 11",
          crew: ["Tom Stafford", "Neil Armstrong", "Buzz Aldrin"],
          equipment: ["LEM", "Command Module"],
          duration: "8 days",
        },
      });
    });

    it("should handle multiple array properties with different strategies", function () {
      const structure = [
        {
          target: "planets",
          automapArrayStrategy: AutomapArrayStrategy.Concatenate,
        },
        {
          target: "stars",
          automapArrayStrategy: AutomapArrayStrategy.Replace,
        },
        {
          target: "moons",
          automapArrayStrategy: AutomapArrayStrategy.MergeByIndex,
        },
      ];
      const automapper = new Automapper({}, structure);

      const source = {
        planets: ["Mars", "Venus"],
        stars: ["Proxima Centauri"],
        moons: ["Europa", "Ganymede"],
      };
      const target = {
        planets: ["Earth"],
        stars: ["Sun", "Alpha Centauri"],
        moons: ["Luna", "Phobos", "Deimos"],
      };
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result, {
        planets: ["Earth", "Mars", "Venus"],
        stars: ["Proxima Centauri"],
        moons: ["Europa", "Ganymede", "Deimos"],
      });
    });
  });

  describe("edge cases", function () {
    it("should handle non-array source with array target", function () {
      const structure = [
        {
          target: "data",
          automapArrayStrategy: AutomapArrayStrategy.Concatenate,
        },
      ];
      const automapper = new Automapper({}, structure);

      const source = { data: "not an array" };
      const target = { data: ["item1", "item2"] };
      const result = automapper.map(source, target);

      // Should not apply array strategy since source is not an array
      assert.deepStrictEqual(result, { data: "not an array" });
    });

    it("should handle array source with non-array target", function () {
      const structure = [
        {
          target: "data",
          automapArrayStrategy: AutomapArrayStrategy.Concatenate,
        },
      ];
      const automapper = new Automapper({}, structure);

      const source = { data: ["item1", "item2"] };
      const target = { data: "not an array" };
      const result = automapper.map(source, target);

      // Should not apply array strategy since target is not an array
      assert.deepStrictEqual(result, { data: ["item1", "item2"] });
    });

    it("should handle missing strategy gracefully", function () {
      const automapper = new Automapper();

      const source = { spacecraft: ["Apollo", "Soyuz"] };
      const target = { spacecraft: ["Shuttle", "Dragon"] };
      const result = automapper.map(source, target);

      // Should use default behavior (replace)
      assert.deepStrictEqual(result, { spacecraft: ["Apollo", "Soyuz"] });
    });
  });
});
