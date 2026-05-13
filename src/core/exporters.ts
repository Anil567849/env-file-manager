function csvEscape(value) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) return `"${stringValue.replaceAll('"', '""')}"`;
  return stringValue;
}

export function exportJson(scanResult) {
  return `${JSON.stringify(sanitizeScanResult(scanResult), null, 2)}\n`;
}

export function exportCsv(scanResult) {
  const rows = [
    ["key", "maskedValue", "provider", "environment", "owner", "repository", "app", "sourceFile", "sensitivity"]
  ];
  for (const variable of scanResult.variables) {
    rows.push([
      variable.key,
      variable.maskedValue,
      variable.provider ?? "Unknown",
      variable.environment,
      variable.metadata.owner ?? "",
      variable.repository,
      variable.app,
      variable.relativeFilePath,
      variable.sensitivity
    ]);
  }
  return `${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`;
}

export function exportMarkdown(scanResult) {
  const lines = [
    "# Env Manager Scan",
    "",
    `Generated: ${scanResult.generatedAt}`,
    `Root: ${scanResult.root}`,
    "",
    "## Summary",
    "",
    `- Total secrets: ${scanResult.summary.totalSecrets}`,
    `- Production secrets: ${scanResult.summary.productionSecrets}`,
    `- Duplicate secret groups: ${scanResult.summary.duplicateSecrets}`,
    `- Unknown ownership: ${scanResult.summary.unknownOwnership}`,
    `- Critical issues: ${scanResult.summary.criticalIssues}`,
    "",
    "## Secrets",
    "",
    "| Key | Value | Provider | Environment | Owner | Source |",
    "| --- | --- | --- | --- | --- | --- |"
  ];

  for (const variable of scanResult.variables) {
    lines.push(
      `| ${variable.key} | ${variable.maskedValue} | ${variable.provider ?? "Unknown"} | ${variable.environment} | ${variable.metadata.owner ?? ""} | ${variable.relativeFilePath} |`
    );
  }

  lines.push("", "## Issues", "");
  if (!scanResult.issues.length) {
    lines.push("No issues found.");
  } else {
    for (const issue of scanResult.issues) {
      lines.push(`- **${issue.severity}** ${issue.title}: ${issue.message}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export function exportScan(scanResult, format = "json") {
  if (format === "csv") return exportCsv(scanResult);
  if (format === "md" || format === "markdown") return exportMarkdown(scanResult);
  return exportJson(scanResult);
}

export function sanitizeScanResult(scanResult) {
  return {
    ...scanResult,
    variables: scanResult.variables.map(({ value, ...variable }) => variable)
  };
}
