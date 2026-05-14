import { existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function assetPath(fileName: string): string {
  const distPath = join(__dirname, fileName);
  if (existsSync(distPath)) return distPath;

  // When running from dist without copied assets, fall back to the package source files.
  return resolve(__dirname, "../../../src/ui", fileName);
}

export function renderApp(): string {
  const html = readFileSync(assetPath("index.html"), "utf-8");
  const styles = readFileSync(assetPath("styles.css"), "utf-8");
  const script = readFileSync(assetPath("script.js"), "utf-8");

  return html
    .replace('<link rel="stylesheet" href="styles.css">', `<style>\n${styles}\n</style>`)
    .replace('<script src="script.js"></script>', `<script>\n${script}\n</script>`);
}
