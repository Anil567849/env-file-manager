import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { exportScan, sanitizeScanResult } from "./core/exporters.js";
import { scanWorkspace } from "./core/scanner.js";
import type { ScanResult } from "./core/scanner.js";
import { startServer } from "./server/server.js";

function readOption(args: string[], name: string, fallback: string): string {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  const prefix = `${name}=`;
  const value = args.find((arg) => arg.startsWith(prefix));
  if (value) return value.slice(prefix.length);
  return fallback;
}

function hasFlag(args: string[], name: string): boolean {
  return args.includes(name);
}

function printHelp(): void {
  console.log(`env-file-manager 0.1

Usage:
  env-file-manager [--root <path>] [--port <port>] [--no-open]
  env-file-manager scan [--root <path>] [--format json]
  env-file-manager doctor [--root <path>]
  env-file-manager export [--root <path>] [--format json|csv|md] [--out <file>]
  env-file-manager watch [--root <path>]

Local-first by design: the UI binds to 127.0.0.1 only.`);
}

function openBrowser(url: string): void {
  const command = process.platform === "darwin"
    ? "open"
    : process.platform === "win32"
      ? "cmd"
      : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const child = spawn(command, args, { stdio: "ignore", detached: true });
  child.on("error", () => {});
  child.unref();
}

function printScanSummary(scanResult: ScanResult): void {
  console.log(JSON.stringify({
    root: scanResult.root,
    summary: scanResult.summary,
    repositories: scanResult.repositories.map((repository) => ({
      path: repository.relativePath,
      type: repository.type
    })),
    envFiles: [...new Set(scanResult.variables.map((variable) => variable.relativeFilePath))]
  }, null, 2));
}

function printDoctor(scanResult: ScanResult): void {
  const severityRank = { critical: 0, warning: 1, info: 2 };
  const issues = [...scanResult.issues].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  console.log(`Env File Manager Doctor: ${issues.length} issue(s) found`);
  for (const issue of issues) {
    console.log(`[${issue.severity}] ${issue.title}`);
    console.log(`  ${issue.message}`);
    console.log(`  ${path.relative(scanResult.root, issue.filePath)}${issue.key ? ` (${issue.key})` : ""}`);
  }
  if (issues.some((issue) => issue.severity === "critical")) process.exitCode = 2;
}

async function runWatch(root: string): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  let lastFingerprint = "";
  const run = async (): Promise<void> => {
    const scanResult = await scanWorkspace({ root });
    const fingerprint = JSON.stringify(scanResult.variables.map((variable) => [
      variable.relativeFilePath,
      variable.key,
      variable.fingerprint
    ]));
    if (fingerprint !== lastFingerprint) {
      lastFingerprint = fingerprint;
      console.clear();
      printScanSummary(scanResult);
      console.log("Watching for env changes. Press Ctrl+C to stop.");
    }
  };

  await run();
  try {
    // Native recursive watch keeps the CLI lightweight; polling is only a fallback.
    const watcher = fs.watch(root, { recursive: true });
    for await (const event of watcher) {
      if (!event.filename || !String(event.filename).includes(".env")) continue;
      clearTimeout(timer);
      timer = setTimeout(run, 100);
    }
  } catch {
    setInterval(run, 2000);
  }
}

export async function runCli(args: string[]): Promise<void> {
  const command = args[0]?.startsWith("-") ? "serve" : args[0] ?? "serve";
  const commandArgs = command === "serve" ? args : args.slice(1);
  const root = path.resolve(readOption(commandArgs, "--root", process.cwd()));

  if (hasFlag(args, "--help") || hasFlag(args, "-h")) {
    printHelp();
    return;
  }

  if (command === "scan") {
    const scanResult = await scanWorkspace({ root });
    if (readOption(commandArgs, "--format", "") === "full") console.log(JSON.stringify(sanitizeScanResult(scanResult), null, 2));
    else printScanSummary(scanResult);
    return;
  }

  if (command === "doctor") {
    printDoctor(await scanWorkspace({ root }));
    return;
  }

  if (command === "export") {
    const format = readOption(commandArgs, "--format", "json");
    const output = exportScan(await scanWorkspace({ root }), format);
    const outFile = readOption(commandArgs, "--out", "");
    if (outFile) {
      await fs.writeFile(path.resolve(outFile), output, "utf8");
      console.log(`Exported ${format} to ${path.resolve(outFile)}`);
    } else {
      process.stdout.write(output);
    }
    return;
  }

  if (command === "watch") {
    await runWatch(root);
    return;
  }

  if (command !== "serve") {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const port = Number(readOption(commandArgs, "--port", process.env.PORT ?? "4783"));
  const server = await startServer({ root, port });
  const url = `http://${server.host}:${server.port}`;
  console.log(`Env File Manager running at ${url}`);
  console.log(`Scanning ${root}`);
  if (!hasFlag(commandArgs, "--no-open")) openBrowser(url);
}
