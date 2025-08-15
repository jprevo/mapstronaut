import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { Mapper } from "../src/mapper.js";
import type { Structure } from "../src/types/mapper.js";

describe("Mapper - Class Mapping", () => {
  // Source classes for testing
  class SpaceStation {
    constructor(
      public name: string,
      public crew: number,
      public coordinates: { x: number; y: number; z: number },
      public operational: boolean = true,
    ) {}

    getCrewCount(): number {
      return this.crew;
    }
  }

  class Astronaut {
    constructor(
      public name: string,
      public age: number,
      public mission?: string,
      public experience: number = 0,
    ) {}

    introduce(): string {
      return `${this.name}, age ${this.age}`;
    }
  }

  // Target classes for testing
  class StationInfo {
    constructor(
      public stationName: string = "",
      public crewSize: number = 0,
      public location: string = "",
      public status: string = "unknown",
    ) {}
  }

  class CrewMember {
    constructor(
      public fullName: string = "",
      public yearsOld: number = 0,
      public currentMission: string = "",
      public skillLevel: number = 0,
    ) {}
  }

  describe("mapping from class to plain object", () => {
    it("should map class instance properties to plain object", () => {
      const structure: Structure = [
        ["name", "stationName"],
        ["crew", "crewSize"],
        ["operational", "status"],
      ];
      const mapper = new Mapper<SpaceStation, any>(structure);

      const source = new SpaceStation("ISS", 7, { x: 0, y: 0, z: 408 });
      const result = mapper.map(source);

      assert.deepEqual(result, {
        stationName: "ISS",
        crewSize: 7,
        status: true,
      });
    });

    it("should handle nested class properties", () => {
      const structure: Structure = [
        ["name", "info.name"],
        ["coordinates.x", "position.x"],
        ["coordinates.y", "position.y"],
        ["coordinates.z", "position.z"],
      ];
      const mapper = new Mapper<SpaceStation, any>(structure);

      const source = new SpaceStation("Mir", 3, { x: 100, y: 200, z: 350 });
      const result = mapper.map(source);

      assert.deepEqual(result, {
        info: { name: "Mir" },
        position: { x: 100, y: 200, z: 350 },
      });
    });
  });

  describe("mapping from plain object to class", () => {
    it("should map plain object to class instance", () => {
      const structure: Structure = [
        ["stationName", "name"],
        ["crewSize", "crew"],
        ["isOperational", "operational"],
      ];
      const mapper = new Mapper<any, SpaceStation>(structure);

      const source = {
        stationName: "Skylab",
        crewSize: 3,
        isOperational: false,
      };
      const target = new SpaceStation("", 0, { x: 0, y: 0, z: 0 });
      const result = mapper.map(source, target);

      assert.equal(result.name, "Skylab");
      assert.equal(result.crew, 3);
      assert.equal(result.operational, false);
      assert.equal(result.coordinates.x, 0); // Original value preserved
    });

    it("should preserve class methods after mapping", () => {
      const structure: Structure = [
        ["crewCount", "crew"],
        ["stationName", "name"],
      ];
      const mapper = new Mapper<any, SpaceStation>(structure);

      const source = { crewCount: 6, stationName: "Gateway" };
      const target = new SpaceStation("", 0, { x: 0, y: 0, z: 0 });
      const result = mapper.map(source, target);

      assert.equal(result.name, "Gateway");
      assert.equal(result.crew, 6);
      assert.equal(typeof result.getCrewCount, "function");
      assert.equal(result.getCrewCount(), 6);
    });
  });

  describe("mapping from class to class", () => {
    it("should map between different class instances", () => {
      const structure: Structure = [
        ["name", "stationName"],
        ["crew", "crewSize"],
      ];
      const mapper = new Mapper<SpaceStation, StationInfo>(structure);

      const source = new SpaceStation("Artemis Gateway", 4, {
        x: 0,
        y: 0,
        z: 384400,
      });
      const target = new StationInfo();
      const result = mapper.map(source, target);

      assert.equal(result.stationName, "Artemis Gateway");
      assert.equal(result.crewSize, 4);
      assert.equal(result.location, ""); // Default value preserved
      assert.equal(result.status, "unknown"); // Default value preserved
    });

    it("should handle complex class to class mapping with transforms", () => {
      const structure: Structure = [
        ["name", "fullName"],
        ["age", "yearsOld"],
        {
          source: "mission",
          target: "currentMission",
          defaultValue: "No mission assigned",
        },
        {
          source: "experience",
          target: "skillLevel",
          transform: (exp: number) => Math.min(exp / 10, 10), // Scale to 0-10
        },
      ];
      const mapper = new Mapper<Astronaut, CrewMember>(structure);

      const source = new Astronaut("Neil Armstrong", 38, "Apollo 11", 150);
      const target = new CrewMember();
      const result = mapper.map(source, target);

      assert.equal(result.fullName, "Neil Armstrong");
      assert.equal(result.yearsOld, 38);
      assert.equal(result.currentMission, "Apollo 11");
      assert.equal(result.skillLevel, 10); // 150/10 capped at 10
    });

    it("should handle missing optional properties with defaults", () => {
      const structure: Structure = [
        ["name", "fullName"],
        ["age", "yearsOld"],
        {
          source: "mission",
          target: "currentMission",
          defaultValue: "Training",
        },
      ];
      const mapper = new Mapper<Astronaut, CrewMember>(structure);

      const source = new Astronaut("Yuri Gagarin", 27); // No mission specified
      const target = new CrewMember();
      const result = mapper.map(source, target);

      assert.equal(result.fullName, "Yuri Gagarin");
      assert.equal(result.yearsOld, 27);
      assert.equal(result.currentMission, "Training"); // Default value used
    });
  });

  describe("class with inheritance", () => {
    class Vehicle {
      constructor(
        public type: string,
        public manufacturer: string,
      ) {}
    }

    class Spacecraft extends Vehicle {
      constructor(
        type: string,
        manufacturer: string,
        public missions: string[],
        public maxCrew: number,
      ) {
        super(type, manufacturer);
      }
    }

    class SpacecraftInfo {
      constructor(
        public vehicleType: string = "",
        public builder: string = "",
        public missionList: string[] = [],
        public capacity: number = 0,
      ) {}
    }

    it("should map inherited class properties", () => {
      const structure: Structure = [
        ["type", "vehicleType"],
        ["manufacturer", "builder"],
        ["missions", "missionList"],
        ["maxCrew", "capacity"],
      ];
      const mapper = new Mapper<Spacecraft, SpacecraftInfo>(structure);

      const source = new Spacecraft(
        "Orbital Vehicle",
        "SpaceX",
        ["Dragon Demo-1", "Dragon Demo-2", "Crew-1"],
        7,
      );
      const target = new SpacecraftInfo();
      const result = mapper.map(source, target);

      assert.equal(result.vehicleType, "Orbital Vehicle");
      assert.equal(result.builder, "SpaceX");
      assert.deepEqual(result.missionList, [
        "Dragon Demo-1",
        "Dragon Demo-2",
        "Crew-1",
      ]);
      assert.equal(result.capacity, 7);
    });
  });

  describe("class with private/protected properties", () => {
    class SecureSpaceStation {
      private secretCode: string;
      protected internalId: number;

      constructor(
        public name: string,
        public crew: number,
        secretCode: string,
        internalId: number,
      ) {
        this.secretCode = secretCode;
        this.internalId = internalId;
      }

      getSecretCode(): string {
        return this.secretCode;
      }

      getInternalId(): number {
        return this.internalId;
      }
    }

    it("should only map public properties from class", () => {
      const structure: Structure = [
        ["name", "stationName"],
        ["crew", "crewCount"],
      ];
      const mapper = new Mapper<SecureSpaceStation, any>(structure);

      const source = new SecureSpaceStation(
        "Classified Station",
        5,
        "TOP_SECRET",
        12345,
      );
      const result = mapper.map(source);

      assert.deepEqual(result, {
        stationName: "Classified Station",
        crewCount: 5,
      });
      // Private and protected properties should not be accessible
    });
  });

  describe("error handling with classes", () => {
    it("should handle failOn condition with class instances", () => {
      const structure: Structure = [
        {
          source: "crew",
          target: "crewSize",
          failOn: (crew: number) => crew > 10,
        },
      ];
      const mapper = new Mapper<SpaceStation, any>(structure);

      const source = new SpaceStation("Overcrowded Station", 15, {
        x: 0,
        y: 0,
        z: 0,
      });

      assert.throws(
        () => mapper.map(source),
        /Mapping failed: condition failed for rule with target 'crewSize'/,
      );
    });

    it("should handle filter condition with class instances", () => {
      const structure: Structure = [
        ["name", "stationName"],
        {
          source: "crew",
          target: "crewSize",
          filter: (crew: number) => crew <= 8, // Only map if crew is reasonable
        },
      ];
      const mapper = new Mapper<SpaceStation, any>(structure);

      const validSource = new SpaceStation("ISS", 7, { x: 0, y: 0, z: 0 });
      const invalidSource = new SpaceStation("Huge Station", 20, {
        x: 0,
        y: 0,
        z: 0,
      });

      const validResult = mapper.map(validSource);
      const invalidResult = mapper.map(invalidSource);

      assert.deepEqual(validResult, { stationName: "ISS", crewSize: 7 });
      assert.deepEqual(invalidResult, { stationName: "Huge Station" }); // crew filtered out
    });
  });

  describe("automap with classes", () => {
    it("should automap matching properties between classes", () => {
      const structure: Structure = [];
      const mapper = new Mapper<Astronaut, CrewMember>(structure, {
        automap: true,
      });

      const source = new Astronaut("Buzz Aldrin", 39, "Apollo 11", 100);
      const target = new CrewMember("", 0, "", 0);
      const result = mapper.map(source, target);

      // No properties match exactly between Astronaut and CrewMember
      // So target should remain unchanged except what automap can match
      assert.equal(result.fullName, "");
      assert.equal(result.yearsOld, 0);
      assert.equal(result.currentMission, "");
      assert.equal(result.skillLevel, 0);
    });

    it("should combine automap with explicit rules for classes", () => {
      const structure: Structure = [
        ["name", "fullName"],
        ["age", "yearsOld"],
      ];
      const mapper = new Mapper<Astronaut, CrewMember>(structure, {
        automap: true,
      });

      // Create target with some matching property names
      const source = new Astronaut("Sally Ride", 32, "STS-7", 50);
      const target = new CrewMember("", 0, "", 0);
      const result = mapper.map(source, target);

      assert.equal(result.fullName, "Sally Ride");
      assert.equal(result.yearsOld, 32);
      assert.equal(result.currentMission, "");
      assert.equal(result.skillLevel, 0);
    });
  });

  describe("complex nested class structures", () => {
    class Mission {
      constructor(
        public name: string,
        public duration: number,
        public objectives: string[],
      ) {}
    }

    class ComplexSpaceStation {
      constructor(
        public name: string,
        public currentMission: Mission,
        public crew: Astronaut[],
      ) {}
    }

    it("should handle nested class instances in mapping", () => {
      const structure: Structure = [
        ["name", "stationName"],
        ["currentMission.name", "missionName"],
        ["currentMission.duration", "missionDuration"],
        ["crew.length", "crewCount"],
      ];
      const mapper = new Mapper<ComplexSpaceStation, any>(structure);

      const mission = new Mission("Artemis Research", 180, [
        "Moon Base Setup",
        "Resource Collection",
      ]);
      const crew = [
        new Astronaut("Commander Smith", 45, "Artemis Research"),
        new Astronaut("Dr. Johnson", 38, "Artemis Research"),
      ];
      const source = new ComplexSpaceStation("Lunar Gateway", mission, crew);
      const result = mapper.map(source);

      assert.deepEqual(result, {
        stationName: "Lunar Gateway",
        missionName: "Artemis Research",
        missionDuration: 180,
        crewCount: 2,
      });
    });
  });
});
