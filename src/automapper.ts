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
    if (!this.isValidSource(source)) {
      throw new Error("Source must be an object");
    }

    if (Array.isArray(source)) {
      return source.slice(0) as unknown as TTarget;
    }

    if (!target) {
      return {} as TTarget;
    }

    return this.mergeObjects(
      source as UnknownSource,
      target as UnknownTarget,
    ) as TTarget;
  }

  private isValidSource(source: unknown): source is object {
    return (
      source !== null && source !== undefined && typeof source === "object"
    );
  }

  private shouldMapProperty(
    key: string,
    sourceValue: unknown,
    target: UnknownTarget,
  ): boolean {
    if (sourceValue === undefined) {
      return false;
    }

    if (!this.configuration.checkType) {
      return true;
    }

    if (target && key in target) {
      const targetValue = target[key];
      return this.areTypesCompatible(sourceValue, targetValue);
    }

    return true;
  }

  private areTypesCompatible(
    sourceValue: unknown,
    targetValue: unknown,
  ): boolean {
    if (
      sourceValue === null ||
      targetValue === null ||
      targetValue === undefined
    ) {
      return true;
    }

    return typeof sourceValue === typeof targetValue;
  }

  private mergeObjects(
    source: UnknownSource,
    target: UnknownTarget,
  ): UnknownTarget {
    const sourceKeys = Object.keys(source);
    const targetKeys = Object.keys(target);

    for (const key of sourceKeys) {
      if (targetKeys.includes(key)) {
        this.mapProperty(key, source, target);
      }
    }

    return target;
  }

  private mapProperty(
    key: string,
    source: UnknownSource,
    target: UnknownTarget,
  ): void {
    const sourceValue = source[key];

    if (!this.shouldMapProperty(key, sourceValue, target)) {
      return;
    }

    const targetValue = target[key];
    target[key] = this.getMappedValue(key, sourceValue, targetValue);
  }

  private getMappedValue(
    key: string,
    sourceValue: unknown,
    targetValue: unknown,
  ): unknown {
    if (this.areBothObjects(sourceValue, targetValue)) {
      // For nested objects, we need to create a new merged object to avoid mutating the original
      const mergedTarget = { ...(targetValue as UnknownTarget) };
      return this.mergeObjects(sourceValue as UnknownSource, mergedTarget);
    }

    if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
      return this.applyArrayStrategy(
        key,
        this.configuration.automapArrayStrategy,
        targetValue,
        sourceValue,
      );
    }

    return sourceValue;
  }

  private applyArrayStrategy(
    key: string,
    strategy: AutomapArrayStrategyFunction | AutomapArrayStrategy | undefined,
    targetArray: unknown[],
    sourceArray: unknown[],
  ): unknown[] {
    if (typeof strategy === "function") {
      return strategy(key, sourceArray, targetArray);
    }

    switch (strategy) {
      case AutomapArrayStrategy.Concatenate:
        return this.concatenateArrays(targetArray, sourceArray);

      case AutomapArrayStrategy.Merge:
        return this.mergeArraysByIndex(targetArray, sourceArray);

      case AutomapArrayStrategy.Replace:
      default:
        return [...sourceArray];
    }
  }

  private concatenateArrays(
    targetArray: unknown[],
    sourceArray: unknown[],
  ): unknown[] {
    return [...targetArray, ...sourceArray];
  }

  private mergeArraysByIndex(
    targetArray: unknown[],
    sourceArray: unknown[],
  ): unknown[] {
    const result = [...targetArray];
    for (let i = 0; i < sourceArray.length; i++) {
      if (sourceArray[i] !== undefined) {
        result[i] = sourceArray[i];
      }
    }
    return result;
  }

  private areBothObjects(sourceValue: unknown, targetValue: unknown): boolean {
    return (
      sourceValue !== null &&
      targetValue !== null &&
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
