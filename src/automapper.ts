import type { AutomapperConfiguration } from "./types/automapper.js";
import type { UnknownSource, UnknownTarget } from "./types/generic.js";

export class Automapper<TSource = UnknownSource, TTarget = UnknownTarget> {
  private configuration: AutomapperConfiguration;

  constructor(configuration: Partial<AutomapperConfiguration> = {}) {
    this.configuration = {
      checkType: true,
      ...configuration,
    };
  }

  map(source: TSource, target?: TTarget): TTarget {
    if (!source || typeof source !== "object") {
      throw new Error("Source must be an object");
    }

    if (Array.isArray(source)) {
      return source.slice(0) as unknown as TTarget;
    }

    if (!target) {
      return {} as TTarget;
    }

    const result = target;
    const sourceKeys = Object.keys(source);
    const targetKeys = Object.keys(target);

    for (const key of sourceKeys) {
      if (targetKeys.includes(key)) {
        const sourceValue = (source as UnknownSource)[key];

        if (this.shouldMapProperty(key, sourceValue, target)) {
          const targetValue = (target as UnknownTarget)[key];

          // If both source and target values are objects (but not arrays), merge them recursively
          if (
            sourceValue &&
            targetValue &&
            typeof sourceValue === "object" &&
            typeof targetValue === "object" &&
            !Array.isArray(sourceValue) &&
            !Array.isArray(targetValue)
          ) {
            // For nested objects, merge all properties from both source and target
            (result as UnknownTarget)[key] = { ...targetValue, ...sourceValue };
          } else {
            (result as UnknownTarget)[key] = sourceValue;
          }
        }
      }
    }

    return result;
  }

  private shouldMapProperty(
    key: string,
    sourceValue: UnknownSource,
    target: UnknownTarget,
  ): boolean {
    if (sourceValue === undefined) {
      return false;
    }

    if (!this.configuration.checkType) {
      return true;
    }

    if (target && key in target) {
      const targetValue = (target as UnknownTarget)[key];
      if (
        sourceValue !== null &&
        targetValue !== null &&
        targetValue !== undefined &&
        typeof sourceValue !== typeof targetValue
      ) {
        return false;
      }
    }

    return true;
  }

  getConfiguration(): AutomapperConfiguration {
    return { ...this.configuration };
  }

  setConfiguration(configuration: Partial<AutomapperConfiguration>): void {
    this.configuration = {
      ...this.configuration,
      ...configuration,
    };
  }
}
