import * as assert from "assert";
import { Automapper } from "../src/automapper.js";
import { AutomapSimpleStrategy } from "../src/types/mapper.js";
import type { Rule } from "../src/types/mapper.js";

describe("Automapper - Deep Merge", () => {
  describe("basic deep merge", () => {
    it("should deeply merge nested objects", () => {
      const source = {
        ship: {
          name: "Enterprise",
          crew: 430,
        },
        mission: {
          type: "exploration",
          duration: "5 years",
        },
      };

      const target = {
        ship: {
          name: "Voyager", // conflict
          registry: "NCC-74656",
        },
        mission: {
          type: "rescue", // conflict
          status: "ongoing",
        },
        captain: "Janeway",
      };

      const automapper = new Automapper();
      const result = automapper.map(source, target);

      assert.strictEqual(result.ship.name, "Enterprise"); // source wins
      assert.strictEqual(result.ship.crew, 430); // from source
      assert.strictEqual(result.ship.registry, "NCC-74656"); // preserved from target
      assert.strictEqual(result.mission.type, "exploration"); // source wins
      assert.strictEqual(result.mission.duration, "5 years"); // from source
      assert.strictEqual(result.mission.status, "ongoing"); // preserved from target
      assert.strictEqual(result.captain, "Janeway"); // preserved from target
    });

    it("should handle multiple levels of nesting", () => {
      const source = {
        starfleet: {
          headquarters: {
            location: "San Francisco",
            building: {
              floors: 47,
              design: "modern",
            },
          },
        },
      };

      const target = {
        starfleet: {
          headquarters: {
            location: "Earth", // conflict
            established: 2161,
            building: {
              floors: 40, // conflict
              security: "classified",
            },
          },
          motto: "To boldly go",
        },
      };

      const automapper = new Automapper();
      const result = automapper.map(source, target);

      assert.strictEqual(
        result.starfleet.headquarters.location,
        "San Francisco",
      );
      assert.strictEqual(result.starfleet.headquarters.established, 2161);
      assert.strictEqual(result.starfleet.headquarters.building.floors, 47);
      assert.strictEqual(
        result.starfleet.headquarters.building.design,
        "modern",
      );
      assert.strictEqual(
        result.starfleet.headquarters.building.security,
        "classified",
      );
      assert.strictEqual(result.starfleet.motto, "To boldly go");
    });

    it("should merge when target has nested objects but source has primitives", () => {
      const source = {
        ship: "Enterprise",
        crew: 430,
      };

      const target = {
        ship: {
          name: "Voyager",
          registry: "NCC-74656",
        },
        crew: {
          total: 150,
          departments: 12,
        },
      };

      const automapper = new Automapper();
      const result = automapper.map(source, target);

      assert.strictEqual(result.ship, "Enterprise"); // source primitive overwrites target object
      assert.strictEqual(result.crew, 430); // source primitive overwrites target object
    });

    it("should merge when source has nested objects but target has primitives", () => {
      const source = {
        ship: {
          name: "Enterprise",
          registry: "NCC-1701",
        },
        crew: {
          total: 430,
          departments: 14,
        },
      };

      const target = {
        ship: "Voyager",
        crew: 150,
      };

      const automapper = new Automapper();
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.ship, {
        name: "Enterprise",
        registry: "NCC-1701",
      });
      assert.deepStrictEqual(result.crew, {
        total: 430,
        departments: 14,
      });
    });
  });

  describe("automapStrategy conflict resolution", () => {
    describe("PreserveTarget strategy", () => {
      it("should preserve target values when strategy is PreserveTarget", () => {
        const structure: Rule[] = [
          {
            target: "ship",
            automapStrategy: AutomapSimpleStrategy.PreserveTarget,
          },
        ];

        const source = {
          ship: {
            name: "Enterprise",
            crew: 430,
          },
          mission: "exploration",
        };

        const target = {
          ship: {
            name: "Voyager", // should be preserved
            registry: "NCC-74656",
          },
          mission: "rescue", // should be overwritten (no strategy)
        };

        const automapper = new Automapper({}, structure);
        const result = automapper.map(source, target);

        assert.strictEqual(result.ship.name, "Voyager"); // target preserved
        assert.strictEqual(result.ship.crew, 430); // source added
        assert.strictEqual(result.ship.registry, "NCC-74656"); // target preserved
        assert.strictEqual(result.mission, "exploration"); // source wins (no strategy)
      });

      it("should preserve target values in deeply nested objects", () => {
        const structure: Rule[] = [
          {
            target: "federation",
            automapStrategy: AutomapSimpleStrategy.PreserveTarget,
          },
        ];

        const source = {
          federation: {
            headquarters: {
              planet: "Earth",
              city: "San Francisco",
            },
          },
        };

        const target = {
          federation: {
            headquarters: {
              planet: "Mars", // should be preserved
              established: 2161,
            },
            members: 150,
          },
        };

        const automapper = new Automapper({}, structure);
        const result = automapper.map(source, target);

        assert.strictEqual(result.federation.headquarters.planet, "Mars");
        assert.strictEqual(
          result.federation.headquarters.city,
          "San Francisco",
        );
        assert.strictEqual(result.federation.headquarters.established, 2161);
        assert.strictEqual(result.federation.members, 150);
      });
    });

    describe("PreserveSource strategy", () => {
      it("should preserve source values when strategy is PreserveSource", () => {
        const structure: Rule[] = [
          {
            target: "ship",
            automapStrategy: AutomapSimpleStrategy.PreserveSource,
          },
        ];

        const source = {
          ship: {
            name: "Enterprise",
            crew: 430,
          },
        };

        const target = {
          ship: {
            name: "Voyager", // should be overwritten
            registry: "NCC-74656",
          },
        };

        const automapper = new Automapper({}, structure);
        const result = automapper.map(source, target);

        assert.strictEqual(result.ship.name, "Enterprise"); // source preserved
        assert.strictEqual(result.ship.crew, 430); // source added
        assert.strictEqual(result.ship.registry, "NCC-74656"); // target preserved (no conflict)
      });
    });

    describe("custom function strategy", () => {
      it("should handle custom function that returns objects", () => {
        const structure: Rule[] = [
          {
            target: "ship",
            automapStrategy: (sourceValue: any, targetValue: any) => {
              return {
                name: `${targetValue.name} & ${sourceValue.name}`,
                crew: sourceValue.crew + targetValue.crew,
                registry: targetValue.registry || sourceValue.registry,
              };
            },
          },
        ];

        const source = {
          ship: {
            name: "Enterprise",
            crew: 430,
          },
        };

        const target = {
          ship: {
            name: "Voyager",
            crew: 150,
            registry: "NCC-74656",
          },
        };

        const automapper = new Automapper({}, structure);
        const result = automapper.map(source, target);

        assert.strictEqual(result.ship.name, "Voyager & Enterprise");
        assert.strictEqual(result.ship.crew, 580);
        assert.strictEqual(result.ship.registry, "NCC-74656");
      });
    });

    describe("multiple strategies for different properties", () => {
      it("should apply different strategies to different properties", () => {
        const structure: Rule[] = [
          {
            target: "ship",
            automapStrategy: AutomapSimpleStrategy.PreserveTarget,
          },
          {
            target: "mission",
            automapStrategy: AutomapSimpleStrategy.PreserveSource,
          },
          {
            target: "crew",
            automapStrategy: (sourceValue: any, targetValue: any) => ({
              total: sourceValue.total + targetValue.total,
              departments: Math.max(
                sourceValue.departments,
                targetValue.departments,
              ),
            }),
          },
        ];

        const source = {
          ship: {
            name: "Enterprise",
            class: "Constitution",
          },
          mission: {
            type: "exploration",
            duration: "5 years",
          },
          crew: {
            total: 430,
            departments: 14,
          },
        };

        const target = {
          ship: {
            name: "Voyager", // should preserve target
            registry: "NCC-74656",
          },
          mission: {
            type: "rescue", // should preserve source
            status: "ongoing",
          },
          crew: {
            total: 150, // should use custom function
            departments: 12,
          },
        };

        const automapper = new Automapper({}, structure);
        const result = automapper.map(source, target);

        // ship: PreserveTarget
        assert.strictEqual(result.ship.name, "Voyager");
        assert.strictEqual(result.ship.class, "Constitution");
        assert.strictEqual(result.ship.registry, "NCC-74656");

        // mission: PreserveSource
        assert.strictEqual(result.mission.type, "exploration");
        assert.strictEqual(result.mission.duration, "5 years");
        assert.strictEqual(result.mission.status, "ongoing");

        // crew: custom function
        assert.strictEqual(result.crew.total, 580);
        assert.strictEqual(result.crew.departments, 14);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle arrays in source and target", () => {
      const source = {
        ships: ["Enterprise", "Voyager"],
        crew: {
          officers: ["Kirk", "Spock"],
        },
      };

      const target = {
        ships: ["Defiant", "Deep Space Nine"],
        crew: {
          officers: ["Picard", "Riker"],
          enlisted: ["Data", "Worf"],
        },
      };

      const automapper = new Automapper();
      const result = automapper.map(source, target);

      assert.deepStrictEqual(result.ships, ["Enterprise", "Voyager"]); // source array overwrites
      assert.deepStrictEqual(result.crew.officers, ["Kirk", "Spock"]); // source array overwrites
      assert.deepStrictEqual(result.crew.enlisted, ["Data", "Worf"]); // target preserved
    });

    it("should handle null and undefined values in deep merge", () => {
      const source = {
        ship: {
          name: "Enterprise",
          status: null,
        },
        mission: null,
      };

      const target = {
        ship: {
          name: "Voyager",
          status: "active",
          registry: "NCC-74656",
        },
        mission: {
          type: "exploration",
        },
        captain: "Janeway",
      };

      const automapper = new Automapper();
      const result = automapper.map(source, target);

      assert.strictEqual(result.ship.name, "Enterprise");
      assert.strictEqual(result.ship.status, null);
      assert.strictEqual(result.ship.registry, "NCC-74656");
      assert.strictEqual(result.mission, null); // source null overwrites target object
      assert.strictEqual(result.captain, "Janeway");
    });

    it("should handle empty objects in source and target", () => {
      const source = {
        ship: {},
        mission: {
          type: "exploration",
        },
      };

      const target = {
        ship: {
          name: "Voyager",
          registry: "NCC-74656",
        },
        mission: {},
      };

      const automapper = new Automapper();
      const result = automapper.map(source, target);

      assert.strictEqual(result.ship.name, "Voyager");
      assert.strictEqual(result.ship.registry, "NCC-74656");
      assert.strictEqual(result.mission.type, "exploration");
    });

    it("should handle properties that don't exist in target during deep merge", () => {
      const source = {
        ship: {
          name: "Enterprise",
          specs: {
            length: 289,
            crew: 430,
          },
        },
      };

      const target = {
        mission: "exploration",
      };

      const automapper = new Automapper();
      const result = automapper.map(source, target);

      // ship doesn't exist in target, so it shouldn't be mapped (automapper only maps matching properties)
      assert.strictEqual(result.ship, undefined);
      assert.strictEqual(result.mission, "exploration");
    });

    it("should handle strategy when no conflicts exist", () => {
      const structure: Rule[] = [
        {
          target: "ship",
          automapStrategy: AutomapSimpleStrategy.PreserveTarget,
        },
      ];

      const source = {
        ship: {
          name: "Enterprise",
          crew: 430,
        },
      };

      const target = {
        ship: {
          registry: "NCC-1701",
          class: "Constitution",
        },
      };

      const automapper = new Automapper({}, structure);
      const result = automapper.map(source, target);

      assert.strictEqual(result.ship.name, "Enterprise"); // no conflict, source added
      assert.strictEqual(result.ship.crew, 430); // no conflict, source added
      assert.strictEqual(result.ship.registry, "NCC-1701"); // target preserved
      assert.strictEqual(result.ship.class, "Constitution"); // target preserved
    });

    it("should handle deeply nested strategy application", () => {
      const structure: Rule[] = [
        {
          target: "federation",
          automapStrategy: AutomapSimpleStrategy.PreserveTarget,
        },
      ];

      const source = {
        federation: {
          headquarters: {
            location: {
              planet: "Earth",
              city: "San Francisco",
            },
          },
        },
      };

      const target = {
        federation: {
          headquarters: {
            location: {
              planet: "Mars", // should be preserved due to strategy
              sector: "Sol",
            },
            staff: 1000,
          },
          founded: 2161,
        },
      };

      const automapper = new Automapper({}, structure);
      const result = automapper.map(source, target);

      assert.strictEqual(
        result.federation.headquarters.location.planet,
        "Mars",
      );
      assert.strictEqual(
        result.federation.headquarters.location.city,
        "San Francisco",
      );
      assert.strictEqual(result.federation.headquarters.location.sector, "Sol");
      assert.strictEqual(result.federation.headquarters.staff, 1000);
      assert.strictEqual(result.federation.founded, 2161);
    });
  });

  describe("integration with existing automapper features", () => {
    it("should work with type checking enabled", () => {
      const source = {
        ship: {
          name: "Enterprise",
          crew: 430,
          active: true,
        },
      };

      const target = {
        ship: {
          name: "Voyager", // string conflict
          crew: "150", // type mismatch - should not map
          registry: "NCC-74656",
        },
      };

      const automapper = new Automapper({ checkType: true });
      const result = automapper.map(source, target);

      assert.strictEqual(result.ship.name, "Enterprise");
      assert.strictEqual(result.ship.crew, "150"); // type mismatch, target preserved
      assert.strictEqual(result.ship.active, true);
      assert.strictEqual(result.ship.registry, "NCC-74656");
    });

    it("should skip undefined values during deep merge", () => {
      const source = {
        ship: {
          name: "Enterprise",
          crew: undefined,
          registry: "NCC-1701",
        },
      };

      const target = {
        ship: {
          name: "Voyager",
          crew: 150,
          class: "Intrepid",
        },
      };

      const automapper = new Automapper({ checkType: false });
      const result = automapper.map(source, target);

      assert.strictEqual(result.ship.name, "Enterprise");
      assert.strictEqual(result.ship.crew, 150); // undefined skipped, target preserved
      assert.strictEqual(result.ship.registry, "NCC-1701");
      assert.strictEqual(result.ship.class, "Intrepid");
    });

    it("should work with class instances", () => {
      class Ship {
        constructor(
          public name: string,
          public registry: string,
        ) {}
      }

      class Mission {
        constructor(
          public type: string,
          public duration: string,
        ) {}
      }

      const source = {
        ship: new Ship("Enterprise", "NCC-1701"),
        mission: {
          type: "exploration",
          priority: "high",
        },
      };

      const target = {
        ship: new Ship("Voyager", "NCC-74656"),
        mission: new Mission("rescue", "1 year"),
      };

      const automapper = new Automapper();
      const result = automapper.map(source, target);

      assert.strictEqual(result.ship.name, "Enterprise");
      assert.strictEqual(result.ship.registry, "NCC-1701");
      assert.strictEqual(result.mission.type, "exploration");
      assert.strictEqual(result.mission.duration, "1 year"); // preserved from target
      assert.strictEqual((result.mission as any).priority, "high"); // added from source
    });
  });
});
