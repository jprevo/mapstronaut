import {
  AutomapArrayStrategy,
  type AutomapArrayStrategyFunction,
  type AutomapperConfiguration,
  AutomapSimpleStrategy,
  type AutomapStrategyFunction,
} from "./types/automapper.js";
import type { UnknownSource, UnknownTarget } from "./types/generic.js";

export class Automapper<TSource = UnknownSource, TTarget = UnknownTarget> {
  private configuration: AutomapperConfiguration;

  constructor(configuration: Partial<AutomapperConfiguration> = {}) {
    this.configuration = {
      checkType: false,
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
          if (this.areBothObjects(sourceValue, targetValue)) {
            // Apply object strategy if configured
            if (this.configuration.automapObjectStrategy) {
              (result as UnknownTarget)[key] = this.applyStrategy(
                key,
                this.configuration.automapObjectStrategy,
                targetValue,
                sourceValue,
              );
            } else {
              // Deep merge with conflict resolution
              (result as UnknownTarget)[key] = this.deepMerge(
                targetValue,
                sourceValue,
              );
            }
          } else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
            // Handle array merging
            if (this.configuration.automapArrayStrategy) {
              (result as UnknownTarget)[key] = this.applyArrayStrategy(
                key,
                this.configuration.automapArrayStrategy,
                targetValue,
                sourceValue,
              );
            } else {
              // Default behavior for arrays: replace
              (result as UnknownTarget)[key] = [...sourceValue];
            }
          } else {
            // Default: source wins
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

  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = result[key];

        // Check if this property should be mapped based on type checking
        if (!this.shouldMapProperty(key, sourceValue, result)) {
          continue;
        }

        if (this.areBothObjects(sourceValue, targetValue)) {
          // Recursively deep merge nested objects
          result[key] = this.deepMerge(targetValue, sourceValue);
        } else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
          // Handle array merging
          if (this.configuration.automapArrayStrategy) {
            result[key] = this.applyArrayStrategy(
              key,
              this.configuration.automapArrayStrategy,
              targetValue,
              sourceValue,
            );
          } else {
            // Default behavior for arrays: replace
            result[key] = [...sourceValue];
          }
        } else if (targetValue !== undefined && sourceValue !== undefined) {
          // Handle conflict resolution for properties that exist in both
          result[key] = this.resolveConflict(key, targetValue, sourceValue);
        } else {
          // No conflict, use source value
          result[key] = sourceValue;
        }
      }
    }

    return result;
  }

  private deepMergeWithStrategy(
    target: any,
    source: any,
    strategy: AutomapSimpleStrategy | AutomapStrategyFunction,
  ): any {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = result[key];

        // Check if this property should be mapped based on type checking
        if (!this.shouldMapProperty(key, sourceValue, result)) {
          continue;
        }

        if (this.areBothObjects(sourceValue, targetValue)) {
          // Recursively deep merge nested objects with the same strategy
          result[key] = this.deepMergeWithStrategy(
            targetValue,
            sourceValue,
            strategy,
          );
        } else if (targetValue !== undefined && sourceValue !== undefined) {
          // Handle conflict based on strategy
          if (typeof strategy === "function") {
            result[key] = strategy(key, sourceValue, targetValue);
          } else {
            switch (strategy) {
              case AutomapSimpleStrategy.PreserveTarget:
                result[key] = targetValue;
                break;
              case AutomapSimpleStrategy.PreserveSource:
              default:
                result[key] = sourceValue;
                break;
            }
          }
        } else {
          // No conflict, use source value
          result[key] = sourceValue;
        }
      }
    }

    return result;
  }

  private applyStrategy(
    key: string,
    strategy: AutomapStrategyFunction | AutomapSimpleStrategy,
    targetValue: any,
    sourceValue: any,
  ): any {
    if (typeof strategy === "function") {
      return strategy(key, sourceValue, targetValue);
    }

    if (this.areBothObjects(sourceValue, targetValue)) {
      return this.deepMergeWithStrategy(targetValue, sourceValue, strategy);
    }

    return sourceValue;
  }

  private resolveConflict(
    key: string,
    targetValue: any,
    sourceValue: any,
  ): any {
    if (
      Array.isArray(sourceValue) &&
      Array.isArray(targetValue) &&
      this.configuration.automapArrayStrategy
    ) {
      return this.applyArrayStrategy(
        key,
        this.configuration.automapArrayStrategy,
        targetValue,
        sourceValue,
      );
    }

    if (this.configuration.automapObjectStrategy) {
      return this.applyStrategy(
        key,
        this.configuration.automapObjectStrategy,
        targetValue,
        sourceValue,
      );
    }

    return sourceValue;
  }

  private applyArrayStrategy(
    key: string,
    strategy: AutomapArrayStrategyFunction | AutomapArrayStrategy,
    targetArray: any[],
    sourceArray: any[],
  ): any[] {
    switch (strategy) {
      case AutomapArrayStrategy.Concatenate:
        return [...targetArray, ...sourceArray];

      case AutomapArrayStrategy.Replace:
        return [...sourceArray];

      case AutomapArrayStrategy.MergeByIndex:
        const result = [...targetArray];
        for (let i = 0; i < sourceArray.length; i++) {
          if (sourceArray[i] !== undefined) {
            result[i] = sourceArray[i];
          }
        }
        return result;

      default:
        return [...sourceArray];
    }
  }

  private areBothObjects(sourceValue: any, targetValue: any) {
    return (
      sourceValue &&
      targetValue &&
      typeof sourceValue === "object" &&
      typeof targetValue === "object" &&
      !Array.isArray(sourceValue) &&
      !Array.isArray(targetValue)
    );
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
