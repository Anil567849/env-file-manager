import test from "node:test";
import assert from "node:assert/strict";
import { exportJson, sanitizeScanResult } from "../src/core/exporters.js";

test("json export and api serialization omit raw secret values", () => {
  const scanResult = {
    generatedAt: "now",
    root: "/tmp/project",
    repositories: [],
    providers: [],
    issues: [],
    summary: {},
    variables: [
      {
        key: "OPENAI_API_KEY",
        value: "sk-raw-secret",
        maskedValue: "sk-********",
        metadata: {}
      }
    ]
  };

  assert.equal("value" in sanitizeScanResult(scanResult).variables[0], false);
  assert.equal(exportJson(scanResult).includes("sk-raw-secret"), false);
});
