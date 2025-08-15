import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { AsyncMapper, mapObjectAsync } from "../src/async-mapper.js";
import type { AsyncStructure } from "../src/types/mapper.js";

describe("Parallel Async Mapping", () => {
  describe("Basic Parallel Operations", () => {
    it("should run multiple async transforms in parallel", async () => {
      const source = {
        name: "captain cosmos",
        rank: "commander",
        missions: 15,
      };

      let startTimes: number[] = [];
      let endTimes: number[] = [];

      const structure: AsyncStructure = [
        {
          source: "name",
          target: "astronautName",
          transform: async (data: string) => {
            startTimes.push(Date.now());
            await new Promise((resolve) => setTimeout(resolve, 50));
            endTimes.push(Date.now());
            return data.toUpperCase();
          },
        },
        {
          source: "rank",
          target: "officerRank",
          transform: async (data: string) => {
            startTimes.push(Date.now());
            await new Promise((resolve) => setTimeout(resolve, 50));
            endTimes.push(Date.now());
            return data.toUpperCase();
          },
        },
        {
          source: "missions",
          target: "totalMissions",
          transform: async (data: number) => {
            startTimes.push(Date.now());
            await new Promise((resolve) => setTimeout(resolve, 50));
            endTimes.push(Date.now());
            return data * 2;
          },
        },
      ];

      const mapper = new AsyncMapper(structure, { parallelRun: true });
      const result = await mapper.map(source);

      // Verify correct mapping
      assert.deepEqual(result, {
        astronautName: "CAPTAIN COSMOS",
        officerRank: "COMMANDER",
        totalMissions: 30,
      });

      // Verify parallel execution (all should start around the same time)
      const maxStartTimeDiff =
        Math.max(...startTimes) - Math.min(...startTimes);
      assert(
        maxStartTimeDiff < 20,
        "Tasks should start almost simultaneously in parallel mode",
      );
    });

    it("should run sequential when parallelRun is false", async () => {
      const source = {
        spacecraft: "nebula explorer",
        crew: 7,
      };

      let completionOrder: string[] = [];

      const structure: AsyncStructure = [
        {
          source: "spacecraft",
          target: "shipName",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 30));
            completionOrder.push("first");
            return data.toUpperCase();
          },
        },
        {
          source: "crew",
          target: "crewSize",
          transform: async (data: number) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            completionOrder.push("second");
            return data + 1;
          },
        },
      ];

      const mapper = new AsyncMapper(structure, { parallelRun: false });
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        shipName: "NEBULA EXPLORER",
        crewSize: 8,
      });

      // In sequential mode, first task should complete before second starts
      assert.deepEqual(completionOrder, ["first", "second"]);
    });

    it("should handle parallel execution with mixed sync and async transforms", async () => {
      const source = {
        planet: "mars",
        temperature: -80,
        atmosphere: "co2",
      };

      const structure: AsyncStructure = [
        {
          source: "planet",
          target: "destination",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 20));
            return `Planet ${data.toUpperCase()}`;
          },
        },
        {
          source: "temperature",
          target: "tempCelsius",
          transform: (data: number) => data, // sync transform
        },
        {
          source: "atmosphere",
          target: "gasComposition",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 15));
            return data.toUpperCase();
          },
        },
      ];

      const mapper = new AsyncMapper(structure, { parallelRun: true });
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        destination: "Planet MARS",
        tempCelsius: -80,
        gasComposition: "CO2",
      });
    });
  });

  describe("Parallel Filters", () => {
    it("should apply async filters in parallel", async () => {
      const source = {
        astronauts: [
          { name: "Luna", experience: 5 },
          { name: "Solar", experience: 2 },
          { name: "Cosmic", experience: 8 },
        ],
      };

      let filterExecutions: number[] = [];

      const structure: AsyncStructure = [
        {
          source: "astronauts[0].name",
          target: "experienced1",
          filter: async (data, source) => {
            filterExecutions.push(Date.now());
            await new Promise((resolve) => setTimeout(resolve, 20));
            return source.astronauts[0].experience >= 3;
          },
        },
        {
          source: "astronauts[1].name",
          target: "experienced2",
          filter: async (data, source) => {
            filterExecutions.push(Date.now());
            await new Promise((resolve) => setTimeout(resolve, 20));
            return source.astronauts[1].experience >= 3;
          },
        },
        {
          source: "astronauts[2].name",
          target: "experienced3",
          filter: async (data, source) => {
            filterExecutions.push(Date.now());
            await new Promise((resolve) => setTimeout(resolve, 20));
            return source.astronauts[2].experience >= 3;
          },
        },
      ];

      const mapper = new AsyncMapper(structure, { parallelRun: true });
      const result = await mapper.map(source);

      // Only Luna and Cosmic should be mapped (experience >= 3)
      assert.deepEqual(result, {
        experienced1: "Luna",
        experienced3: "Cosmic",
      });

      // Verify filters ran in parallel
      const maxFilterTimeDiff =
        Math.max(...filterExecutions) - Math.min(...filterExecutions);
      assert(
        maxFilterTimeDiff < 10,
        "Filters should execute almost simultaneously",
      );
    });

    it("should handle parallel filters with constants", async () => {
      const source = { missionType: "exploration" };

      const structure: AsyncStructure = [
        {
          constant: "SPACE_MISSION",
          target: "type1",
          filter: async (data, source) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return source.missionType === "exploration";
          },
        },
        {
          constant: "CARGO_MISSION",
          target: "type2",
          filter: async (data, source) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return source.missionType === "cargo";
          },
        },
      ];

      const mapper = new AsyncMapper(structure, { parallelRun: true });
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        type1: "SPACE_MISSION",
      });
    });
  });

  describe("Parallel FailOn Operations", () => {
    it("should handle parallel failOn checks", async () => {
      const source = {
        fuel: 85,
        oxygen: 92,
        power: 78,
      };

      const structure: AsyncStructure = [
        {
          source: "fuel",
          target: "fuelLevel",
          failOn: async (data) => {
            await new Promise((resolve) => setTimeout(resolve, 15));
            return data < 80; // Should pass (85 >= 80)
          },
        },
        {
          source: "oxygen",
          target: "oxygenLevel",
          failOn: async (data) => {
            await new Promise((resolve) => setTimeout(resolve, 15));
            return data < 90; // Should pass (92 >= 90)
          },
        },
        {
          source: "power",
          target: "powerLevel",
          failOn: async (data) => {
            await new Promise((resolve) => setTimeout(resolve, 15));
            return data < 75; // Should pass (78 >= 75)
          },
        },
      ];

      const mapper = new AsyncMapper(structure, { parallelRun: true });
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        fuelLevel: 85,
        oxygenLevel: 92,
        powerLevel: 78,
      });
    });

    it("should fail fast when one failOn returns true in parallel", async () => {
      const source = {
        altitude: 1000,
        velocity: 500,
      };

      const structure: AsyncStructure = [
        {
          source: "altitude",
          target: "currentAltitude",
          failOn: async (data) => {
            await new Promise((resolve) => setTimeout(resolve, 20));
            return data < 2000; // This will fail (1000 < 2000)
          },
        },
        {
          source: "velocity",
          target: "currentVelocity",
          failOn: async (data) => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            return data < 100; // This would pass but shouldn't be reached
          },
        },
      ];

      const mapper = new AsyncMapper(structure, { parallelRun: true });

      await assert.rejects(
        async () => await mapper.map(source),
        /Mapping failed: condition failed for rule with target 'currentAltitude'/,
      );
    });
  });

  describe("Complex Parallel Scenarios", () => {
    it("should handle parallel execution with all function types", async () => {
      const source = {
        mission: {
          name: "apollo",
          duration: 8,
          crew: ["neil", "buzz", "michael"],
        },
        status: "active",
      };

      let executionLog: string[] = [];

      const structure: AsyncStructure = [
        {
          source: "mission.name",
          target: "missionName",
          filter: async (data) => {
            executionLog.push("filter1-start");
            await new Promise((resolve) => setTimeout(resolve, 10));
            executionLog.push("filter1-end");
            return data.length > 3;
          },
          transform: async (data: string) => {
            executionLog.push("transform1-start");
            await new Promise((resolve) => setTimeout(resolve, 15));
            executionLog.push("transform1-end");
            return `Mission ${data.toUpperCase()}`;
          },
          failOn: async (data: string) => {
            executionLog.push("failOn1-start");
            await new Promise((resolve) => setTimeout(resolve, 5));
            executionLog.push("failOn1-end");
            return !data.includes("APOLLO");
          },
        },
        {
          source: "mission.duration",
          target: "missionDays",
          filter: async (data) => {
            executionLog.push("filter2-start");
            await new Promise((resolve) => setTimeout(resolve, 8));
            executionLog.push("filter2-end");
            return data > 5;
          },
          transform: async (data: number) => {
            executionLog.push("transform2-start");
            await new Promise((resolve) => setTimeout(resolve, 12));
            executionLog.push("transform2-end");
            return data * 24; // Convert to hours
          },
        },
        {
          constant: "SPACE_EXPLORATION",
          target: "category",
          filter: async (data, source) => {
            executionLog.push("filter3-start");
            await new Promise((resolve) => setTimeout(resolve, 6));
            executionLog.push("filter3-end");
            return source.status === "active";
          },
        },
      ];

      const mapper = new AsyncMapper(structure, { parallelRun: true });
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        missionName: "Mission APOLLO",
        missionDays: 192, // 8 * 24
        category: "SPACE_EXPLORATION",
      });

      // Verify that filters started around the same time (parallel execution)
      const filter1Start = executionLog.indexOf("filter1-start");
      const filter2Start = executionLog.indexOf("filter2-start");
      const filter3Start = executionLog.indexOf("filter3-start");

      // All filters should start before any significant processing
      assert(filter1Start <= 2, "Filter 1 should start early");
      assert(filter2Start <= 2, "Filter 2 should start early");
      assert(filter3Start <= 2, "Filter 3 should start early");
    });

    it("should maintain data integrity in parallel execution", async () => {
      const source = {
        galaxy: "andromeda",
        stars: 1000000000,
        planets: 5000000000,
      };

      const structure: AsyncStructure = [
        {
          source: "galaxy",
          target: "galaxyName",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 20));
            return data.charAt(0).toUpperCase() + data.slice(1);
          },
        },
        {
          source: "stars",
          target: "starCount",
          transform: async (data: number) => {
            await new Promise((resolve) => setTimeout(resolve, 25));
            return data.toLocaleString();
          },
        },
        {
          source: "planets",
          target: "planetCount",
          transform: async (data: number) => {
            await new Promise((resolve) => setTimeout(resolve, 15));
            return data.toLocaleString();
          },
        },
      ];

      const mapper = new AsyncMapper(structure, { parallelRun: true });
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        galaxyName: "Andromeda",
        starCount: "1,000,000,000",
        planetCount: "5,000,000,000",
      });
    });

    it("should work with nested object targets in parallel", async () => {
      const source = {
        commander: "stella nova",
        engineer: "rocket smith",
        pilot: "sky walker",
      };

      const structure: AsyncStructure = [
        {
          source: "commander",
          target: "crew.leadership.commander",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 15));
            return data.toUpperCase();
          },
        },
        {
          source: "engineer",
          target: "crew.technical.engineer",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 20));
            return data.toUpperCase();
          },
        },
        {
          source: "pilot",
          target: "crew.operations.pilot",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return data.toUpperCase();
          },
        },
      ];

      const mapper = new AsyncMapper(structure, { parallelRun: true });
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        crew: {
          leadership: {
            commander: "STELLA NOVA",
          },
          technical: {
            engineer: "ROCKET SMITH",
          },
          operations: {
            pilot: "SKY WALKER",
          },
        },
      });
    });
  });

  describe("Performance Tests", () => {
    it("should execute faster in parallel mode for independent tasks", async () => {
      const source = {
        a: 1,
        b: 2,
        c: 3,
        d: 4,
        e: 5,
      };

      const delayMs = 30;
      const structure: AsyncStructure = [
        {
          source: "a",
          target: "result_a",
          transform: async (data: number) => {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            return data * 10;
          },
        },
        {
          source: "b",
          target: "result_b",
          transform: async (data: number) => {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            return data * 10;
          },
        },
        {
          source: "c",
          target: "result_c",
          transform: async (data: number) => {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            return data * 10;
          },
        },
        {
          source: "d",
          target: "result_d",
          transform: async (data: number) => {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            return data * 10;
          },
        },
        {
          source: "e",
          target: "result_e",
          transform: async (data: number) => {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            return data * 10;
          },
        },
      ];

      // Test sequential execution
      const sequentialMapper = new AsyncMapper(structure, {
        parallelRun: false,
      });
      const sequentialStart = Date.now();
      const sequentialResult = await sequentialMapper.map(source);
      const sequentialTime = Date.now() - sequentialStart;

      // Test parallel execution
      const parallelMapper = new AsyncMapper(structure, { parallelRun: true });
      const parallelStart = Date.now();
      const parallelResult = await parallelMapper.map(source);
      const parallelTime = Date.now() - parallelStart;

      // Results should be identical
      assert.deepEqual(sequentialResult, parallelResult);

      const expectedResult = {
        result_a: 10,
        result_b: 20,
        result_c: 30,
        result_d: 40,
        result_e: 50,
      };
      assert.deepEqual(parallelResult, expectedResult);

      // Parallel should be significantly faster
      // Sequential: ~150ms (5 * 30ms), Parallel: ~30ms
      assert(
        parallelTime < sequentialTime * 0.7,
        `Parallel execution (${parallelTime}ms) should be faster than sequential (${sequentialTime}ms)`,
      );
    });
  });

  describe("mapObjectAsync with Parallel Option", () => {
    it("should support parallelRun option in mapObjectAsync", async () => {
      const source = {
        rocket: "falcon",
        payload: "satellite",
      };

      const structure: AsyncStructure = [
        {
          source: "rocket",
          target: "vehicleName",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 20));
            return data.toUpperCase();
          },
        },
        {
          source: "payload",
          target: "cargo",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 20));
            return data.toUpperCase();
          },
        },
      ];

      const result = await mapObjectAsync(structure, source, undefined, {
        parallelRun: true,
      });

      assert.deepEqual(result, {
        vehicleName: "FALCON",
        cargo: "SATELLITE",
      });
    });
  });

  describe("Error Handling in Parallel", () => {
    it("should handle errors in parallel transform functions", async () => {
      const source = { name: "comet", size: "large" };
      const structure: AsyncStructure = [
        {
          source: "name",
          target: "objectName",
          transform: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            throw new Error("Transform error in parallel");
          },
        },
        {
          source: "size",
          target: "objectSize",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 20));
            return data.toUpperCase();
          },
        },
      ];

      const mapper = new AsyncMapper(structure, { parallelRun: true });

      await assert.rejects(
        async () => await mapper.map(source),
        /Transform error in parallel/,
      );
    });

    it("should handle errors in parallel filter functions", async () => {
      const source = { name: "nebula" };
      const structure: AsyncStructure = [
        {
          source: "name",
          target: "cosmicObject",
          filter: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            throw new Error("Filter error in parallel");
          },
        },
      ];

      const mapper = new AsyncMapper(structure, { parallelRun: true });

      await assert.rejects(
        async () => await mapper.map(source),
        /Filter error in parallel/,
      );
    });
  });

  describe("Parallel Jobs Limit", () => {
    it("should behave like unlimited when parallelJobsLimit is 0", async () => {
      const source = {
        mission1: "apollo",
        mission2: "gemini",
        mission3: "mercury",
      };

      let startTimes: number[] = [];

      const structure: AsyncStructure = [
        {
          source: "mission1",
          target: "result1",
          transform: async (data: string) => {
            startTimes.push(Date.now());
            await new Promise((resolve) => setTimeout(resolve, 30));
            return data.toUpperCase();
          },
        },
        {
          source: "mission2",
          target: "result2",
          transform: async (data: string) => {
            startTimes.push(Date.now());
            await new Promise((resolve) => setTimeout(resolve, 30));
            return data.toUpperCase();
          },
        },
        {
          source: "mission3",
          target: "result3",
          transform: async (data: string) => {
            startTimes.push(Date.now());
            await new Promise((resolve) => setTimeout(resolve, 30));
            return data.toUpperCase();
          },
        },
      ];

      const mapper = new AsyncMapper(structure, {
        parallelRun: true,
        parallelJobsLimit: 0, // unlimited
      });

      const result = await mapper.map(source);

      assert.deepEqual(result, {
        result1: "APOLLO",
        result2: "GEMINI",
        result3: "MERCURY",
      });

      // All should start almost simultaneously with unlimited concurrency
      const maxStartTimeDiff =
        Math.max(...startTimes) - Math.min(...startTimes);
      assert(
        maxStartTimeDiff < 20,
        "All tasks should start almost simultaneously with unlimited concurrency",
      );
    });

    it("should run sequentially when parallelJobsLimit is 1", async () => {
      const source = {
        planet1: "mars",
        planet2: "venus",
        planet3: "jupiter",
      };

      let completionOrder: string[] = [];

      const structure: AsyncStructure = [
        {
          source: "planet1",
          target: "exploration1",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 40));
            completionOrder.push("first");
            return `Exploring ${data.toUpperCase()}`;
          },
        },
        {
          source: "planet2",
          target: "exploration2",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 20));
            completionOrder.push("second");
            return `Exploring ${data.toUpperCase()}`;
          },
        },
        {
          source: "planet3",
          target: "exploration3",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            completionOrder.push("third");
            return `Exploring ${data.toUpperCase()}`;
          },
        },
      ];

      const mapper = new AsyncMapper(structure, {
        parallelRun: true,
        parallelJobsLimit: 1, // sequential execution
      });

      const result = await mapper.map(source);

      assert.deepEqual(result, {
        exploration1: "Exploring MARS",
        exploration2: "Exploring VENUS",
        exploration3: "Exploring JUPITER",
      });

      // With limit 1, they should run sequentially in order
      assert.deepEqual(completionOrder, ["first", "second", "third"]);
    });

    it("should respect parallelJobsLimit of 2", async () => {
      const source = {
        star1: "sirius",
        star2: "vega",
        star3: "arcturus",
        star4: "canopus",
        star5: "rigel",
      };

      let activeJobs = 0;
      let maxConcurrentJobs = 0;
      let jobStarts: string[] = [];

      const structure: AsyncStructure = [
        {
          source: "star1",
          target: "constellation1",
          transform: async (data: string) => {
            activeJobs++;
            maxConcurrentJobs = Math.max(maxConcurrentJobs, activeJobs);
            jobStarts.push("star1");
            await new Promise((resolve) => setTimeout(resolve, 50));
            activeJobs--;
            return data.toUpperCase();
          },
        },
        {
          source: "star2",
          target: "constellation2",
          transform: async (data: string) => {
            activeJobs++;
            maxConcurrentJobs = Math.max(maxConcurrentJobs, activeJobs);
            jobStarts.push("star2");
            await new Promise((resolve) => setTimeout(resolve, 30));
            activeJobs--;
            return data.toUpperCase();
          },
        },
        {
          source: "star3",
          target: "constellation3",
          transform: async (data: string) => {
            activeJobs++;
            maxConcurrentJobs = Math.max(maxConcurrentJobs, activeJobs);
            jobStarts.push("star3");
            await new Promise((resolve) => setTimeout(resolve, 40));
            activeJobs--;
            return data.toUpperCase();
          },
        },
        {
          source: "star4",
          target: "constellation4",
          transform: async (data: string) => {
            activeJobs++;
            maxConcurrentJobs = Math.max(maxConcurrentJobs, activeJobs);
            jobStarts.push("star4");
            await new Promise((resolve) => setTimeout(resolve, 20));
            activeJobs--;
            return data.toUpperCase();
          },
        },
        {
          source: "star5",
          target: "constellation5",
          transform: async (data: string) => {
            activeJobs++;
            maxConcurrentJobs = Math.max(maxConcurrentJobs, activeJobs);
            jobStarts.push("star5");
            await new Promise((resolve) => setTimeout(resolve, 35));
            activeJobs--;
            return data.toUpperCase();
          },
        },
      ];

      const mapper = new AsyncMapper(structure, {
        parallelRun: true,
        parallelJobsLimit: 2,
      });

      const result = await mapper.map(source);

      assert.deepEqual(result, {
        constellation1: "SIRIUS",
        constellation2: "VEGA",
        constellation3: "ARCTURUS",
        constellation4: "CANOPUS",
        constellation5: "RIGEL",
      });

      // Should never exceed the limit of 2 concurrent jobs
      assert(
        maxConcurrentJobs <= 2,
        `Max concurrent jobs (${maxConcurrentJobs}) should not exceed limit (2)`,
      );

      // First two jobs should start almost immediately
      assert.equal(jobStarts[0], "star1");
      assert.equal(jobStarts[1], "star2");
    });

    it("should work with parallelJobsLimit and async filters", async () => {
      const source = {
        commanders: [
          { name: "luna command", experience: 5 },
          { name: "solar leader", experience: 2 },
          { name: "cosmic chief", experience: 8 },
          { name: "stellar boss", experience: 3 },
        ],
      };

      let concurrentFilters = 0;
      let maxConcurrentFilters = 0;

      const structure: AsyncStructure = [
        {
          source: "commanders[0].name",
          target: "qualified1",
          filter: async (data, source) => {
            concurrentFilters++;
            maxConcurrentFilters = Math.max(
              maxConcurrentFilters,
              concurrentFilters,
            );
            await new Promise((resolve) => setTimeout(resolve, 30));
            concurrentFilters--;
            return source.commanders[0].experience >= 3;
          },
        },
        {
          source: "commanders[1].name",
          target: "qualified2",
          filter: async (data, source) => {
            concurrentFilters++;
            maxConcurrentFilters = Math.max(
              maxConcurrentFilters,
              concurrentFilters,
            );
            await new Promise((resolve) => setTimeout(resolve, 25));
            concurrentFilters--;
            return source.commanders[1].experience >= 3;
          },
        },
        {
          source: "commanders[2].name",
          target: "qualified3",
          filter: async (data, source) => {
            concurrentFilters++;
            maxConcurrentFilters = Math.max(
              maxConcurrentFilters,
              concurrentFilters,
            );
            await new Promise((resolve) => setTimeout(resolve, 20));
            concurrentFilters--;
            return source.commanders[2].experience >= 3;
          },
        },
        {
          source: "commanders[3].name",
          target: "qualified4",
          filter: async (data, source) => {
            concurrentFilters++;
            maxConcurrentFilters = Math.max(
              maxConcurrentFilters,
              concurrentFilters,
            );
            await new Promise((resolve) => setTimeout(resolve, 35));
            concurrentFilters--;
            return source.commanders[3].experience >= 3;
          },
        },
      ];

      const mapper = new AsyncMapper(structure, {
        parallelRun: true,
        parallelJobsLimit: 2,
      });

      const result = await mapper.map(source);

      // Only commanders with experience >= 3 should be mapped
      assert.deepEqual(result, {
        qualified1: "luna command", // experience 5 >= 3
        qualified3: "cosmic chief", // experience 8 >= 3
        qualified4: "stellar boss", // experience 3 >= 3
        // qualified2 should not exist because experience 2 < 3
      });

      assert(
        maxConcurrentFilters <= 2,
        `Max concurrent filters (${maxConcurrentFilters}) should not exceed limit (2)`,
      );
    });

    it("should handle errors correctly with parallelJobsLimit", async () => {
      const source = {
        mission1: "success",
        mission2: "failure",
        mission3: "success",
      };

      let activeTransforms = 0;

      const structure: AsyncStructure = [
        {
          source: "mission1",
          target: "result1",
          transform: async (data: string) => {
            activeTransforms++;
            await new Promise((resolve) => setTimeout(resolve, 20));
            activeTransforms--;
            return data.toUpperCase();
          },
        },
        {
          source: "mission2",
          target: "result2",
          transform: async (data: string) => {
            activeTransforms++;
            await new Promise((resolve) => setTimeout(resolve, 10));
            activeTransforms--;
            throw new Error("Mission failed during transform");
          },
        },
        {
          source: "mission3",
          target: "result3",
          transform: async (data: string) => {
            activeTransforms++;
            await new Promise((resolve) => setTimeout(resolve, 30));
            activeTransforms--;
            return data.toUpperCase();
          },
        },
      ];

      const mapper = new AsyncMapper(structure, {
        parallelRun: true,
        parallelJobsLimit: 2,
      });

      await assert.rejects(
        async () => await mapper.map(source),
        /Mission failed during transform/,
      );
    });

    it("should work with parallelJobsLimit and mapObjectAsync", async () => {
      const source = {
        galaxy1: "milky way",
        galaxy2: "andromeda",
        galaxy3: "whirlpool",
      };

      let activeTasks = 0;
      let maxActiveTasks = 0;

      const structure: AsyncStructure = [
        {
          source: "galaxy1",
          target: "explored1",
          transform: async (data: string) => {
            activeTasks++;
            maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
            await new Promise((resolve) => setTimeout(resolve, 25));
            activeTasks--;
            return `Exploring ${data.toUpperCase()}`;
          },
        },
        {
          source: "galaxy2",
          target: "explored2",
          transform: async (data: string) => {
            activeTasks++;
            maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
            await new Promise((resolve) => setTimeout(resolve, 30));
            activeTasks--;
            return `Exploring ${data.toUpperCase()}`;
          },
        },
        {
          source: "galaxy3",
          target: "explored3",
          transform: async (data: string) => {
            activeTasks++;
            maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
            await new Promise((resolve) => setTimeout(resolve, 20));
            activeTasks--;
            return `Exploring ${data.toUpperCase()}`;
          },
        },
      ];

      const result = await mapObjectAsync(structure, source, undefined, {
        parallelRun: true,
        parallelJobsLimit: 2,
      });

      assert.deepEqual(result, {
        explored1: "Exploring MILKY WAY",
        explored2: "Exploring ANDROMEDA",
        explored3: "Exploring WHIRLPOOL",
      });

      assert(
        maxActiveTasks <= 2,
        `Max active tasks (${maxActiveTasks}) should not exceed limit (2)`,
      );
    });

    it("should respect limit with mixed async operations", async () => {
      const source = {
        spacecraft: "voyager",
        fuel: 85,
        crew: 6,
        mission: "exploration",
      };

      let activeTasks = 0;
      let maxActiveTasks = 0;

      const structure: AsyncStructure = [
        {
          source: "spacecraft",
          target: "vehicle",
          filter: async (data: string) => {
            activeTasks++;
            maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
            await new Promise((resolve) => setTimeout(resolve, 15));
            activeTasks--;
            return data.length > 5;
          },
          transform: async (data: string) => {
            activeTasks++;
            maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
            await new Promise((resolve) => setTimeout(resolve, 20));
            activeTasks--;
            return data.toUpperCase();
          },
        },
        {
          source: "fuel",
          target: "fuelStatus",
          failOn: async (data: number) => {
            activeTasks++;
            maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
            await new Promise((resolve) => setTimeout(resolve, 10));
            activeTasks--;
            return data < 80;
          },
        },
        {
          constant: "ACTIVE_MISSION",
          target: "status",
          filter: async (data, source) => {
            activeTasks++;
            maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
            await new Promise((resolve) => setTimeout(resolve, 25));
            activeTasks--;
            return source.mission === "exploration";
          },
        },
      ];

      const mapper = new AsyncMapper(structure, {
        parallelRun: true,
        parallelJobsLimit: 2,
      });

      const result = await mapper.map(source);

      assert.deepEqual(result, {
        vehicle: "VOYAGER",
        fuelStatus: 85,
        status: "ACTIVE_MISSION",
      });

      assert(
        maxActiveTasks <= 2,
        `Max active tasks (${maxActiveTasks}) should not exceed limit (2)`,
      );
    });
  });

  describe("Regression Tests", () => {
    it("should maintain backward compatibility when parallelRun is undefined", async () => {
      const source = { star: "proxima centauri" };
      const structure: AsyncStructure = [
        {
          source: "star",
          target: "starName",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return data.toUpperCase();
          },
        },
      ];

      // Default should be sequential (parallelRun: false)
      const mapper = new AsyncMapper(structure); // No options provided
      const result = await mapper.map(source);

      assert.deepEqual(result, {
        starName: "PROXIMA CENTAURI",
      });
    });

    it("should work correctly with automap in parallel mode", async () => {
      const source = {
        name: "interstellar probe",
        status: "active",
        mission: "explore",
      };

      const target = {
        name: "",
        status: "",
        objective: "",
      };

      const structure: AsyncStructure = [
        {
          source: "mission",
          target: "objective",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 15));
            return data.toUpperCase();
          },
        },
      ];

      const mapper = new AsyncMapper(structure, {
        parallelRun: true,
        automap: true,
      });

      const result = await mapper.map(source, target);

      // Should include both automapped fields and transformed field
      assert.equal(result.objective, "EXPLORE");
      assert.equal(result.name, "interstellar probe");
      assert.equal(result.status, "active");
    });

    it("should maintain backward compatibility with parallelJobsLimit default", async () => {
      const source = { nebula: "orion" };
      const structure: AsyncStructure = [
        {
          source: "nebula",
          target: "cosmicObject",
          transform: async (data: string) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return data.toUpperCase();
          },
        },
      ];

      // parallelJobsLimit should default to 0 (unlimited)
      const mapper = new AsyncMapper(structure, { parallelRun: true });
      const options = mapper.getOptions();

      assert.equal(options.parallelJobsLimit, 0);

      const result = await mapper.map(source);
      assert.deepEqual(result, {
        cosmicObject: "ORION",
      });
    });
  });
});
