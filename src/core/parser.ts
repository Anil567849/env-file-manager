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
  const parsed = parseScalar(value);
  if (parsed.includes(",") && !/^https?:\/\//i.test(parsed)) {
    return parsed.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return parsed;
}

function normalizeMetadata(input = {}) {
  const metadata = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === "") continue;
    metadata[key] = value;
  }
  return metadata;
}

function parseJsonMetadata(raw) {
  try {
    return normalizeMetadata(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function parseEnvContent(content, filePath = "") {
  const lines = content.split(/\r?\n/);
  const entries = [];
  const companionMetadata = new Map();
  const sectionMetadata = new Map();
  let pendingCommentMetadata = {};
  let activeSectionKey = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      activeSectionKey = null;
      continue;
    }

    const metadataComment = trimmed.match(/^#\s*@([A-Za-z][A-Za-z0-9_-]*)\s+(.+)$/);
    if (metadataComment) {
      pendingCommentMetadata[metadataComment[1]] = coerceMetadataValue(metadataComment[2]);
      continue;
    }

    if (trimmed.startsWith("#")) continue;

    const section = trimmed.match(/^\[([A-Za-z_][A-Za-z0-9_.-]*)\]$/);
    if (section) {
      activeSectionKey = section[1];
      if (!sectionMetadata.has(activeSectionKey)) sectionMetadata.set(activeSectionKey, {});
      continue;
    }

    const assignment = parseAssignment(line);
    if (!assignment) continue;

    if (activeSectionKey) {
      sectionMetadata.get(activeSectionKey)[assignment.key] = coerceMetadataValue(assignment.rawValue);
      continue;
    }

    if (assignment.key.endsWith("__META")) {
      const baseKey = assignment.key.slice(0, -"__META".length);
      let rawMeta = assignment.rawValue.trim();
      while (rawMeta.startsWith("{") && !rawMeta.endsWith("}") && index + 1 < lines.length) {
        index += 1;
        rawMeta += `\n${lines[index]}`;
      }
      companionMetadata.set(baseKey, parseJsonMetadata(rawMeta));
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

  return entries.map((entry) => ({
    ...entry,
    metadata: normalizeMetadata({
      ...entry.metadata,
      ...(companionMetadata.get(entry.key) ?? {}),
      ...(sectionMetadata.get(entry.key) ?? {})
    })
  }));
}
