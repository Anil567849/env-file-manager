import { createHash } from "node:crypto";

const SENSITIVE_KEYWORDS = [
  "SECRET",
  "TOKEN",
  "PASSWORD",
  "PRIVATE",
  "KEY",
  "CREDENTIAL",
  "AUTH",
  "ACCESS"
];

export function fingerprint(value) {
  return createHash("sha256").update(value ?? "").digest("hex");
}

export function maskValue(value = "") {
  if (!value) return "";
  if (value.length <= 6) return "*".repeat(value.length);
  const prefix = value.slice(0, Math.min(4, value.length));
  const suffix = value.length > 16 ? value.slice(-4) : "";
  return `${prefix}${"*".repeat(Math.min(28, Math.max(8, value.length - prefix.length - suffix.length)))}${suffix}`;
}

export function estimateEntropy(value = "") {
  if (!value) return 0;
  const frequencies = new Map();
  for (const char of value) frequencies.set(char, (frequencies.get(char) ?? 0) + 1);
  let entropy = 0;
  for (const count of frequencies.values()) {
    const probability = count / value.length;
    entropy -= probability * Math.log2(probability);
  }
  return Number(entropy.toFixed(2));
}

export function classifySensitivity(variable) {
  const key = variable.key.toUpperCase();
  const value = variable.value ?? "";
  const environment = variable.environment?.toLowerCase() ?? "";
  const entropy = estimateEntropy(value);
  const hasSensitiveName = SENSITIVE_KEYWORDS.some((keyword) => key.includes(keyword));
  const looksProduction = environment === "production" || /PROD|LIVE/.test(key) || /sk_live_/i.test(value);
  const isPublic = key.includes("PUBLIC") || key.startsWith("NEXT_PUBLIC_") || key.startsWith("VITE_");

  if ((looksProduction && hasSensitiveName) || /^AKIA[0-9A-Z]{16}$/.test(value)) return "critical";
  if (hasSensitiveName || entropy >= 4.2) return isPublic ? "low" : "medium";
  return "low";
}
