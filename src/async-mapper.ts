import { BaseMapper } from "./base-mapper.js";
import type { UnknownSource, UnknownTarget } from "./types/generic.js";
import type {
  MapperOptions,
  AsyncStructure,
  AsyncRule,
  AsyncRuleObject,
  Rule,
  RuleObject,
} from "./types/mapper.js";

export class AsyncMapper<
  TSource = UnknownSource,
  TTarget = UnknownTarget,
> extends BaseMapper<TSource, TTarget> {
  private asyncStructure: AsyncStructure;

  constructor(structure: AsyncStructure, options?: Partial<MapperOptions>) {
    super(structure as Rule[], options);
    this.asyncStructure = structure;
  }

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

    if (this.options.parallelRun) {
      await Promise.all(
        this.asyncStructure.map((rule) =>
          this.processRule(rule, source, result),
        ),
      );
    } else {
      for (const rule of this.asyncStructure) {
        await this.processRule(rule, source, result);
      }
    }

    return result;
  }

  private async processRule(
    rule: AsyncRule,
    source: TSource,
    target: TTarget,
  ): Promise<void> {
    const ruleObj = this.normalizeAsyncRule(rule);

    if (ruleObj.constant !== undefined) {
      if (
        ruleObj.filter &&
        !(await Promise.resolve(
          ruleObj.filter(ruleObj.constant, source, target),
        ))
      ) {
        return;
      }

      let finalValue = await this.transformAndFailOn(
        ruleObj.constant,
        ruleObj,
        source,
        target,
      );

      this.outpath.write(target, ruleObj.target, finalValue);
      return;
    }

    if (!ruleObj.source) {
      throw new Error("Rule must have either 'source' or 'constant' defined");
    }

    const jsonPath = this.normalizeJsonPath(ruleObj.source);
    const data = this.extractData(source, jsonPath);

    if (ruleObj.filter && !(await ruleObj.filter(data, source, target))) {
      return;
    }

    let valueToMap = data;
    if (
      (data === null || data === undefined) &&
      ruleObj.defaultValue !== undefined
    ) {
      valueToMap = ruleObj.defaultValue;
    }

    valueToMap = await this.transformAndFailOn(
      valueToMap,
      ruleObj,
      source,
      target,
    );

    if (this.shouldSkip(valueToMap)) {
      return;
    }

    this.outpath.write(target, ruleObj.target, valueToMap);
  }

  protected async transformAndFailOn(
    value: any,
    ruleObj: AsyncRuleObject,
    source: TSource,
    target: TTarget,
  ): Promise<any> {
    if (ruleObj.transform) {
      value = await Promise.resolve(ruleObj.transform(value, source, target));
    }

    // Apply failOn check for constant values
    if (
      ruleObj.failOn &&
      (await Promise.resolve(ruleObj.failOn(value, source, target)))
    ) {
      throw new Error(
        `Mapping failed: condition failed for rule with target '${ruleObj.target}'`,
      );
    }

    return value;
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
