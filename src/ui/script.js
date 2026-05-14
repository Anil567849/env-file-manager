const state = {
  scan: null,
  app: "",
  environment: "",
  provider: "",
  query: "",
  revealed: new Map(),
  loading: false
};

const envAliases = {
  base: "base",
  development: "dev",
  dev: "dev",
  staging: "staging",
  production: "prod",
  prod: "prod",
  local: "local",
  test: "test",
  example: "example",
  backup: "backup"
};

const envOrder = ["", "local", "dev", "staging", "prod", "test", "example", "base", "backup"];

const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
}[char]));

function envLabel(environment) {
  if (!environment) return "All envs";
  return envAliases[environment] || environment;
}

function normalizedEnv(environment) {
  return envAliases[environment] || environment || "";
}

function variables() {
  return state.scan ? state.scan.variables : [];
}

function matchesFilters(variable, overrides = {}) {
  const query = state.query.trim().toLowerCase();
  const app = Object.hasOwn(overrides, "app") ? overrides.app : state.app;
  const environment = Object.hasOwn(overrides, "environment") ? overrides.environment : state.environment;
  const metadataText = JSON.stringify(variable.metadata || {});
  const haystack = [
    variable.key,
    variable.maskedValue,
    variable.provider,
    variable.app,
    variable.environment,
    variable.relativeFilePath,
    metadataText
  ].join(" ").toLowerCase();

  return (!app || variable.app === app)
    && (!environment || normalizedEnv(variable.environment) === environment)
    && (!state.provider || variable.provider === state.provider)
    && (!query || haystack.includes(query));
}

function filteredVariables() {
  return variables().filter((variable) => matchesFilters(variable));
}

function countByApp() {
  const counts = new Map();
  for (const variable of variables().filter((item) => matchesFilters(item, { app: "" }))) {
    counts.set(variable.app, (counts.get(variable.app) || 0) + 1);
  }
  return counts;
}

function countByEnv() {
  const counts = new Map();
  for (const variable of variables().filter((item) => matchesFilters(item, { environment: "" }))) {
    const env = normalizedEnv(variable.environment);
    counts.set(env, (counts.get(env) || 0) + 1);
  }
  return counts;
}

function renderApps() {
  const counts = countByApp();
  const apps = Array.from(counts.keys()).sort();
  const total = variables().filter((variable) => matchesFilters(variable, { app: "" })).length;
  const items = [["", "All apps", total], ...apps.map((app) => [app, app, counts.get(app)])];

  $("appNav").innerHTML = items.map(([value, label, count]) =>
    '<button class="nav-button ' + (state.app === value ? "active" : "") + '" data-app="' + escapeHtml(value) + '">' +
      '<span>' + escapeHtml(label) + '</span><span class="count">' + count + '</span>' +
    '</button>'
  ).join("");

  document.querySelectorAll("[data-app]").forEach((button) => {
    button.addEventListener("click", () => {
      state.app = button.dataset.app;
      render();
    });
  });
}

function renderEnvs() {
  const counts = countByEnv();
  const envs = Array.from(counts.keys()).sort((a, b) => {
    const left = envOrder.indexOf(a);
    const right = envOrder.indexOf(b);
    return (left === -1 ? 99 : left) - (right === -1 ? 99 : right) || a.localeCompare(b);
  });
  const total = variables().filter((variable) => matchesFilters(variable, { environment: "" })).length;
  const items = [["", "All envs", total], ...envs.map((env) => [env, envLabel(env), counts.get(env)])];

  $("envTabs").innerHTML = items.map(([value, label, count]) =>
    '<button class="env-tab ' + (state.environment === value ? "active" : "") + '" data-env="' + escapeHtml(value) + '">' +
      escapeHtml(label) + ' <span class="count">' + count + '</span>' +
    '</button>'
  ).join("");

  document.querySelectorAll("[data-env]").forEach((button) => {
    button.addEventListener("click", () => {
      state.environment = button.dataset.env;
      render();
    });
  });
}

function renderProviderFilter() {
  const providers = Array.from(new Set(variables().map((variable) => variable.provider).filter(Boolean))).sort();
  $("providerFilter").innerHTML = '<option value="">All providers</option>' + providers.map((provider) =>
    '<option value="' + escapeHtml(provider) + '"' + (state.provider === provider ? " selected" : "") + '>' + escapeHtml(provider) + '</option>'
  ).join("");
}

function isUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

function displayValue(value) {
  return value === "" ? "NULL" : value;
}

function metadataLines(variable) {
  const metadata = variable.metadata || {};
  const fixed = [
    ["file", variable.relativeFilePath]
  ];

  const entries = Object.entries({
    ...Object.fromEntries(fixed),
    ...metadata
  });

  return entries
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => {
      const display = Array.isArray(value) ? value.join(", ") : value;
      if (isUrl(display)) {
        return '<div class="meta-line"><strong>' + escapeHtml(key) + ':</strong> ' +
          '<a href="' + escapeHtml(display) + '" target="_blank" rel="noreferrer">click here</a></div>';
      }
      return '<div class="meta-line"><strong>' + escapeHtml(key) + ':</strong> ' + escapeHtml(display) + '</div>';
    })
    .join("");
}

function renderTable() {
  const rows = filteredVariables();
  $("visibleCount").textContent = String(rows.length);
  $("selectedApp").textContent = state.app || "All";
  $("selectedEnv").textContent = envLabel(state.environment);
  $("providerCount").textContent = String(new Set(rows.map((variable) => variable.provider).filter(Boolean)).size);
  $("pageTitle").textContent = state.app ? state.app : "All apps";
  $("pageSubtitle").textContent = envLabel(state.environment) + " environment variables";

  if (!rows.length) {
    $("tableWrap").innerHTML = '<div class="empty">No env variables match this filter.</div>';
    return;
  }

  $("tableWrap").innerHTML =
    '<table><thead><tr><th>Key</th><th>Value</th><th>Env</th><th>Metadata</th><th></th></tr></thead><tbody>' +
    rows.map((variable) => {
      const visibleValue = state.revealed.has(variable.id) ? state.revealed.get(variable.id) : variable.maskedValue;
      return '<tr>' +
        '<td><code class="key-cell">' + escapeHtml(variable.key) + '</code></td>' +
        '<td class="value-cell"><code>' + escapeHtml(displayValue(visibleValue)) + '</code></td>' +
        '<td><span class="badge">' + escapeHtml(envLabel(variable.environment)) + '</span></td>' +
        '<td><div class="meta">' + metadataLines(variable) + '</div></td>' +
        '<td><div class="actions">' +
          '<button class="small-button" data-reveal="' + escapeHtml(variable.id) + '">' + (state.revealed.has(variable.id) ? "Hide" : "Show") + '</button>' +
          '<button class="small-button" data-copy="' + escapeHtml(variable.id) + '">Copy</button>' +
        '</div></td>' +
      '</tr>';
    }).join("") +
    '</tbody></table>';

  bindActions();
}

function bindActions() {
  document.querySelectorAll("[data-reveal]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.reveal;
      if (state.revealed.has(id)) {
        state.revealed.delete(id);
      } else {
        const response = await fetch("/api/reveal", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id })
        });
        const payload = await response.json();
        state.revealed.set(id, payload.value || "");
      }
      renderTable();
    });
  });

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.copy;
      let value = state.revealed.get(id);
      if (!value) {
        const response = await fetch("/api/reveal", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id })
        });
        value = (await response.json()).value || "";
      }
      await navigator.clipboard.writeText(value);
      $("tableHint").textContent = "Copied value locally.";
      setTimeout(() => $("tableHint").textContent = "Masked values stay local.", 900);
    });
  });
}

function render() {
  if (!state.scan) return;
  $("rootPath").textContent = state.scan.root;
  renderApps();
  renderEnvs();
  renderProviderFilter();
  renderTable();
}

async function loadScan() {
  if (state.loading) return;
  state.loading = true;
  $("tableHint").textContent = "Scanning workspace...";
  try {
    const response = await fetch("/api/scan");
    state.scan = await response.json();
    render();
    $("tableHint").textContent = "Masked values stay local.";
  } catch (error) {
    $("tableHint").textContent = "Scan failed. Try refresh.";
  } finally {
    state.loading = false;
  }
}

$("searchInput").addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

$("providerFilter").addEventListener("change", (event) => {
  state.provider = event.target.value;
  render();
});

$("refreshButton").addEventListener("click", () => loadScan());

loadScan();
