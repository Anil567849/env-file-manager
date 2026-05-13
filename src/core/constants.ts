export const DEFAULT_ENV_FILENAMES = new Set([
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".env.staging",
  ".env.test",
  ".env.example",
  ".env.backup"
]);

export const IGNORE_DIRECTORIES = new Set([
  ".git",
  ".hg",
  ".svn",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".nuxt",
  ".turbo",
  ".cache",
  "coverage",
  "out",
  "target",
  "vendor"
]);

export const REPOSITORY_MARKERS = new Set([
  ".git",
  "package.json",
  "turbo.json",
  "nx.json",
  "pnpm-workspace.yaml",
  "yarn.lock"
]);

export const CODE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".vue",
  ".svelte",
  ".astro",
  ".go",
  ".rs",
  ".py",
  ".rb",
  ".php",
  ".java",
  ".cs"
]);
