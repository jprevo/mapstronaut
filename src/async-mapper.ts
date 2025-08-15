import { BaseMapper } from "./base-mapper.js";
import type { UnknownSource, UnknownTarget } from "./types/generic.js";
import type {
  MapperOptions,
  AsyncStructure,
  AsyncRule,
  AsyncRuleObject,
  Rule,
} from "./types/mapper.js";
import { AsyncRuleProcessor } from "./mapper/rule-processor.js";
import { ConcurrencyController } from "./mapper/concurrency-controller.js";

export class AsyncMapper<
  TSource = UnknownSource,
  TTarget = UnknownTarget,
> extends BaseMapper<TSource, TTarget> {
  private asyncStructure: AsyncStructure;
  private ruleProcessor: AsyncRuleProcessor<TSource, TTarget>;

  constructor(structure: AsyncStructure, options?: Partial<MapperOptions>) {
    super(structure as Rule[], options);
    this.asyncStructure = structure;
    this.ruleProcessor = new AsyncRuleProcessor(this.outpath, this.options);
  }

  getAsyncStructure(): AsyncStructure {
    return this.asyncStructure;
  }

  setAsyncStructure(structure: AsyncStructure): void {
    this.structure = structure as Rule[];
    this.asyncStructure = structure;
  }

  async map(source: TSource, target?: TTarget): Promise<TTarget> {
    let result = target ?? ({} as TTarget);
    result = this.applyAutomap(source, result);

    const processRule = async (rule: AsyncRule): Promise<void> => {
      const ruleObj = this.normalizeRule(rule as Rule);

      await this.ruleProcessor.processRule(
        ruleObj,
        source,
        result,
        (src, path) => this.extractData(src, path),
      );
    };

    if (this.options.parallelRun) {
      await ConcurrencyController.executeWithLimitedConcurrency(
        this.asyncStructure,
        processRule,
        this.options.parallelJobsLimit,
      );
    } else {
      for (const rule of this.asyncStructure) {
        await processRule(rule);
      }
    }

    return result;
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
  return new AsyncMapper<TSource, TTarget>(structure, options).map(
    source,
    target,
  );
}
