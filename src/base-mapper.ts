import { JSONPath } from "jsonpath-plus";
import { OutPath } from "./outpath.js";
import type { UnknownSource, UnknownTarget } from "./types/generic.js";
import type {
  MapperOptions,
  Rule,
  RuleArray,
  RuleObject,
} from "./types/mapper.js";
import { Automapper } from "./automapper.js";

export abstract class BaseMapper<
  TSource = UnknownSource,
  TTarget = UnknownTarget,
> {
  protected structure: Rule[];
  protected options: MapperOptions;
  protected outpath: OutPath<TTarget>;

  protected constructor(structure: Rule[], options?: Partial<MapperOptions>) {
    this.structure = structure;
    this.options = this.mergeWithDefaults(options);
    this.outpath = new OutPath<TTarget>();
  }

  protected mergeWithDefaults(options?: Partial<MapperOptions>): MapperOptions {
    return {
      assumeRoot: options?.assumeRoot ?? true,
      automap: options?.automap ?? true,
      automapCheckType: options?.automapCheckType ?? true,
      skipNull: options?.skipNull ?? false,
      skipUndefined: options?.skipUndefined ?? true,
      jsonPathOptions: options?.jsonPathOptions ?? null,
      parallelRun: options?.parallelRun ?? false,
    };
  }

  getOptions(): MapperOptions {
    return { ...this.options };
  }

  setOptions(options: Partial<MapperOptions>): void {
    this.options = this.mergeWithDefaults(options);
  }

  getStructure(): Rule[] {
    return [...this.structure];
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

  protected normalizeRule(rule: Rule): RuleObject {
    if (Array.isArray(rule)) {
      const [source, target] = rule as RuleArray;
      return { source, target };
    }
    return rule as RuleObject;
  }

  protected normalizeJsonPath(path: string): string {
    if (this.options.assumeRoot && !path.startsWith("$.")) {
      return `$.${path}`;
    }

    return path;
  }

  protected applyAutomap(source: TSource, result: TTarget): TTarget {
    if (this.options.automap) {
      const automapper = new Automapper({
        checkType: this.options.automapCheckType,
      });

      result = automapper.map(source as any, result as any) as TTarget;
    }

    return result;
  }

  protected extractData(source: TSource, jsonPath: string): any {
    try {
      const result = JSONPath({
        ...(this.options.jsonPathOptions ?? {}),
        path: jsonPath,
        json: source as any,
        wrap: false,
      });
      return result;
    } catch (error) {
      throw new Error(
        `Failed to extract data using JSONPath '${jsonPath}': ${error instanceof Error ? error.message : String(error)}`,
      );
    }
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

  abstract map(source: TSource, target?: TTarget): TTarget | Promise<TTarget>;
}
