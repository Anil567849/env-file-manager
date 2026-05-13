import { promises as fs } from "node:fs";
import path from "node:path";
import { CODE_EXTENSIONS, DEFAULT_ENV_FILENAMES, IGNORE_DIRECTORIES, REPOSITORY_MARKERS } from "./constants.js";
import { parseEnvContent } from "./parser.js";
import { getProvider } from "./providers.js";
import { classifySensitivity, fingerprint, maskValue } from "./security.js";

type SecretMetadata = Record<string, string | string[]>;

type ParsedVariable = {
  id: string;
  key: string;
  value: string;
  line: number;
  filePath: string;
  relativeFilePath: string;
  environment: string;
  repository: string;
  app: string;
  repositoryType: string;
  metadata: SecretMetadata;
};

type EnvVariable = ParsedVariable & {
  provider?: string;
  maskedValue: string;
  fingerprint: string;
  usedIn: string[];
  sensitivity: string;
  duplicates: Array<{ key: string; filePath: string; environment: string }>;
};

type Repository = {
  name: string;
  path: string;
  relativePath: string;
  type: string;
};

type Issue = {
  id: string;
  severity: "critical" | "warning" | "info";
  type: string;
  title: string;
  message: string;
  filePath: string;
  key?: string;
};

type ScanOptions = {
  root?: string;
  patterns?: string[];
  includeUsage?: boolean;
};

function metadataString(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.join(", ");
  return value;
}

function isEnvFile(fileName: string) {
  return DEFAULT_ENV_FILENAMES.has(fileName) || /^\.env\.[A-Za-z0-9_-]+$/.test(fileName);
}

function environmentFromFile(fileName) {
  if (fileName === ".env") return "base";
  return fileName.replace(/^\.env\.?/, "") || "base";
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function discoverEnvFiles(root: string, customPatterns: string[] = []) {
  const results: string[] = [];
  const customMatchers = customPatterns.map((pattern) => new RegExp(pattern));

  async function walk(directory) {
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORE_DIRECTORIES.has(entry.name)) await walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (isEnvFile(entry.name) || customMatchers.some((matcher) => matcher.test(entry.name))) {
        results.push(fullPath);
      }
    }
  }

  await walk(root);
  return results.sort();
}

async function findRepositoryRoot(filePath, workspaceRoot) {
  let directory = path.dirname(filePath);
  while (directory.startsWith(workspaceRoot)) {
    for (const marker of REPOSITORY_MARKERS) {
      if (await pathExists(path.join(directory, marker))) return directory;
    }
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  return workspaceRoot;
}

function appFromPath(filePath, workspaceRoot) {
  const relativeDirectory = path.relative(workspaceRoot, path.dirname(filePath));
  if (!relativeDirectory) return "workspace";
  const parts = relativeDirectory.split(path.sep).filter(Boolean);
  const groupIndex = parts.findIndex((part) => ["apps", "packages", "services"].includes(part));
  if (groupIndex >= 0 && parts[groupIndex + 1]) return `${parts[groupIndex]}/${parts[groupIndex + 1]}`;
  return parts.slice(0, 2).join("/") || "workspace";
}

async function discoverRepositories(root) {
  const repositories = new Map();

  async function walk(directory) {
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    const markerNames = new Set(entries.map((entry) => entry.name));
    if ([...REPOSITORY_MARKERS].some((marker) => markerNames.has(marker))) {
      const relative = path.relative(root, directory);
      repositories.set(directory, {
        name: relative || path.basename(root),
        path: directory,
        relativePath: relative || ".",
        type: markerNames.has("turbo.json")
          ? "turborepo"
          : markerNames.has("nx.json")
            ? "nx"
            : markerNames.has("pnpm-workspace.yaml")
              ? "pnpm-workspace"
              : markerNames.has(".git")
                ? "git"
                : "package"
      });
    }

    for (const entry of entries) {
      if (entry.isDirectory() && !IGNORE_DIRECTORIES.has(entry.name)) {
        await walk(path.join(directory, entry.name));
      }
    }
  }

  await walk(root);
  if (!repositories.size) {
    repositories.set(root, {
      name: path.basename(root),
      path: root,
      relativePath: ".",
      type: "folder"
    });
  }
  return [...repositories.values()].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

async function buildUsageIndex(root: string, keys: string[]) {
  const usage = new Map<string, string[]>(keys.map((key) => [key, []]));
  if (!keys.length) return usage;
  const keySet = new Set(keys);

  async function walk(directory) {
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORE_DIRECTORIES.has(entry.name)) await walk(fullPath);
        continue;
      }
      if (!entry.isFile() || !CODE_EXTENSIONS.has(path.extname(entry.name))) continue;

      let content;
      try {
        content = await fs.readFile(fullPath, "utf8");
      } catch {
        continue;
      }
      for (const key of keySet) {
        if (content.includes(`process.env.${key}`) || content.includes(`import.meta.env.${key}`) || content.includes(`process.env["${key}"]`) || content.includes(`process.env['${key}']`)) {
          usage.get(key)?.push(path.relative(root, fullPath));
        }
      }
    }
  }

  await walk(root);
  return usage;
}

function summarize(variables: EnvVariable[], repositories: Repository[], issues: Issue[]) {
  const productionSecrets = variables.filter((variable) => variable.environment === "production").length;
  const duplicateFingerprints = new Set(
    variables
      .filter((variable) => variable.duplicates.length)
      .map((variable) => variable.fingerprint)
  );
  const providerCounts = new Map();
  for (const variable of variables) {
    if (!variable.provider) continue;
    providerCounts.set(variable.provider, (providerCounts.get(variable.provider) ?? 0) + 1);
  }
  const mostUsedProvider = [...providerCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None";

  return {
    totalSecrets: variables.length,
    productionSecrets,
    duplicateSecrets: duplicateFingerprints.size,
    unknownOwnership: variables.filter((variable) => !variable.metadata.owner).length,
    criticalIssues: issues.filter((issue) => issue.severity === "critical").length,
    repositories: repositories.length,
    mostUsedProvider
  };
}

function buildProviderCards(variables: EnvVariable[]) {
  const grouped = new Map();
  for (const variable of variables) {
    const name = variable.provider;
    if (!name) continue;
    if (!grouped.has(name)) {
      const registry = getProvider(name);
      grouped.set(name, {
        name,
        dashboard: registry?.dashboard,
        docs: registry?.docs,
        usageCount: 0,
        environments: new Set(),
        owners: new Set()
      });
    }
    const card = grouped.get(name);
    card.usageCount += 1;
    card.environments.add(variable.environment);
    if (variable.metadata.owner) card.owners.add(variable.metadata.owner);
  }
  return [...grouped.values()].map((card) => ({
    ...card,
    environments: [...card.environments].sort(),
    owners: [...card.owners].sort()
  }));
}

function buildDuplicates(variables: EnvVariable[]) {
  const byFingerprint = new Map<string, EnvVariable[]>();
  for (const variable of variables) {
    if (!variable.value) continue;
    const entries = byFingerprint.get(variable.fingerprint) ?? [];
    entries.push(variable);
    byFingerprint.set(variable.fingerprint, entries);
  }
  return byFingerprint;
}

async function readGitignore(root) {
  try {
    return await fs.readFile(path.join(root, ".gitignore"), "utf8");
  } catch {
    return "";
  }
}

function isEnvIgnored(fileRelativePath, gitignore) {
  const normalized = fileRelativePath.replaceAll(path.sep, "/");
  return gitignore
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .some((pattern) => {
      if (pattern === ".env" && normalized.endsWith(".env")) return true;
      if (pattern === ".env.*" && normalized.includes(".env.")) return true;
      if (pattern === "*.env" && normalized.endsWith(".env")) return true;
      return normalized === pattern.replace(/^\//, "");
    });
}

function buildIssues(variables: EnvVariable[], duplicates: Map<string, EnvVariable[]>, gitignore: string) {
  const issues: Issue[] = [];
  const byApp = new Map();

  for (const variable of variables) {
    const duplicateGroup = duplicates.get(variable.fingerprint) ?? [];
    if (duplicateGroup.length > 1) {
      issues.push({
        id: `duplicate:${variable.id}`,
        severity: "warning",
        type: "duplicate-secret",
        title: "Duplicate secret value",
        message: `${variable.key} shares a value with ${duplicateGroup.length - 1} other variable(s).`,
        filePath: variable.filePath,
        key: variable.key
      });
    }

    if (variable.sensitivity === "critical" && !variable.metadata.owner) {
      issues.push({
        id: `owner:${variable.id}`,
        severity: "critical",
        type: "missing-owner",
        title: "Critical secret has no owner",
        message: `${variable.key} should have @owner metadata.`,
        filePath: variable.filePath,
        key: variable.key
      });
    }

    if (/URL$/i.test(variable.key)) {
      try {
        new URL(variable.value);
      } catch {
        issues.push({
          id: `url:${variable.id}`,
          severity: "warning",
          type: "invalid-url",
          title: "Malformed URL value",
          message: `${variable.key} is named like a URL but is not a valid URL.`,
          filePath: variable.filePath,
          key: variable.key
        });
      }
    }

    if (["local", "development"].includes(variable.environment) && /sk_live_|prod/i.test(variable.value)) {
      issues.push({
        id: `prod-local:${variable.id}`,
        severity: "critical",
        type: "production-in-local",
        title: "Production-looking secret in local environment",
        message: `${variable.key} appears to contain a production credential in ${variable.environment}.`,
        filePath: variable.filePath,
        key: variable.key
      });
    }

    if (!variable.usedIn.length && variable.environment !== "example") {
      issues.push({
        id: `unused:${variable.id}`,
        severity: "info",
        type: "unused-secret",
        title: "No code usage found",
        message: `${variable.key} was not referenced through process.env or import.meta.env.`,
        filePath: variable.filePath,
        key: variable.key
      });
    }

    if (!isEnvIgnored(variable.relativeFilePath, gitignore) && variable.environment !== "example") {
      issues.push({
        id: `gitignore:${variable.id}`,
        severity: "warning",
        type: "gitignore",
        title: "Env file may not be ignored",
        message: `${variable.relativeFilePath} is not covered by a simple .gitignore env rule.`,
        filePath: variable.filePath,
        key: variable.key
      });
    }

    const appKey = `${variable.repository}::${variable.app}`;
    if (!byApp.has(appKey)) byApp.set(appKey, { example: new Set(), actual: new Set(), sample: variable });
    const group = byApp.get(appKey);
    if (variable.environment === "example") group.example.add(variable.key);
    else group.actual.add(variable.key);
  }

  for (const group of byApp.values()) {
    for (const expectedKey of group.example) {
      if (!group.actual.has(expectedKey)) {
        issues.push({
          id: `missing:${group.sample.repository}:${group.sample.app}:${expectedKey}`,
          severity: "warning",
          type: "missing-variable",
          title: "Variable exists in example but not in env files",
          message: `${expectedKey} appears in .env.example but not in concrete env files for ${group.sample.app}.`,
          filePath: group.sample.filePath,
          key: expectedKey
        });
      }
    }
  }

  return issues;
}

export async function scanWorkspace(options: ScanOptions = {}) {
  const root = path.resolve(options.root ?? process.cwd());
  const envFiles = await discoverEnvFiles(root, options.patterns ?? []);
  const repositories = await discoverRepositories(root);
  const parsed: ParsedVariable[] = [];

  for (const filePath of envFiles) {
    const content = await fs.readFile(filePath, "utf8");
    const repositoryRoot = await findRepositoryRoot(filePath, root);
    const repository = repositories.find((entry) => entry.path === repositoryRoot) ?? repositories[0];
    const environment = environmentFromFile(path.basename(filePath));
    const app = appFromPath(filePath, root);
    for (const entry of parseEnvContent(content, filePath)) {
      parsed.push({
        ...entry,
        id: `${path.relative(root, filePath)}:${entry.line}:${entry.key}`,
        relativeFilePath: path.relative(root, filePath),
      environment: String(entry.metadata.environment ?? environment),
        repository: repository?.relativePath ?? ".",
        app,
        repositoryType: repository?.type ?? "folder"
      });
    }
  }

  const usageIndex = options.includeUsage === false
      ? new Map<string, string[]>(parsed.map((entry) => [entry.key, []]))
    : await buildUsageIndex(root, [...new Set(parsed.map((entry) => entry.key))]);

  let variables: EnvVariable[] = parsed.map((entry) => {
    const provider = metadataString(entry.metadata.provider);
    const base = {
      ...entry,
      provider,
      maskedValue: maskValue(entry.value),
      fingerprint: fingerprint(entry.value),
      usedIn: usageIndex.get(entry.key) ?? []
    };
    return {
      ...base,
      sensitivity: classifySensitivity(base),
      duplicates: []
    };
  });

  const duplicates = buildDuplicates(variables);
  variables = variables.map((variable) => {
    const group = duplicates.get(variable.fingerprint) ?? [];
    return {
      ...variable,
      duplicates: group
        .filter((entry) => entry.id !== variable.id)
        .map((entry) => ({ key: entry.key, filePath: entry.relativeFilePath, environment: entry.environment }))
    };
  });

  const gitignore = await readGitignore(root);
  const issues = buildIssues(variables, duplicates, gitignore);

  return {
    generatedAt: new Date().toISOString(),
    root,
    repositories,
    variables,
    providers: buildProviderCards(variables),
    issues,
    summary: summarize(variables, repositories, issues)
  };
}
