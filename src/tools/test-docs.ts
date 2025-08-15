#!/usr/bin/env node

/**
 * Test script to validate code examples in docs/basic-usage.md
 * Dynamically extracts and executes TypeScript code blocks from markdown
 */

import * as fs from "fs";
import * as path from "path";
import { strict as assert } from "assert";
import { Mapper, mapObject } from "../index.js";

interface CodeBlock {
  section: string;
  code: string;
  startLine: number;
  endLine: number;
}

function parseMarkdownCodeBlocks(filePath: string): CodeBlock[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const codeBlocks: CodeBlock[] = [];

  let currentSection = "";
  let inCodeBlock = false;
  let currentCode: string[] = [];
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    // Track current section from headers
    if (line.startsWith("## ")) {
      currentSection = line.replace("## ", "").trim();
    }

    // Start of TypeScript code block
    if (line.trim() === "```ts") {
      inCodeBlock = true;
      currentCode = [];
      startLine = i + 1;
      continue;
    }

    // End of code block
    if (line.trim() === "```" && inCodeBlock) {
      inCodeBlock = false;
      if (currentCode.length > 0) {
        codeBlocks.push({
          section: currentSection,
          code: currentCode.join("\n"),
          startLine,
          endLine: i,
        });
      }
      continue;
    }

    // Collect code lines
    if (inCodeBlock) {
      currentCode.push(line);
    }
  }

  return codeBlocks;
}

function executeCodeBlock(codeBlock: CodeBlock): void {
  try {
    // Create a safe execution context with available imports
    const context = {
      Mapper,
      mapObject,
      console,
      assert,
      // Store results for validation
      results: {} as any,
    };

    // Wrap the code to capture the final result variable
    let code = codeBlock.code;

    // If the code contains a result assignment and a comment showing expected result,
    // we'll extract and validate it
    const resultMatch = code.match(/const result = (.+);/);
    const commentMatch = code.match(/\/\/ Result: (.+)/);

    if (resultMatch && commentMatch && commentMatch[1]) {
      // Parse the expected result from the comment
      const expectedResultStr = commentMatch[1].trim();
      let expectedResult: any;

      try {
        // Handle the specific format used in the docs
        if (
          expectedResultStr.startsWith("{") ||
          expectedResultStr.startsWith("[")
        ) {
          expectedResult = eval(`(${expectedResultStr})`);
        } else {
          expectedResult = expectedResultStr;
        }

        // Add validation to the code
        code += `\ncontext.results.actual = result;\ncontext.results.expected = ${JSON.stringify(expectedResult)};`;
      } catch (e) {
        // If we can't parse the expected result, skip validation
        console.warn(
          `Warning: Could not parse expected result for ${codeBlock.section}: ${expectedResultStr}`,
        );
      }
    }

    // Create a function that executes the code in our context
    const executeCode = new Function(
      "context",
      "Mapper",
      "mapObject",
      "console",
      "assert",
      `
      with (context) {
        ${code}
      }
      return context;
      `,
    );

    // Execute the code
    const result = executeCode(context, Mapper, mapObject, console, assert);

    // Validate result if we have both actual and expected
    if (
      result.results.actual !== undefined &&
      result.results.expected !== undefined
    ) {
      assert.deepStrictEqual(
        result.results.actual,
        result.results.expected,
        `Result mismatch in ${codeBlock.section}`,
      );
    }
  } catch (error) {
    throw new Error(
      `Execution failed in ${codeBlock.section} (lines ${codeBlock.startLine}-${codeBlock.endLine}): ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function runTests(): void {
  console.log("🚀 Running docs/basic-usage.md examples validation...\n");

  const docsPath = path.resolve(process.cwd(), "docs/basic-usage.md");

  if (!fs.existsSync(docsPath)) {
    console.error(`❌ Could not find docs/basic-usage.md at ${docsPath}`);
    process.exit(1);
  }

  const codeBlocks = parseMarkdownCodeBlocks(docsPath);

  if (codeBlocks.length === 0) {
    console.error("❌ No TypeScript code blocks found in docs/basic-usage.md");
    process.exit(1);
  }

  console.log(`Found ${codeBlocks.length} TypeScript code blocks to test:\n`);

  let passed = 0;
  let failed = 0;

  for (const codeBlock of codeBlocks) {
    try {
      executeCodeBlock(codeBlock);
      console.log(
        `✅ ${codeBlock.section} (lines ${codeBlock.startLine}-${codeBlock.endLine})`,
      );
      passed++;
    } catch (error) {
      console.error(
        `❌ ${codeBlock.section} (lines ${codeBlock.startLine}-${codeBlock.endLine})`,
      );
      console.error(
        `   Error: ${error instanceof Error ? error.message : String(error)}\n`,
      );
      failed++;
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${codeBlocks.length}`);

  if (failed === 0) {
    console.log(
      "\n🎉 All code examples in docs/basic-usage.md are working correctly!",
    );
    process.exit(0);
  } else {
    console.log("\n💥 Some examples failed. Please check the implementation.");
    process.exit(1);
  }
}

// Run tests when script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests, parseMarkdownCodeBlocks, executeCodeBlock };
