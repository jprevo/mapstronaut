import type { UnknownSource, UnknownTarget } from "./generic.js";

export type AutomapperConfiguration = {
  checkType: boolean;
  automapObjectStrategy?: AutomapStrategyFunction | AutomapSimpleStrategy;
  automapArrayStrategy?: AutomapArrayStrategyFunction | AutomapArrayStrategy;
};

export type AutomapStrategyFunction = (
  key: string,
  source: UnknownSource,
  target: UnknownTarget,
) => any;

export type AutomapArrayStrategyFunction = (
  key: string,
  source: UnknownSource[],
  target: UnknownTarget[],
) => any;

export enum AutomapSimpleStrategy {
  PreserveTarget = "PreserveTarget",
  PreserveSource = "PreserveSource",
}

export enum AutomapArrayStrategy {
  Concatenate = "Concatenate", // append both array
  Replace = "Replace", // replace target array by source array
  MergeByIndex = "MergeByIndex", // replace target array values if they have values with same index in source
}
