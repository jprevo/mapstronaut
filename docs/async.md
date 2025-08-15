# Async Mapping

Mapstronaut provides powerful asynchronous mapping capabilities through the `AsyncMapper` class and `mapObjectAsync` function. This enables you to handle complex mapping scenarios involving asynchronous operations like API calls, database queries, or file operations.

## AsyncMapper Class

The `AsyncMapper` extends the base mapping functionality to support async/await operations in filters, transforms, and failOn functions.

### Basic Usage

```typescript
import { AsyncMapper } from 'mapstronaut';

const source = {
  spacecraft: 'apollo',
  crew: ['neil', 'buzz', 'michael'],
  launchDate: '1969-07-16'
};

const structure = [
  {
    source: 'spacecraft',
    target: 'missionName',
    transform: async (data: string) => {
      // Simulate API call to get mission details
      await new Promise(resolve => setTimeout(resolve, 100));
      return `Mission ${data.toUpperCase()}`;
    }
  },
  {
    source: 'crew.length',
    target: 'crewSize',
    filter: async (data: number) => {
      // Async validation
      await validateCrewSize(data);
      return data > 0;
    }
  }
];

const mapper = new AsyncMapper(structure);
const result = await mapper.map(source);
// { missionName: 'Mission APOLLO', crewSize: 3 }
```

## Parallel Execution

By default, async mapping operations run sequentially. You can enable parallel execution for better performance when operations are independent.

### Enabling Parallel Mode

```typescript
const mapper = new AsyncMapper(structure, { 
  parallelRun: true 
});

const result = await mapper.map(source);
```

### Performance Example

```typescript
const source = {
  planet1: 'mars',
  planet2: 'venus',
  planet3: 'jupiter'
};

const structure = [
  {
    source: 'planet1',
    target: 'exploration1',
    transform: async (data: string) => {
      // Simulate expensive operation (50ms)
      await new Promise(resolve => setTimeout(resolve, 50));
      return `Exploring ${data.toUpperCase()}`;
    }
  },
  {
    source: 'planet2', 
    target: 'exploration2',
    transform: async (data: string) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return `Exploring ${data.toUpperCase()}`;
    }
  },
  {
    source: 'planet3',
    target: 'exploration3', 
    transform: async (data: string) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return `Exploring ${data.toUpperCase()}`;
    }
  }
];

// Sequential: ~150ms (3 × 50ms)
const sequentialMapper = new AsyncMapper(structure, { parallelRun: false });
const sequentialResult = await sequentialMapper.map(source);

// Parallel: ~50ms (all run simultaneously)
const parallelMapper = new AsyncMapper(structure, { parallelRun: true });
const parallelResult = await parallelMapper.map(source);
```

## Jobs Limit (Concurrency Control)

Control the number of parallel operations to prevent overwhelming your system or external services.

### Setting Jobs Limit

```typescript
const mapper = new AsyncMapper(structure, {
  parallelRun: true,
  parallelJobsLimit: 3  // Max 3 concurrent operations
});
```

### Limit Values

- `0` (default): Unlimited concurrency - all operations run in parallel
- `1`: Sequential execution (same as `parallelRun: false`)
- `> 1`: Limited parallel execution with specified max concurrent jobs

### Example with Rate Limiting

```typescript
const source = {
  galaxies: ['milky-way', 'andromeda', 'whirlpool', 'pinwheel', 'sombrero']
};

const structure = source.galaxies.map((galaxy, index) => ({
  source: `galaxies[${index}]`,
  target: `galaxy${index + 1}Info`,
  transform: async (data: string) => {
    // Simulate API call with rate limit
    const response = await fetch(`/api/galaxy/${data}`);
    return await response.json();
  }
}));

// Respect API rate limits with max 2 concurrent requests
const mapper = new AsyncMapper(structure, {
  parallelRun: true,
  parallelJobsLimit: 2
});

const result = await mapper.map(source);
```

## Async Filters

Use async filters for complex validation logic that requires external calls.

```typescript
const source = {
  astronauts: [
    { name: 'Luna Nova', experience: 5 },
    { name: 'Solar Wind', experience: 2 },
    { name: 'Cosmic Ray', experience: 8 }
  ]
};

const structure = [
  {
    source: 'astronauts[0]',
    target: 'qualifiedAstronaut1',
    filter: async (astronaut, source) => {
      // Check qualification from external service
      const isQualified = await checkAstronautQualification(astronaut.name);
      return isQualified && astronaut.experience >= 3;
    },
    transform: async (astronaut) => {
      const profile = await getAstronautProfile(astronaut.name);
      return profile;
    }
  }
];
```

## Async FailOn

Use async failOn for validation that might fail the entire mapping process.

```typescript
const source = {
  mission: 'mars-landing',
  fuelLevel: 85,
  systemStatus: 'operational'
};

const structure = [
  {
    source: 'fuelLevel',
    target: 'fuel',
    failOn: async (level: number) => {
      // Check minimum fuel requirements from database
      const minRequired = await getMinimumFuelRequirement();
      return level < minRequired;
    }
  },
  {
    source: 'systemStatus',
    target: 'systems',
    failOn: async (status: string, source) => {
      // Comprehensive system check
      const systemCheck = await performSystemDiagnostics(source.mission);
      return !systemCheck.allSystemsGo;
    }
  }
];

try {
  const result = await mapper.map(source);
} catch (error) {
  console.error('Mission aborted:', error.message);
}
```

## mapObjectAsync Function

For quick async mappings without creating a mapper instance:

```typescript
import { mapObjectAsync } from 'mapstronaut';

const result = await mapObjectAsync(
  structure,
  source,
  target,  // optional
  { parallelRun: true, parallelJobsLimit: 5 }
);
```

## Error Handling in Parallel Mode

When using parallel execution, errors in any operation will cause the entire mapping to fail:

```typescript
const structure = [
  {
    source: 'validData',
    target: 'result1',
    transform: async (data) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return data.toUpperCase();
    }
  },
  {
    source: 'invalidData', 
    target: 'result2',
    transform: async (data) => {
      await new Promise(resolve => setTimeout(resolve, 20));
      throw new Error('Processing failed');
    }
  }
];

const mapper = new AsyncMapper(structure, { parallelRun: true });

try {
  const result = await mapper.map(source);
} catch (error) {
  // The entire mapping fails even though result1 would succeed
  console.error('Mapping failed:', error.message);
}
```

## Best Practices

### 1. Use Parallel Execution for Independent Operations

```typescript
// Good: Independent API calls
const structure = [
  { source: 'weatherStationId', target: 'weather', transform: getWeatherData },
  { source: 'trafficSensorId', target: 'traffic', transform: getTrafficData },
  { source: 'airQualityId', target: 'airQuality', transform: getAirQualityData }
];
```

### 2. Set Appropriate Job Limits

```typescript
// Good: Respect API rate limits
const mapper = new AsyncMapper(structure, {
  parallelRun: true,
  parallelJobsLimit: 3  // Match your API's rate limit
});
```

### 3. Handle Errors Gracefully

```typescript
// Good: Provide fallback values instead of failing
const structure = [
  {
    source: 'externalDataId',
    target: 'externalData',
    transform: async (id) => {
      try {
        return await fetchExternalData(id);
      } catch (error) {
        return null; // Fallback instead of throwing
      }
    }
  }
];
```

### 4. Use Filters to Skip Expensive Operations

```typescript
// Good: Filter before expensive transforms
const structure = [
  {
    source: 'imageUrl',
    target: 'processedImage',
    filter: async (url) => {
      // Quick check before expensive image processing
      return await isValidImageUrl(url);
    },
    transform: async (url) => {
      // Expensive image processing only for valid URLs
      return await processImage(url);
    }
  }
];
```

## Real-World Example

```typescript
// Space mission data processing with external APIs
const source = {
  missionId: 'artemis-3',
  crewIds: ['ast001', 'ast002', 'ast003'],
  launchWindow: '2026-09-01',
  destination: 'lunar-south-pole'
};

const structure = [
  {
    source: 'missionId',
    target: 'mission.details',
    transform: async (id) => {
      const response = await fetch(`/api/missions/${id}`);
      return await response.json();
    }
  },
  {
    source: 'crewIds',
    target: 'mission.crew',
    transform: async (ids) => {
      // Process crew data in parallel with limited concurrency
      const crewPromises = ids.map(id => 
        fetch(`/api/astronauts/${id}`).then(r => r.json())
      );
      return await Promise.all(crewPromises);
    }
  },
  {
    source: 'destination',
    target: 'mission.trajectory',
    filter: async (dest) => {
      const isReachable = await checkDestinationReachability(dest);
      return isReachable;
    },
    transform: async (dest) => {
      return await calculateTrajectory(dest);
    }
  }
];

const mapper = new AsyncMapper(structure, {
  parallelRun: true,
  parallelJobsLimit: 5  // Respect API rate limits
});

const result = await mapper.map(source);
```