import { Bench } from "tinybench";
import { Mapper, AsyncMapper, Automapper, mapObject } from "./index.js";

// Sample data structures for benchmarking
interface SourceData {
  id: number;
  name: string;
  email: string;
  address: {
    street: string;
    city: string;
    zipCode: string;
  };
  tags: string[];
  metadata: {
    created: string;
    updated: string;
    version: number;
  };
}

interface TargetData {
  userId: number;
  fullName: string;
  contactEmail: string;
  location: {
    streetAddress: string;
    cityName: string;
    postalCode: string;
  };
  categories: string[];
  info: {
    createdAt: string;
    lastModified: string;
    versionNumber: number;
  };
}

// Generate test data
function generateSourceData(count: number): SourceData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    address: {
      street: `${i + 100} Main St`,
      city: "Test City",
      zipCode: `${10000 + i}`,
    },
    tags: [`tag${i}`, `category${i % 3}`],
    metadata: {
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      version: 1,
    },
  }));
}

// Mapping structure for complex transformation
const complexStructure = [
  { source: "id", target: "userId" },
  { source: "name", target: "fullName" },
  { source: "email", target: "contactEmail" },
  { source: "address.street", target: "location.streetAddress" },
  { source: "address.city", target: "location.cityName" },
  { source: "address.zipCode", target: "location.postalCode" },
  { source: "tags", target: "categories" },
  { source: "metadata.created", target: "info.createdAt" },
  { source: "metadata.updated", target: "info.lastModified" },
  { source: "metadata.version", target: "info.versionNumber" },
];

// Simple mapping structure
const simpleStructure = [
  { source: "id", target: "userId" },
  { source: "name", target: "fullName" },
  { source: "email", target: "contactEmail" },
];

// Structure with transforms
const transformStructure = [
  { source: "id", target: "userId" },
  {
    source: "name",
    target: "fullName",
    transform: (value: string) => value.toUpperCase(),
  },
  {
    source: "email",
    target: "contactEmail",
    transform: (value: string) => value.toLowerCase(),
  },
];

async function runBenchmarks() {
  const bench = new Bench({ time: 1000 });

  // Test data sets
  const smallDataset = generateSourceData(10);
  const mediumDataset = generateSourceData(100);
  const largeDataset = generateSourceData(1000);

  const singleItem = smallDataset[0];

  // Create mapper instances
  const simpleMapper = new Mapper<SourceData, Partial<TargetData>>(
    simpleStructure,
  );
  const complexMapper = new Mapper<SourceData, TargetData>(complexStructure);
  const transformMapper = new Mapper<SourceData, Partial<TargetData>>(
    transformStructure,
  );
  const asyncMapper = new AsyncMapper<SourceData, TargetData>(complexStructure);
  const automapper = new Automapper<SourceData, SourceData>();

  // Single item benchmarks
  bench
    .add("Simple mapping (single item)", () => {
      simpleMapper.map(singleItem!);
    })
    .add("Complex mapping (single item)", () => {
      complexMapper.map(singleItem!);
    })
    .add("Transform mapping (single item)", () => {
      transformMapper.map(singleItem!);
    })
    .add("Async mapping (single item)", async () => {
      await asyncMapper.map(singleItem!);
    })
    .add("Automapping (single item)", () => {
      automapper.map(singleItem!);
    })
    .add("mapObject helper (single item)", () => {
      mapObject(simpleStructure, singleItem);
    });

  // Small dataset benchmarks
  bench
    .add("Simple mapping (10 items)", () => {
      smallDataset.map((item) => simpleMapper.map(item));
    })
    .add("Complex mapping (10 items)", () => {
      smallDataset.map((item) => complexMapper.map(item));
    });

  // Medium dataset benchmarks
  bench
    .add("Simple mapping (100 items)", () => {
      mediumDataset.map((item) => simpleMapper.map(item));
    })
    .add("Complex mapping (100 items)", () => {
      mediumDataset.map((item) => complexMapper.map(item));
    });

  // Large dataset benchmarks
  bench
    .add("Simple mapping (1000 items)", () => {
      largeDataset.map((item) => simpleMapper.map(item));
    })
    .add("Complex mapping (1000 items)", () => {
      largeDataset.map((item) => complexMapper.map(item));
    });

  // Memory efficiency test
  bench.add("Memory test - create new mapper instances", () => {
    const mapper = new Mapper<SourceData, Partial<TargetData>>(simpleStructure);
    mapper.map(singleItem!);
  });

  // Run benchmarks
  await bench.run();

  // Display results
  console.log("\n🚀 Mapstronaut Performance Benchmarks\n");
  console.table(bench.table());

  // Display summary statistics
  const results = bench.tasks.map((task) => ({
    name: task.name,
    "avg (ms)": task.result?.mean
      ? (task.result.mean * 1000).toFixed(4)
      : "N/A",
    "ops/sec": task.result?.hz
      ? Math.round(task.result.hz).toLocaleString()
      : "N/A",
    margin: task.result?.rme ? `±${task.result.rme.toFixed(2)}%` : "N/A",
  }));

  console.log("\n📊 Detailed Results:");
  console.table(results);

  // Performance insights
  console.log("\n💡 Performance Insights:");

  const fastest = bench.tasks.reduce((prev, current) =>
    (current.result?.hz || 0) > (prev.result?.hz || 0) ? current : prev,
  );

  const slowest = bench.tasks.reduce((prev, current) =>
    (current.result?.hz || 0) < (prev.result?.hz || 0) ? current : prev,
  );

  console.log(`• Fastest operation: ${fastest.name}`);
  console.log(`• Slowest operation: ${slowest.name}`);

  if (fastest.result?.hz && slowest.result?.hz) {
    const speedDiff = fastest.result.hz / slowest.result.hz;
    console.log(`• Speed difference: ${speedDiff.toFixed(2)}x faster`);
  }
}

// Export for external usage
export { runBenchmarks };

// Run benchmarks if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBenchmarks().catch(console.error);
}
