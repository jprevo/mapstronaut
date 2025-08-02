import { JSONPath } from "jsonpath-plus";
import { Outpath } from "./outpath.js";
import type { UnknownSource, UnknownTarget } from "./types/generic.js";
import type {
  MapperOptions,
  Structure,
  Rule,
  RuleArray,
  RuleObject,
} from "./types/mapper.js";

export class Mapper<TSource = UnknownSource, TTarget = UnknownTarget> {
  private structure: Structure;
  private options: MapperOptions;
  private outpath: Outpath<TTarget>;

  constructor(structure: Structure, options?: Partial<MapperOptions>) {
    this.structure = structure;
    this.options = this.mergeWithDefaults(options);
    this.outpath = new Outpath<TTarget>();
  }

  private mergeWithDefaults(options?: Partial<MapperOptions>): MapperOptions {
    return {
      assumeRoot: options?.assumeRoot ?? true,
      automap: options?.automap ?? true,
      skipNull: options?.skipNull ?? false,
      skipUndefined: options?.skipUndefined ?? true,
    };
  }

  getOptions(): MapperOptions {
    return { ...this.options };
  }

  setOptions(options: Partial<MapperOptions>): void {
    this.options = this.mergeWithDefaults(options);
  }

  getStructure(): Structure {
    return [...this.structure];
  }

  setStructure(structure: Structure): void {
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

  map(source: TSource, target?: TTarget): TTarget {
    const result = target ?? ({} as TTarget);

    for (const rule of this.structure) {
      this.processRule(rule, source, result);
    }

    return result;
  }

  private processRule(rule: Rule, source: TSource, target: TTarget): void {
    const ruleObj = this.normalizeRule(rule);

    // Handle constant values
    if (ruleObj.constant !== undefined) {
      this.outpath.write(target, ruleObj.target, ruleObj.constant);
      return;
    }

    // Source is required if constant is not provided
    if (!ruleObj.source) {
      throw new Error("Rule must have either 'source' or 'constant' defined");
    }

    const jsonPath = this.normalizeJsonPath(ruleObj.source);
    const data = this.extractData(source, jsonPath);

    // Use defaultValue if data is null or undefined
    let valueToMap = data;
    if (
      (data === null || data === undefined) &&
      ruleObj.defaultValue !== undefined
    ) {
      valueToMap = ruleObj.defaultValue;
    }

    // Apply skipNull and skipUndefined rules after default value processing
    if (valueToMap === null && this.options.skipNull) {
      return;
    }
    if (valueToMap === undefined && this.options.skipUndefined) {
      return;
    }

    this.outpath.write(target, ruleObj.target, valueToMap);
  }

  private normalizeRule(rule: Rule): RuleObject {
    if (Array.isArray(rule)) {
      const [source, target] = rule as RuleArray;
      return { source, target };
    }
    return rule as RuleObject;
  }

  private normalizeJsonPath(path: string): string {
    if (this.options.assumeRoot && !path.startsWith("$.")) {
      return `$.${path}`;
    }

    return path;
  }

  private extractData(source: TSource, jsonPath: string): any {
    try {
      const result = JSONPath({
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
