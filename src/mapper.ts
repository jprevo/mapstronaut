import { BaseMapper } from "./base-mapper.js";
import type { UnknownSource, UnknownTarget } from "./types/generic.js";
import type {
  MapperOptions,
  Structure,
  Rule,
  RuleObject,
} from "./types/mapper.js";

export class Mapper<
  TSource = UnknownSource,
  TTarget = UnknownTarget,
> extends BaseMapper<TSource, TTarget> {
  constructor(structure: Structure, options?: Partial<MapperOptions>) {
    super(structure, options);
  }

  map(source: TSource, target?: TTarget): TTarget {
    let result = target ?? ({} as TTarget);
    result = this.applyAutomap(source, result);

    for (const rule of this.structure) {
      this.processRule(rule, source, result);
    }

    return result;
  }

  private processRule(rule: Rule, source: TSource, target: TTarget): void {
    const ruleObj = this.normalizeRule(rule);

    // Handle constant values
    if (ruleObj.constant !== undefined) {
      // Apply filter to constant values if present
      if (ruleObj.filter && !ruleObj.filter(ruleObj.constant, source, target)) {
        return;
      }

      let finalValue = ruleObj.constant;

      // Apply transform to constant values if present
      if (ruleObj.transform) {
        finalValue = ruleObj.transform(ruleObj.constant, source, target);
      }

      // Apply failOn check for constant values
      if (ruleObj.failOn && ruleObj.failOn(finalValue, source, target)) {
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
    if (ruleObj.filter && !ruleObj.filter(data, source, target)) {
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
      valueToMap = ruleObj.transform(valueToMap, source, target);
    }

    // Apply failOn check - if it returns true, throw error and stop mapping
    if (ruleObj.failOn && ruleObj.failOn(valueToMap, source, target)) {
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
}

export function mapObject<TSource = UnknownSource, TTarget = UnknownTarget>(
  structure: Structure,
  source: TSource,
  target?: TTarget,
  options?: Partial<MapperOptions>,
): TTarget {
  const mapper = new Mapper<TSource, TTarget>(structure, options);
  return mapper.map(source, target);
}
