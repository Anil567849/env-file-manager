import test from "node:test";
import assert from "node:assert/strict";
import { exportJson, sanitizeScanResult } from "../src/core/exporters.js";
import type { ScanResult } from "../src/core/scanner.js";

test("json export and api serialization omit raw secret values", () => {
  const scanResult: ScanResult = {
    generatedAt: "now",
    root: "/tmp/project",
    repositories: [],
    issues: [],
    summary: {
      totalSecrets: 1,
      productionSecrets: 0,
      duplicateSecrets: 0,
      unknownOwnership: 1,
      criticalIssues: 0,
      repositories: 0
    },
    variables: [
      {
        id: ".env:1:OPENAI_API_KEY",
        key: "OPENAI_API_KEY",
        value: "sk-raw-secret",
        line: 1,
        filePath: "/tmp/project/.env",
        relativeFilePath: ".env",
        environment: "base",
        repository: ".",
        app: "workspace",
        repositoryType: "folder",
        provider: "OpenAI",
        maskedValue: "sk-********",
        fingerprint: "hash",
        usedIn: [],
        sensitivity: "medium",
        duplicates: [],
        metadata: {}
      }
    ]
  };

  assert.equal("value" in sanitizeScanResult(scanResult).variables[0], false);
  assert.equal(exportJson(scanResult).includes("sk-raw-secret"), false);
});
