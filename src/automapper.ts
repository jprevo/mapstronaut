import {
  AutomapArrayStrategy,
  type AutomapArrayStrategyFunction,
  type AutomapperOptions,
} from "./types/automapper.js";
import type { UnknownSource, UnknownTarget } from "./types/generic.js";

export class Automapper<TSource = UnknownSource, TTarget = UnknownTarget> {
  private configuration: AutomapperOptions;

  constructor(configuration: Partial<AutomapperOptions> = {}) {
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

          if (this.areBothObjects(sourceValue, targetValue)) {
            (result as UnknownTarget)[key] = this.deepMerge(
              targetValue,
              sourceValue,
            );
          } else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
            (result as UnknownTarget)[key] = this.applyArrayStrategy(
              key,
              this.configuration.automapArrayStrategy,
              targetValue,
              sourceValue,
            );
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

  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key) && key in result) {
        const sourceValue = source[key];
        const targetValue = result[key];

        if (!this.shouldMapProperty(key, sourceValue, result)) {
          continue;
        }

        if (this.areBothObjects(sourceValue, targetValue)) {
          result[key] = this.deepMerge(targetValue, sourceValue);
        } else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
          result[key] = this.applyArrayStrategy(
            key,
            this.configuration.automapArrayStrategy,
            targetValue,
            sourceValue,
          );
        } else {
          result[key] = sourceValue;
        }
      }
    }

    return result;
  }

  private applyArrayStrategy(
    key: string,
    strategy: AutomapArrayStrategyFunction | AutomapArrayStrategy | undefined,
    targetArray: any[],
    sourceArray: any[],
  ): any[] {
    if (typeof strategy === "function") {
      return strategy(key, sourceArray, targetArray);
    }

    switch (strategy) {
      case AutomapArrayStrategy.Concatenate:
        return [...targetArray, ...sourceArray];

      case AutomapArrayStrategy.MergeByIndex:
        const result = [...targetArray];
        for (let i = 0; i < sourceArray.length; i++) {
          if (sourceArray[i] !== undefined) {
            result[i] = sourceArray[i];
          }
        }
        return result;

      case AutomapArrayStrategy.Replace:
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

  getConfiguration(): AutomapperOptions {
    return { ...this.configuration };
  }

  setConfiguration(configuration: Partial<AutomapperOptions>): void {
    this.configuration = {
      ...this.configuration,
      ...configuration,
    };
  }
}
