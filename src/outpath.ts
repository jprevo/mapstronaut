import type { UnknownTarget } from "./types/generic.js";

export class OutPath<T = UnknownTarget> {
  write(target: T, path: string, value: any): void {
    if (!path) {
      throw new Error("Path cannot be empty");
    }

    const segments = this.parseSegments(path);

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

  private parseSegments(path: string): string[] {
    const segments: string[] = [];
    let currentSegment = "";
    let i = 0;

    while (i < path.length) {
      const char = path[i];

      if (char === "\\") {
        // Check if the next character is a dot to escape
        if (i + 1 < path.length && path[i + 1] === ".") {
          currentSegment += ".";
          i += 2; // Skip both backslash and dot
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

    // Add the final segment
    segments.push(currentSegment);

    return segments;
  }
}
