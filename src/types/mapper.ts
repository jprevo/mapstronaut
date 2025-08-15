import { JSONPath } from "jsonpath-plus";
import type { UnknownSource, UnknownTarget } from "./generic.js";

export type MapperOptions = {
  assumeRoot: boolean; // default true, add $. to JSONPath entries if not present for easier structure configuration
  automap: boolean; // default true, use automapping ?
  automapCheckType: boolean; // default false, should automapping check types ?
  skipNull: boolean; // default false, should null values in source not be mapped ?
  skipUndefined: boolean; // default true, should undefined values in source not be mapper ?
  jsonPathOptions?: any;
  parallelRun: boolean; // default false, on available on AsyncMapper
};

export type Rule = RuleArray | RuleObject;
export type AsyncRule = RuleArray | AsyncRuleObject;

export type RuleArray = [string, string]; // source (jsonpath), target (outpath)

type BaseRuleObject = {
  source?: string; // jsonpath
  target: string; // outpath
  constant?: any;
  defaultValue?: any;
  automapStrategy?: AutomapStrategyFunction | AutomapSimpleStrategy;
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

export type AutomapStrategyFunction = (
  source: UnknownSource,
  target: UnknownTarget,
) => any;

export enum AutomapSimpleStrategy {
  PreserveTarget = "PreserveTarget",
  PreserveSource = "PreserveSource",
}

export type Structure = Rule[];
export type AsyncStructure = AsyncRule[];
