import {
  AutomapArrayStrategy,
  type AutomapArrayStrategyFunction,
} from "./automapper.js";

export type MapperOptions = {
  // default true, add $. to JSONPath entries if not present for easier structure configuration
  assumeRoot: boolean;
  // default true, use automapping ?
  automap: boolean;
  // default false, should automapping check types ?
  automapCheckType: boolean;
  // default Replace, array merging strategy
  automapArrayStrategy?: AutomapArrayStrategyFunction | AutomapArrayStrategy;
  // default false, should null values in source not be mapped ?
  skipNull: boolean;
  // default true, should undefined values in source not be mapper ?
  skipUndefined: boolean;
  // json path plus specific options
  jsonPathOptions?: any;
  // default false, only available on AsyncMapper
  parallelRun: boolean;
  // default 0 (unlimited), restricts the number of parallel jobs running
  parallelJobsLimit: number;
};

export type Rule = RuleArray | RuleObject;
export type AsyncRule = RuleArray | AsyncRuleObject;

export type RuleArray = [string, string]; // source (jsonpath), target (outpath)

type BaseRuleObject = {
  source?: string; // jsonpath
  target: string; // outpath
  constant?: any;
  defaultValue?: any;
};

export type RuleObject = BaseRuleObject & {
  transform?: (data: any, source: any, target: any) => any;
  filter?: (data: any, source: any, target: any) => boolean;
  failOn?: (data: any, source: any, target: any) => boolean;
};

export type AsyncRuleObject = BaseRuleObject & {
  transform?: (data: any, source: any, target: any) => any | Promise<any>;
  filter?: (data: any, source: any, target: any) => boolean | Promise<boolean>;
  failOn?: (data: any, source: any, target: any) => boolean | Promise<boolean>;
};

export type Structure = Rule[];
export type AsyncStructure = AsyncRule[];
