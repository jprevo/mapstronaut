import type { AutomapperConfiguration } from "./types/automapper.js";
import type { UnknownSource, UnknownTarget } from "./types/generic.js";
import type {
  Rule,
  RuleObject,
  AutomapStrategyFunction,
} from "./types/mapper.js";
import { AutomapSimpleStrategy, AutomapArrayStrategy } from "./types/mapper.js";

export class Automapper<TSource = UnknownSource, TTarget = UnknownTarget> {
  private configuration: AutomapperConfiguration;
  private structure: Rule[];

  constructor(
    configuration: Partial<AutomapperConfiguration> = {},
    structure: Rule[] = [],
  ) {
    this.configuration = {
      checkType: false,
      ...configuration,
    };
    this.structure = structure;
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

          // Check if there's a strategy for this property
          const strategy = this.findAutomapStrategy(key);

          if (strategy) {
            // Apply strategy to the entire property (object or primitive)
            const resolvedValue = this.applyStrategy(
              strategy,
              targetValue,
              sourceValue,
            );
            (result as UnknownTarget)[key] = resolvedValue;
          } else {
            // No strategy, use default behavior
            // If both source and target values are objects (but not arrays), merge them recursively
            if (this.areBothObjects(sourceValue, targetValue)) {
              // Deep merge with conflict resolution
              (result as UnknownTarget)[key] = this.deepMerge(
                targetValue,
                sourceValue,
              );
            } else if (
              Array.isArray(sourceValue) &&
              Array.isArray(targetValue)
            ) {
              // Handle array merging
              const arrayStrategy = this.findAutomapArrayStrategy(key);
              if (arrayStrategy) {
                (result as UnknownTarget)[key] = this.applyArrayStrategy(
                  arrayStrategy,
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
          const arrayStrategy = this.findAutomapArrayStrategy(key);
          if (arrayStrategy) {
            result[key] = this.applyArrayStrategy(
              arrayStrategy,
              targetValue,
              sourceValue,
            );
          } else {
            // Default behavior for arrays: replace
            result[key] = [...sourceValue];
          }
        } else if (targetValue !== undefined && sourceValue !== undefined) {
          // Handle conflict resolution for properties that exist in both
          result[key] = this.resolveConflict(targetValue, sourceValue, key);
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
            result[key] = strategy(sourceValue, targetValue);
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
    strategy: AutomapStrategyFunction | AutomapSimpleStrategy,
    targetValue: any,
    sourceValue: any,
  ): any {
    if (typeof strategy === "function") {
      return strategy(sourceValue, targetValue);
    }

    if (this.areBothObjects(sourceValue, targetValue)) {
      return this.deepMergeWithStrategy(targetValue, sourceValue, strategy);
    }

    return sourceValue;
  }

  private resolveConflict(
    targetValue: any,
    sourceValue: any,
    propertyKey: string,
  ): any {
    const strategy = this.findAutomapStrategy(propertyKey);
    const arrayStrategy = this.findAutomapArrayStrategy(propertyKey);

    if (
      Array.isArray(sourceValue) &&
      Array.isArray(targetValue) &&
      arrayStrategy
    ) {
      return this.applyArrayStrategy(arrayStrategy, targetValue, sourceValue);
    }

    if (strategy) {
      return this.applyStrategy(strategy, targetValue, sourceValue);
    }

    return sourceValue;
  }

  private findAutomapStrategy(
    propertyKey: string,
  ): AutomapStrategyFunction | AutomapSimpleStrategy | undefined {
    // Look for a rule that targets this property and has an automapStrategy
    for (const rule of this.structure) {
      const normalizedRule = this.normalizeRule(rule);

      if (
        normalizedRule.target === propertyKey &&
        normalizedRule.automapObjectStrategy
      ) {
        return normalizedRule.automapObjectStrategy;
      }
    }

    return undefined;
  }

  private findAutomapArrayStrategy(
    propertyKey: string,
  ): AutomapArrayStrategy | undefined {
    // Look for a rule that targets this property and has an automapArrayStrategy
    for (const rule of this.structure) {
      const normalizedRule = this.normalizeRule(rule);

      if (
        normalizedRule.target === propertyKey &&
        normalizedRule.automapArrayStrategy
      ) {
        return normalizedRule.automapArrayStrategy;
      }
    }

    return undefined;
  }

  private applyArrayStrategy(
    strategy: AutomapArrayStrategy,
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

  private normalizeRule(rule: Rule): RuleObject {
    if (Array.isArray(rule)) {
      const [source, target] = rule;
      return { source, target };
    }
    return rule as RuleObject;
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

  getStructure(): Rule[] {
    return [...this.structure];
  }

  setStructure(structure: Rule[]): void {
    this.structure = structure;
  }
}
