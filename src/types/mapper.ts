export type MapperOptions = {
  assumeRoot: boolean; // default true, add $. to JSONPath entries if not present for easier structure configuration
  automap: boolean; // default true, use automapping ?
  skipNull: boolean; // default false, should null values in source not be mapped ?
  skipUndefined: boolean; // default true, should undefined values in source not be mapper ?
};

export type Rule = RuleArray | RuleObject;

export type RuleArray = [string, string]; // source (jsonpath), target (outpath)

export type RuleObject = {
  source?: string; // jsonpath
  target: string; // outpath
  transform?: (data: any, source: any, target: any) => any;
  constant?: any;
  filter?: (data: any, source: any, target: any) => boolean;
  defaultValue?: any;
  failOn?: (data: any, source: any, target: any) => boolean;
};

export type Structure = Rule[];
