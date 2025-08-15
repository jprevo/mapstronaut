#!/usr/bin/env node

/**
 * Test script to validate code examples in documentation files
 * Dynamically extracts and executes TypeScript code blocks from markdown
 */

import * as fs from "fs";
import * as path from "path";
import { strict as assert } from "assert";
import { Mapper, AsyncMapper, mapObject } from "../index.js";

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

async function executeCodeBlock(codeBlock: CodeBlock): Promise<void> {
  try {
    // Create a safe execution context with available imports
    const context = {
      Mapper,
      AsyncMapper,
      mapObject,
      console,
      assert,
      // Store results for validation
      results: {} as any,
      // Async helper functions for advanced examples
      validateSpacecraftCertification: async (name: string) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return name.includes("Artemis") || name.includes("Apollo");
      },
      calculateOptimalTrajectory: async (destination: string, fuel: number) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        if (destination === "Moon" && fuel > 70) return "trans-lunar-injection";
        if (destination === "Mars" && fuel > 90) return "hohmann-transfer";
        return "earth-orbit-standby";
      },
      enrichCrewData: async (crewMember: any) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return {
          ...crewMember,
          certified: crewMember.experience > 1000,
          missionReady: crewMember.experience > 500,
        };
      },
      assessMissionRisk: async (missionData: any) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        const baseRisk = missionData.riskLevel || 0;
        const fuelRisk = missionData.spacecraft?.fuel < 70 ? 0.1 : 0;
        const crewRisk = missionData.crew?.length < 2 ? 0.15 : 0;

        const totalRisk = baseRisk + fuelRisk + crewRisk;
        if (totalRisk > 0.3) return "high";
        if (totalRisk > 0.15) return "moderate";
        return "low";
      },
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
      "AsyncMapper",
      "mapObject",
      "console",
      "assert",
      `
      with (context) {
        return (async () => {
          ${code}
          return context;
        })();
      }
      `,
    );

    // Execute the code (now async)
    const result = await executeCode(
      context,
      Mapper,
      AsyncMapper,
      mapObject,
      console,
      assert,
    );

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

async function runTests(): Promise<void> {
  console.log("🚀 Running documentation examples validation...\n");

  const docFiles = ["docs/basic-usage.md", "docs/advanced.md"];
  const allCodeBlocks: (CodeBlock & { file: string })[] = [];

  // Parse all documentation files
  for (const docFile of docFiles) {
    const docsPath = path.resolve(process.cwd(), docFile);

    if (!fs.existsSync(docsPath)) {
      console.error(`❌ Could not find ${docFile} at ${docsPath}`);
      continue;
    }

    const codeBlocks = parseMarkdownCodeBlocks(docsPath);
    const blocksWithFile = codeBlocks.map((block) => ({
      ...block,
      file: docFile,
    }));
    allCodeBlocks.push(...blocksWithFile);
  }

  if (allCodeBlocks.length === 0) {
    console.error("❌ No TypeScript code blocks found in documentation files");
    process.exit(1);
  }

  console.log(
    `Found ${allCodeBlocks.length} TypeScript code blocks to test:\n`,
  );

  let passed = 0;
  let failed = 0;

  for (const codeBlock of allCodeBlocks) {
    try {
      await executeCodeBlock(codeBlock);
      console.log(
        `✅ ${codeBlock.file}: ${codeBlock.section} (lines ${codeBlock.startLine}-${codeBlock.endLine})`,
      );
      passed++;
    } catch (error) {
      console.error(
        `❌ ${codeBlock.file}: ${codeBlock.section} (lines ${codeBlock.startLine}-${codeBlock.endLine})`,
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
  console.log(`   Total: ${allCodeBlocks.length}`);

  if (failed === 0) {
    console.log(
      "\n🎉 All code examples in documentation files are working correctly!",
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
