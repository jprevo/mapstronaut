import { setProperty } from "dot-prop";
import type { UnknownTarget } from "./types/generic.js";

export class OutPath<T = UnknownTarget> {
  write(target: T, path: string, value: any): void {
    if (!path) {
      throw new Error("Path cannot be empty");
    }

    // Use dot-prop directly
    setProperty(target as Record<string, any>, path, value);
  }
}
