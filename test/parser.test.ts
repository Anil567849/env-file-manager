import test from "node:test";
import assert from "node:assert/strict";
import { parseEnvContent } from "../src/core/parser.js";

test("parses env values and comment metadata", () => {
  const entries = parseEnvContent(`
# @provider OpenAI
# @owner anil@example.com
# @account founder@example.com
# @dashboard https://platform.openai.com/api-keys
# @createdAt 2026-05-13
# @rotationPolicy 90 days
OPENAI_API_KEY=sk-test-value
PUBLIC_URL="https://example.com#anchor"
`, ".env");

  assert.equal(entries.length, 2);
  assert.equal(entries[0].key, "OPENAI_API_KEY");
  assert.equal(entries[0].metadata.provider, "OpenAI");
  assert.equal(entries[0].metadata.owner, "anil@example.com");
  assert.equal(entries[0].metadata.account, "founder@example.com");
  assert.equal(entries[0].metadata.dashboard, "https://platform.openai.com/api-keys");
  assert.equal(entries[0].metadata.createdAt, "2026-05-13");
  assert.equal(entries[0].metadata.rotationPolicy, "90 days");
  assert.equal(entries[1].value, "https://example.com#anchor");
});

test("ignores unsupported companion and section metadata formats", () => {
  const entries = parseEnvContent(`
STRIPE_SECRET_KEY=sk_live_123
STRIPE_SECRET_KEY__META={"provider":"Stripe","owner":"billing@example.com"}

[STRIPE_SECRET_KEY]
dashboard=https://dashboard.stripe.com/apikeys
tags=billing, payments

# @Anil Kumar
OPENAI_API_KEY=sk-test-value
`, ".env.production");

  assert.equal(entries.length, 2);
  assert.equal(entries[0].key, "STRIPE_SECRET_KEY");
  assert.deepEqual(entries[0].metadata, {});
  assert.equal(entries[1].key, "OPENAI_API_KEY");
  assert.equal(entries[1].metadata.Anil, "Kumar");
});

test("parses arbitrary metadata comment keys", () => {
  const entries = parseEnvContent(`
# @provider CloudFlare
# @email anil.cloudflare@gmail.com
# @notes owned by infra team until migration
NEXT_PUBLIC_R2_PUBLIC_URL=https://example.r2.dev
`, ".env");

  assert.equal(entries.length, 1);
  assert.equal(entries[0].metadata.provider, "CloudFlare");
  assert.equal(entries[0].metadata.email, "anil.cloudflare@gmail.com");
  assert.equal(entries[0].metadata.notes, "owned by infra team until migration");
});
