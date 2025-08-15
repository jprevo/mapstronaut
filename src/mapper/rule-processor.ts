import type { UnknownSource, UnknownTarget } from "../types/generic.js";
import type {
  RuleObject,
  AsyncRuleObject,
  MapperOptions,
} from "../types/mapper.js";
import { OutPath } from "../outpath.js";

export abstract class BaseRuleProcessor<
  TSource = UnknownSource,
  TTarget = UnknownTarget,
  TRule extends RuleObject | AsyncRuleObject = RuleObject,
> {
  protected outpath: OutPath<TTarget>;
  protected options: MapperOptions;

  constructor(outpath: OutPath<TTarget>, options: MapperOptions) {
    this.outpath = outpath;
    this.options = options;
  }

  protected shouldSkip(value: any): boolean {
    if (value === null && this.options.skipNull) {
      return true;
    }

    if (value === undefined && this.options.skipUndefined) {
      return true;
    }

    return false;
  }

  protected normalizeJsonPath(path: string): string {
    if (this.options.assumeRoot && !path.startsWith("$.")) {
      return `$.${path}`;
    }
    return path;
  }

  protected createError(target: string, message: string): Error {
    return new Error(
      `Mapping failed: ${message} for rule with target '${target}'`,
    );
  }

  abstract processRule(
    rule: TRule,
    source: TSource,
    target: TTarget,
    extractData: (source: TSource, jsonPath: string) => any,
  ): void | Promise<void>;
}

export class SyncRuleProcessor<
  TSource = UnknownSource,
  TTarget = UnknownTarget,
> extends BaseRuleProcessor<TSource, TTarget, RuleObject> {
  processRule(
    rule: RuleObject,
    source: TSource,
    target: TTarget,
    extractData: (source: TSource, jsonPath: string) => any,
  ): void {
    if (rule.constant !== undefined) {
      this.processConstantRule(rule, source, target);
      return;
    }

    if (!rule.source) {
      throw new Error("Rule must have either 'source' or 'constant' defined");
    }

    this.processSourceRule(rule, source, target, extractData);
  }

  private processConstantRule(
    rule: RuleObject,
    source: TSource,
    target: TTarget,
  ): void {
    if (rule.filter && !rule.filter(rule.constant, source, target)) {
      return;
    }

    const finalValue = this.transformAndFailOn(
      rule.constant,
      rule,
      source,
      target,
    );

    this.outpath.write(target, rule.target, finalValue);
  }

  private processSourceRule(
    rule: RuleObject,
    source: TSource,
    target: TTarget,
    extractData: (source: TSource, jsonPath: string) => any,
  ): void {
    const jsonPath = this.normalizeJsonPath(rule.source!);
    const data = extractData(source, jsonPath);

    if (rule.filter && !rule.filter(data, source, target)) {
      return;
    }

    let valueToMap = data;
    if (
      (data === null || data === undefined) &&
      rule.defaultValue !== undefined
    ) {
      valueToMap = rule.defaultValue;
    }

    valueToMap = this.transformAndFailOn(valueToMap, rule, source, target);

    if (this.shouldSkip(valueToMap)) {
      return;
    }

    this.outpath.write(target, rule.target, valueToMap);
  }

  private transformAndFailOn(
    value: any,
    rule: RuleObject,
    source: TSource,
    target: TTarget,
  ): any {
    if (rule.transform) {
      value = rule.transform(value, source, target);
    }

    if (rule.failOn && rule.failOn(value, source, target)) {
      throw this.createError(rule.target, "condition failed");
    }

    return value;
  }
}

export class AsyncRuleProcessor<
  TSource = UnknownSource,
  TTarget = UnknownTarget,
> extends BaseRuleProcessor<TSource, TTarget, AsyncRuleObject> {
  async processRule(
    rule: AsyncRuleObject,
    source: TSource,
    target: TTarget,
    extractData: (source: TSource, jsonPath: string) => any,
  ): Promise<void> {
    if (rule.constant !== undefined) {
      await this.processConstantRule(rule, source, target);
      return;
    }

    if (!rule.source) {
      throw new Error("Rule must have either 'source' or 'constant' defined");
    }

    await this.processSourceRule(rule, source, target, extractData);
  }

  private async processConstantRule(
    rule: AsyncRuleObject,
    source: TSource,
    target: TTarget,
  ): Promise<void> {
    if (
      rule.filter &&
      !(await Promise.resolve(rule.filter(rule.constant, source, target)))
    ) {
      return;
    }

    const finalValue = await this.transformAndFailOn(
      rule.constant,
      rule,
      source,
      target,
    );

    this.outpath.write(target, rule.target, finalValue);
  }

  private async processSourceRule(
    rule: AsyncRuleObject,
    source: TSource,
    target: TTarget,
    extractData: (source: TSource, jsonPath: string) => any,
  ): Promise<void> {
    const jsonPath = this.normalizeJsonPath(rule.source!);
    const data = extractData(source, jsonPath);

    if (
      rule.filter &&
      !(await Promise.resolve(rule.filter(data, source, target)))
    ) {
      return;
    }

    let valueToMap = data;
    if (
      (data === null || data === undefined) &&
      rule.defaultValue !== undefined
    ) {
      valueToMap = rule.defaultValue;
    }

    valueToMap = await this.transformAndFailOn(
      valueToMap,
      rule,
      source,
      target,
    );

    if (this.shouldSkip(valueToMap)) {
      return;
    }

    this.outpath.write(target, rule.target, valueToMap);
  }

  private async transformAndFailOn(
    value: any,
    rule: AsyncRuleObject,
    source: TSource,
    target: TTarget,
  ): Promise<any> {
    if (rule.transform) {
      value = await Promise.resolve(rule.transform(value, source, target));
    }

    if (
      rule.failOn &&
      (await Promise.resolve(rule.failOn(value, source, target)))
    ) {
      throw this.createError(rule.target, "condition failed");
    }

    return value;
  }
}
