import { JSONPath } from "jsonpath-plus";
import { OutPath } from "./outpath.js";
import type { UnknownSource, UnknownTarget } from "./types/generic.js";
import type { MapperOptions, Rule, RuleObject } from "./types/mapper.js";
import { Automapper } from "./automapper.js";
import { AutomapArrayStrategy } from "./types/automapper.js";

export abstract class BaseMapper<
  TSource = UnknownSource,
  TTarget = UnknownTarget,
> {
  protected structure: Rule[];
  protected options: MapperOptions;
  protected outpath: OutPath<TTarget>;

  abstract map(source: TSource, target?: TTarget): TTarget | Promise<TTarget>;

  protected constructor(structure: Rule[], options?: Partial<MapperOptions>) {
    this.structure = structure;
    this.options = this.mergeWithDefaults(options);
    this.outpath = new OutPath<TTarget>();
  }

  getOptions(): MapperOptions {
    return this.options;
  }

  setOptions(options: Partial<MapperOptions>): void {
    this.options = this.mergeWithDefaults(options);
  }

  getStructure(): Rule[] {
    return this.structure;
  }

  setStructure(structure: Rule[]): void {
    this.structure = structure;
  }

  get assumeRoot(): boolean {
    return this.options.assumeRoot;
  }

  set assumeRoot(value: boolean) {
    this.options.assumeRoot = value;
  }

  get automap(): boolean {
    return this.options.automap;
  }

  set automap(value: boolean) {
    this.options.automap = value;
  }

  get skipNull(): boolean {
    return this.options.skipNull;
  }

  set skipNull(value: boolean) {
    this.options.skipNull = value;
  }

  get skipUndefined(): boolean {
    return this.options.skipUndefined;
  }

  set skipUndefined(value: boolean) {
    this.options.skipUndefined = value;
  }

  get parallelRun(): boolean {
    return this.options.parallelRun;
  }

  set parallelRun(value: boolean) {
    this.options.parallelRun = value;
  }

  protected mergeWithDefaults(options?: Partial<MapperOptions>): MapperOptions {
    return {
      assumeRoot: options?.assumeRoot ?? true,
      automap: options?.automap ?? true,
      automapCheckType: options?.automapCheckType ?? false,
      automapArrayStrategy:
        options?.automapArrayStrategy ?? AutomapArrayStrategy.Replace,
      skipNull: options?.skipNull ?? false,
      skipUndefined: options?.skipUndefined ?? true,
      jsonPathOptions: options?.jsonPathOptions ?? null,
      parallelRun: options?.parallelRun ?? false,
      parallelJobsLimit: options?.parallelJobsLimit ?? 0,
    };
  }

  protected normalizeRule(rule: Rule): RuleObject {
    if (Array.isArray(rule)) {
      const [source, target] = rule;
      return { source, target };
    }

    return rule;
  }

  protected applyAutomap(source: TSource, result: TTarget): TTarget {
    if (this.options.automap) {
      const automapper = new Automapper({
        checkType: this.options.automapCheckType,
        automapArrayStrategy:
          this.options.automapArrayStrategy ?? AutomapArrayStrategy.Replace,
      });

      result = automapper.map(source as any, result as any) as TTarget;
    }

    return result;
  }

  protected extractData(source: TSource, jsonPath: string): any {
    try {
      return JSONPath({
        ...(this.options.jsonPathOptions ?? {}),
        path: jsonPath,
        json: source as any,
        wrap: false,
      });
    } catch (error) {
      throw new Error(
        `Failed to extract data using JSONPath '${jsonPath}': ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
