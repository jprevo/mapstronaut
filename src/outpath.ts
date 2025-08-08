import type { UnknownTarget } from "./types/generic.js";

export class OutPath<T = UnknownTarget> {
  private static segmentCache: Map<string, string[]> = new Map();

  write(target: T, path: string, value: any): void {
    if (!path) {
      throw new Error("Path cannot be empty");
    }

    const segments = this.getCachedSegments(path);

    // Check for empty segments (consecutive dots or leading/trailing dots)
    if (segments.some((segment) => segment === "")) {
      throw new Error("Invalid path: path cannot contain empty segments");
    }

    let current: UnknownTarget = target;

    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i]!;

      if (current[segment] === undefined || current[segment] === null) {
        current[segment] = {};
      }

      current = current[segment];
    }

    const finalSegment = segments[segments.length - 1];
    if (finalSegment) {
      current[finalSegment] = value;
    }
  }

  private getCachedSegments(path: string): string[] {
    let segments = OutPath.segmentCache.get(path);
    if (!segments) {
      segments = this.parseSegments(path);
      OutPath.segmentCache.set(path, segments);
    }
    return segments;
  }

  private parseSegments(path: string): string[] {
    const segments: string[] = [];
    let currentSegment = "";
    let i = 0;

    while (i < path.length) {
      const char = path[i];

      if (char === "\\") {
        if (i + 1 < path.length && path[i + 1] === ".") {
          currentSegment += ".";
          i += 2;
        } else {
          currentSegment += char;
          i++;
        }
      } else if (char === ".") {
        segments.push(currentSegment);
        currentSegment = "";
        i++;
      } else {
        currentSegment += char;
        i++;
      }
    }

    segments.push(currentSegment);

    return segments;
  }
}
