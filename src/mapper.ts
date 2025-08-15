import { BaseMapper } from "./base-mapper.js";
import type { UnknownSource, UnknownTarget } from "./types/generic.js";
import type {
  MapperOptions,
  Structure,
  Rule,
  RuleObject,
} from "./types/mapper.js";
import { SyncRuleProcessor } from "./mapper/rule-processor.js";

export class Mapper<
  TSource = UnknownSource,
  TTarget = UnknownTarget,
> extends BaseMapper<TSource, TTarget> {
  private ruleProcessor: SyncRuleProcessor<TSource, TTarget>;

  constructor(structure: Structure, options?: Partial<MapperOptions>) {
    super(structure, options);
    this.ruleProcessor = new SyncRuleProcessor(this.outpath, this.options);
  }

  map(source: TSource, target?: TTarget): TTarget {
    let result = target ?? ({} as TTarget);
    result = this.applyAutomap(source, result);

    for (const rule of this.structure) {
      const ruleObj = this.normalizeRule(rule);

      this.ruleProcessor.processRule(ruleObj, source, result, (src, path) =>
        this.extractData(src, path),
      );
    }

    return result;
  }
}

export function mapObject<TSource = UnknownSource, TTarget = UnknownTarget>(
  structure: Structure,
  source: TSource,
  target?: TTarget,
  options?: Partial<MapperOptions>,
): TTarget {
  return new Mapper<TSource, TTarget>(structure, options).map(source, target);
}
