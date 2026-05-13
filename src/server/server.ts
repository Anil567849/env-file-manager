import http from "node:http";
import type { AddressInfo } from "node:net";
import { promises as fs } from "node:fs";
import path from "node:path";
import { URL } from "node:url";
import { exportScan, sanitizeScanResult } from "../core/exporters.js";
import { scanWorkspace } from "../core/scanner.js";
import { renderApp } from "./ui.js";

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, status, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  response.end(body);
}

async function requestBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

export async function startServer({ root = process.cwd(), port = 4783 } = {}) {
  const host = "127.0.0.1";
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${host}:${port}`);

      if (url.pathname === "/") {
        sendText(response, 200, renderApp(), "text/html; charset=utf-8");
        return;
      }

      if (url.pathname === "/api/scan") {
        sendJson(response, 200, sanitizeScanResult(await scanWorkspace({ root })));
        return;
      }

      if (url.pathname === "/api/export") {
        const format = url.searchParams.get("format") ?? "json";
        const scanResult = await scanWorkspace({ root });
        const contentType = format === "csv"
          ? "text/csv; charset=utf-8"
          : format === "md" || format === "markdown"
            ? "text/markdown; charset=utf-8"
            : "application/json; charset=utf-8";
        sendText(response, 200, exportScan(scanResult, format), contentType);
        return;
      }

      if (url.pathname === "/api/reveal") {
        const body = JSON.parse(await requestBody(request) || "{}");
        const scanResult = await scanWorkspace({ root });
        const variable = scanResult.variables.find((entry) => entry.id === body.id);
        if (!variable) {
          sendJson(response, 404, { error: "Secret not found" });
          return;
        }
        sendJson(response, 200, { id: variable.id, value: variable.value });
        return;
      }

      if (url.pathname === "/api/open-file") {
        const body = JSON.parse(await requestBody(request) || "{}");
        const requestedPath = path.resolve(root, body.path ?? "");
        if (!requestedPath.startsWith(root)) {
          sendJson(response, 400, { error: "Path is outside the scanned root" });
          return;
        }
        await fs.access(requestedPath);
        sendJson(response, 200, { path: requestedPath });
        return;
      }

      sendJson(response, 404, { error: "Not found" });
    } catch (error) {
      sendJson(response, 500, { error: error instanceof Error ? error.message : String(error) });
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve());
  });

  const address = server.address() as AddressInfo;
  return {
    host,
    port: address.port,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}
