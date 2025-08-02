import { BaseMapper } from "./base-mapper.js";
import type { UnknownSource, UnknownTarget } from "./types/generic.js";
import type {
  MapperOptions,
  AsyncStructure,
  AsyncRule,
  AsyncRuleObject,
  Rule,
} from "./types/mapper.js";

export class AsyncMapper<
  TSource = UnknownSource,
  TTarget = UnknownTarget,
> extends BaseMapper<TSource, TTarget> {
  private asyncStructure: AsyncStructure;

  constructor(structure: AsyncStructure, options?: Partial<MapperOptions>) {
    // Cast AsyncStructure to Rule[] for the base class
    super(structure as Rule[], options);
    this.asyncStructure = structure;
  }

  // Override to return AsyncStructure while maintaining compatibility
  getAsyncStructure(): AsyncStructure {
    return [...this.asyncStructure];
  }

  setAsyncStructure(structure: AsyncStructure): void {
    this.structure = structure as Rule[];
    this.asyncStructure = structure;
  }

  async map(source: TSource, target?: TTarget): Promise<TTarget> {
    let result = target ?? ({} as TTarget);
    result = this.applyAutomap(source, result);

    for (const rule of this.asyncStructure) {
      await this.processRule(rule, source, result);
    }

    return result;
  }

  private async processRule(
    rule: AsyncRule,
    source: TSource,
    target: TTarget,
  ): Promise<void> {
    const ruleObj = this.normalizeAsyncRule(rule);

    // Handle constant values
    if (ruleObj.constant !== undefined) {
      // Apply filter to constant values if present
      if (
        ruleObj.filter &&
        !(await Promise.resolve(
          ruleObj.filter(ruleObj.constant, source, target),
        ))
      ) {
        return;
      }

      let finalValue = ruleObj.constant;

      // Apply transform to constant values if present
      if (ruleObj.transform) {
        finalValue = await Promise.resolve(
          ruleObj.transform(ruleObj.constant, source, target),
        );
      }

      // Apply failOn check for constant values
      if (
        ruleObj.failOn &&
        (await Promise.resolve(ruleObj.failOn(finalValue, source, target)))
      ) {
        throw new Error(
          `Mapping failed: condition failed for rule with target '${ruleObj.target}'`,
        );
      }

      this.outpath.write(target, ruleObj.target, finalValue);
      return;
    }

    // Source is required if constant is not provided
    if (!ruleObj.source) {
      throw new Error("Rule must have either 'source' or 'constant' defined");
    }

    const jsonPath = this.normalizeJsonPath(ruleObj.source);
    const data = this.extractData(source, jsonPath);

    // Apply filter early - if filter returns false, skip this rule entirely
    if (ruleObj.filter && !(await ruleObj.filter(data, source, target))) {
      return;
    }

    // Use defaultValue if data is null or undefined
    let valueToMap = data;
    if (
      (data === null || data === undefined) &&
      ruleObj.defaultValue !== undefined
    ) {
      valueToMap = ruleObj.defaultValue;
    }

    // Apply transform function if present
    if (ruleObj.transform) {
      valueToMap = await ruleObj.transform(valueToMap, source, target);
    }

    // Apply failOn check - if it returns true, throw error and stop mapping
    if (ruleObj.failOn && (await ruleObj.failOn(valueToMap, source, target))) {
      throw new Error(
        `Mapping failed: condition failed for rule with target '${ruleObj.target}'`,
      );
    }

    // Apply skipNull and skipUndefined rules after transform processing
    if (valueToMap === null && this.options.skipNull) {
      return;
    }
    if (valueToMap === undefined && this.options.skipUndefined) {
      return;
    }

    this.outpath.write(target, ruleObj.target, valueToMap);
  }

  private normalizeAsyncRule(rule: AsyncRule): AsyncRuleObject {
    if (Array.isArray(rule)) {
      const [source, target] = rule;
      return { source, target };
    }

    return rule as AsyncRuleObject;
  }
}

export async function mapObjectAsync<
  TSource = UnknownSource,
  TTarget = UnknownTarget,
>(
  structure: AsyncStructure,
  source: TSource,
  target?: TTarget,
  options?: Partial<MapperOptions>,
): Promise<TTarget> {
  const mapper = new AsyncMapper<TSource, TTarget>(structure, options);
  return mapper.map(source, target);
}
