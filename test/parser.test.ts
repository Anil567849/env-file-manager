import test from "node:test";
import assert from "node:assert/strict";
import { parseEnvContent } from "../src/core/parser.js";

test("parses env values and comment metadata", () => {
  const entries = parseEnvContent(`
# @provider OpenAI
# @owner anil@example.com
OPENAI_API_KEY=sk-test-value
PUBLIC_URL="https://example.com#anchor"
`, ".env");

  assert.equal(entries.length, 2);
  assert.equal(entries[0].key, "OPENAI_API_KEY");
  assert.equal(entries[0].metadata.provider, "OpenAI");
  assert.equal(entries[0].metadata.owner, "anil@example.com");
  assert.equal(entries[1].value, "https://example.com#anchor");
});

test("merges companion and section metadata", () => {
  const entries = parseEnvContent(`
STRIPE_SECRET_KEY=sk_live_123
STRIPE_SECRET_KEY__META={"provider":"Stripe","owner":"billing@example.com"}

[STRIPE_SECRET_KEY]
dashboard=https://dashboard.stripe.com/apikeys
tags=billing, payments
`, ".env.production");

  assert.equal(entries.length, 1);
  assert.equal(entries[0].metadata.provider, "Stripe");
  assert.equal(entries[0].metadata.owner, "billing@example.com");
  assert.equal(entries[0].metadata.dashboard, "https://dashboard.stripe.com/apikeys");
  assert.deepEqual(entries[0].metadata.tags, ["billing", "payments"]);
});
