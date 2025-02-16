import fs from "fs";
import path from "path";
import { glob } from "glob";

/**
 * Finds remote code references in file content
 * @param {string} content - File content to analyze
 * @returns {Array<string>} - Array of matched remote references
 */
function findRemoteCodeReferences(content) {
  const matches = [];

  // Regular expressions for detecting remote URLs
  const patterns = [
    // Script tags with src attribute
    /<script[^>]+src=["'](?:https?:)?\/\/[^"']+["'][^>]*>/gi,
  ];

  for (const pattern of patterns) {
    const found = content.match(pattern);
    if (found) {
      matches.push(...found.map((match) => match.trim()));
    }
  }

  // Remove duplicates and filter out false positives
  return [...new Set(matches)].filter((match) => {
    // Exclude common false positives
    const exclusions = ["localhost", "127.0.0.1", "0.0.0.0", "example.com"];

    return !exclusions.some((exclude) => match.includes(exclude));
  });
}

export function checkForRemoteCode(basePath) {
  const filePaths = glob.sync("**/*.+(js|css|html)", { cwd: basePath });
  try {
    let violations = [];
    for (const filePath of filePaths) {
      const absolutePath = path.resolve(path.join(basePath, filePath));
      const sourceCode = fs.readFileSync(absolutePath, "utf-8");
      const remoteCodeReferences = findRemoteCodeReferences(sourceCode);
      violations.push(
        ...remoteCodeReferences.map((ref) => ({
          file: filePath,
          reference: ref,
        }))
      );
    }

    if (violations.length > 0) {
      throw new Error(
        `Found remote code violations: \n\t${violations
          .map((v) => v.file + "\t" + v.reference)
          .join(",\n\t")}`
      );
    }

    return { message: "Remote code scan", status: "PASS" };
  } catch (error) {
    return {
      message: "Remote code scan",
      status: "FAIL",
      error: error,
    };
  }
}
