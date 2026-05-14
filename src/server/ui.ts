export function renderApp() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Env Manager</title>
  <style>
    :root {
      color-scheme: dark;
      --background: #020617;
      --card: #09090b;
      --card-soft: #111827;
      --border: #27272a;
      --text: #fafafa;
      --muted: #a1a1aa;
      --muted-2: #71717a;
      --accent: #e5e7eb;
      --ring: #52525b;
      --danger: #f87171;
      --warning: #fbbf24;
      font-family: ui-sans-serif, "SF Pro Display", "Segoe UI", sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      background: var(--background);
      color: var(--text);
    }

    button,
    input,
    select {
      font: inherit;
    }

    button,
    select,
    input {
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--text);
      border-radius: 8px;
      outline: none;
    }

    button:focus-visible,
    select:focus-visible,
    input:focus-visible {
      border-color: var(--ring);
      box-shadow: 0 0 0 3px rgba(82, 82, 91, 0.35);
    }

    button {
      cursor: pointer;
      min-height: 36px;
      padding: 0 12px;
    }

    button:hover {
      background: var(--card-soft);
    }

    .page {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr);
    }

    .sidebar {
      border-right: 1px solid var(--border);
      background: #030712;
      padding: 20px 14px;
      overflow: auto;
    }

    .brand {
      padding: 0 6px 18px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 18px;
    }

    .brand h1 {
      font-size: 18px;
      margin: 0;
      letter-spacing: 0;
    }

    .brand p {
      color: var(--muted);
      font-size: 12px;
      margin: 6px 0 0;
      overflow-wrap: anywhere;
    }

    .side-section {
      margin-bottom: 22px;
    }

    .side-label {
      color: var(--muted-2);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
      padding: 0 6px;
      margin-bottom: 9px;
    }

    .nav-list {
      display: grid;
      gap: 6px;
    }

    .nav-button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      text-align: left;
      color: var(--muted);
      background: transparent;
      border-color: transparent;
      padding: 9px 10px;
      min-width: 0;
    }

    .nav-button span:first-child {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .nav-button.active {
      color: var(--text);
      background: var(--card-soft);
      border-color: var(--border);
    }

    .count {
      min-width: 26px;
      height: 22px;
      border-radius: 999px;
      display: inline-grid;
      place-items: center;
      font-size: 12px;
      background: var(--card);
      color: var(--muted);
      border: 1px solid var(--border);
    }

    .main {
      min-width: 0;
      display: grid;
      grid-template-rows: auto auto 1fr;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 18px 22px;
      border-bottom: 1px solid var(--border);
      background: rgba(2, 6, 23, 0.86);
      position: sticky;
      top: 0;
      z-index: 3;
      backdrop-filter: blur(12px);
    }

    .title h2 {
      font-size: 20px;
      margin: 0;
      letter-spacing: 0;
    }

    .title p {
      margin: 5px 0 0;
      color: var(--muted);
      font-size: 13px;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .search {
      width: min(360px, 42vw);
      height: 38px;
      padding: 0 12px;
    }

    .select {
      height: 38px;
      padding: 0 10px;
      max-width: 180px;
    }

    .env-tabs {
      display: flex;
      gap: 8px;
      padding: 14px 22px;
      border-bottom: 1px solid var(--border);
      overflow-x: auto;
    }

    .env-tab {
      white-space: nowrap;
      color: var(--muted);
      background: var(--card);
    }

    .env-tab.active {
      color: var(--background);
      background: var(--accent);
      border-color: var(--accent);
    }

    .content {
      padding: 22px;
      overflow: auto;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }

    .metric {
      border: 1px solid var(--border);
      background: var(--card);
      border-radius: 8px;
      padding: 14px;
      min-width: 0;
    }

    .metric span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 8px;
    }

    .metric strong {
      display: block;
      font-size: 24px;
      overflow-wrap: anywhere;
    }

    .table-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--card);
      overflow: hidden;
    }

    .table-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
    }

    .table-head strong {
      font-size: 14px;
    }

    .table-head span {
      color: var(--muted);
      font-size: 12px;
    }

    .table-wrap {
      overflow: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 820px;
    }

    th,
    td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      text-align: left;
      vertical-align: top;
      font-size: 13px;
    }

    th {
      color: var(--muted);
      font-size: 12px;
      font-weight: 600;
      background: #0b1120;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    tr:last-child td {
      border-bottom: 0;
    }

    code {
      font-family: "SFMono-Regular", Consolas, monospace;
      font-size: 12px;
    }

    .key-cell {
      color: var(--text);
      font-weight: 600;
    }

    .value-cell {
      max-width: 280px;
      overflow-wrap: anywhere;
      color: #d4d4d8;
    }

    .meta {
      display: grid;
      gap: 6px;
      min-width: 260px;
      max-width: 420px;
    }

    .meta-line {
      color: var(--muted);
      line-height: 1.45;
      overflow-wrap: anywhere;
    }

    .meta-line strong {
      color: var(--text);
      font-weight: 600;
    }

    .meta-line a {
      color: #93c5fd;
      text-decoration: none;
    }

    .meta-line a:hover {
      text-decoration: underline;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 3px 8px;
      background: #0b1120;
      color: var(--muted);
      max-width: 240px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actions {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }

    .small-button {
      min-height: 30px;
      padding: 0 9px;
      color: var(--muted);
    }

    .empty {
      color: var(--muted);
      text-align: center;
      padding: 48px 16px;
    }

    @media (max-width: 940px) {
      .page {
        grid-template-columns: 1fr;
      }

      .sidebar {
        border-right: 0;
        border-bottom: 1px solid var(--border);
      }

      .nav-list {
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      }

      .topbar {
        align-items: flex-start;
        flex-direction: column;
      }

      .toolbar {
        width: 100%;
        justify-content: flex-start;
      }

      .search {
        width: 100%;
      }

      .summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 560px) {
      .topbar,
      .content,
      .env-tabs {
        padding-left: 14px;
        padding-right: 14px;
      }

      .summary {
        grid-template-columns: 1fr;
      }

      .select {
        max-width: none;
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <aside class="sidebar">
      <div class="brand">
        <h1>Env Manager</h1>
        <p id="rootPath">Loading workspace</p>
      </div>

      <section class="side-section">
        <div class="side-label">Apps</div>
        <div class="nav-list" id="appNav"></div>
      </section>
    </aside>

    <main class="main">
      <header class="topbar">
        <div class="title">
          <h2 id="pageTitle">Secrets</h2>
          <p id="pageSubtitle">Browse env keys by app and environment.</p>
        </div>
        <div class="toolbar">
          <input class="search" id="searchInput" placeholder="Search key, value, metadata">
          <select class="select" id="providerFilter">
            <option value="">All providers</option>
          </select>
          <button id="refreshButton">Refresh</button>
        </div>
      </header>

      <nav class="env-tabs" id="envTabs"></nav>

      <section class="content">
        <div class="summary">
          <div class="metric"><span>Visible keys</span><strong id="visibleCount">0</strong></div>
          <div class="metric"><span>Selected app</span><strong id="selectedApp">All</strong></div>
          <div class="metric"><span>Environment</span><strong id="selectedEnv">All</strong></div>
          <div class="metric"><span>Providers</span><strong id="providerCount">0</strong></div>
        </div>

        <div class="table-card">
          <div class="table-head">
            <div>
              <strong>Environment Variables</strong>
              <span id="tableHint">Masked values stay local.</span>
            </div>
          </div>
          <div class="table-wrap" id="tableWrap"></div>
        </div>
      </section>
    </main>
  </div>

  <script>
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
      return /^https?:\\/\\//i.test(String(value || ""));
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
  </script>
</body>
</html>`;
}
