function parseScalar(raw = "") {
  let value = raw.trim();
  const commentIndex = findUnquotedComment(value);
  if (commentIndex >= 0) value = value.slice(0, commentIndex).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return value
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'");
}

function findUnquotedComment(value) {
  let quote = null;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if ((char === '"' || char === "'") && value[index - 1] !== "\\") {
      quote = quote === char ? null : quote ?? char;
    }
    if (!quote && char === "#" && /\s/.test(value[index - 1] ?? " ")) return index;
  }
  return -1;
}

function parseAssignment(line) {
  const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/);
  if (!match) return undefined;
  return { key: match[1], rawValue: match[2] ?? "" };
}

function coerceMetadataValue(value) {
  return parseScalar(value);
}

function normalizeMetadata(input = {}) {
  const metadata = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === "") continue;
    metadata[key] = value;
  }
  return metadata;
}

export function parseEnvContent(content, filePath = "") {
  const lines = content.split(/\r?\n/);
  const entries = [];
  let pendingCommentMetadata = {};
  let ignoredSection = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      pendingCommentMetadata = {};
      ignoredSection = false;
      continue;
    }

    const metadataComment = trimmed.match(/^#\s*@([A-Za-z][A-Za-z0-9_-]*)\s+(.+)$/);
    if (metadataComment) {
      const key = metadataComment[1];
      pendingCommentMetadata[key] = coerceMetadataValue(metadataComment[2]);
      continue;
    }

    if (trimmed.startsWith("#")) {
      pendingCommentMetadata = {};
      continue;
    }

    if (/^\[[A-Za-z_][A-Za-z0-9_.-]*\]$/.test(trimmed)) {
      pendingCommentMetadata = {};
      ignoredSection = true;
      continue;
    }

    if (ignoredSection) continue;

    const assignment = parseAssignment(line);
    if (!assignment) {
      pendingCommentMetadata = {};
      continue;
    }

    if (assignment.key.endsWith("__META")) {
      pendingCommentMetadata = {};
      continue;
    }

    entries.push({
      key: assignment.key,
      value: parseScalar(assignment.rawValue),
      line: index + 1,
      filePath,
      metadata: normalizeMetadata(pendingCommentMetadata)
    });
    pendingCommentMetadata = {};
  }

  return entries;
}
