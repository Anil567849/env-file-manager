import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { scanWorkspace } from "../src/core/scanner.js";

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "env-file-manager-"));
  await fs.mkdir(path.join(root, "apps", "web"), { recursive: true });
  await fs.writeFile(path.join(root, "package.json"), JSON.stringify({ workspaces: ["apps/*"] }), "utf8");
  await fs.writeFile(path.join(root, ".gitignore"), ".env\n.env.*\n!.env.example\n", "utf8");
  await fs.writeFile(path.join(root, "apps", "web", ".env.example"), "OPENAI_API_KEY=\nDATABASE_URL=\n", "utf8");
  await fs.writeFile(path.join(root, "apps", "web", ".env.local"), [
    "# @owner founder@example.com",
    "# @provider OpenAI",
    "OPENAI_API_KEY=sk-test-value-1234567890",
    "STRIPE_SECRET_KEY=sk_live_duplicate_value",
    "STRIPE_ALT_KEY=sk_live_duplicate_value"
  ].join("\n"), "utf8");
  await fs.writeFile(path.join(root, "apps", "web", "index.ts"), "console.log(process.env.OPENAI_API_KEY)", "utf8");
  return root;
}

test("scans monorepo env files and builds analysis", async () => {
  const root = await fixture();
  const result = await scanWorkspace({ root });

  assert.equal(result.summary.totalSecrets, 5);
  assert.equal(result.repositories[0].type, "package");
  assert.ok(result.variables.some((variable) => variable.app === "apps/web"));
  assert.ok(result.variables.some((variable) => variable.provider === "OpenAI"));
  assert.equal(result.variables.find((variable) => variable.key === "STRIPE_SECRET_KEY")?.provider, undefined);
  assert.ok(result.variables.find((variable) => variable.key === "OPENAI_API_KEY").usedIn.includes("apps/web/index.ts"));
  assert.ok(result.issues.some((issue) => issue.type === "duplicate-secret"));
  assert.ok(result.issues.some((issue) => issue.type === "missing-variable"));
});
