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

    if (ruleObj.constant !== undefined) {
      if (ruleObj.filter && !ruleObj.filter(ruleObj.constant, source, target)) {
        return;
      }

      const value = this.transformAndFailOn(
        ruleObj.constant,
        ruleObj,
        source,
        target,
      );

      this.outpath.write(target, ruleObj.target, value);

      return;
    }

    if (!ruleObj.source) {
      throw new Error("Rule must have either 'source' or 'constant' defined");
    }

    const jsonPath = this.normalizeJsonPath(ruleObj.source);
    const data = this.extractData(source, jsonPath);

    if (ruleObj.filter && !ruleObj.filter(data, source, target)) {
      return;
    }

    let valueToMap = data;

    if (
      (data === null || data === undefined) &&
      ruleObj.defaultValue !== undefined
    ) {
      valueToMap = ruleObj.defaultValue;
    }

    valueToMap = this.transformAndFailOn(valueToMap, ruleObj, source, target);

    if (this.shouldSkip(valueToMap)) {
      return;
    }

    this.outpath.write(target, ruleObj.target, valueToMap);
  }

  protected transformAndFailOn(
    value: any,
    ruleObj: RuleObject,
    source: TSource,
    target: TTarget,
  ): any {
    if (ruleObj.transform) {
      value = ruleObj.transform(value, source, target);
    }

    if (ruleObj.failOn && ruleObj.failOn(value, source, target)) {
      throw new Error(
        `Mapping failed: condition failed for rule with target '${ruleObj.target}'`,
      );
    }

    return value;
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
