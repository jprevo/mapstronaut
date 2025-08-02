export type MapperOptions = {
  assumeRoot: boolean; // default true, add $. to JSONPath entries if not present for easier structure configuration
  automap: boolean; // default true, use automapping ?
  skipNull: boolean; // default false, should null values in source not be mapped ?
  skipUndefined: boolean; // default true, should undefined values in source not be mapper ?
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
