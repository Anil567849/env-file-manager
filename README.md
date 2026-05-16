# Env File Manager

A small local-first dashboard for browsing `.env` files across apps and environments.

Env File Manager scans a repo or monorepo, groups env variables by app and environment, masks values by default, and shows supported metadata like owner, provider, dashboard link, account, rotation policy, and source file.

<img width="1920" height="1080" alt="Untitled design" src="https://github.com/user-attachments/assets/0ea2b896-b996-4b24-ab7b-ff8c8defa91e" />

## Why This Exists

Most teams eventually end up with env sprawl:

- `server`, `mobile`, `frontend-web`, and admin apps all have different env files
- `local`, `dev`, `staging`, and `prod` values drift apart
- nobody remembers who owns a key or where its provider dashboard lives
- onboarding requires digging through old docs and random `.env.example` files
- payment keys may come from one founder account, email keys from another account, and AI/provider keys from someone else
- when an old teammate leaves, it becomes hard to know which secrets they created, which account owns them, and where to rotate or delete them

The goal is to stop juggling Slack messages, provider dashboards, old docs, and random local files. Add metadata next to the env key: who owns it, when it was created, which account it came from, and the exact provider link. Later, when you need to rotate, delete, or transfer ownership, you can go directly to the right place.

This package gives you a simple local UI for seeing that structure across multiple repos, apps, and environments without sending secrets anywhere.

## What It Does

- Scans `.env`, `.env.local`, `.env.development`, `.env.staging`, `.env.production`, `.env.test`, `.env.example`, `.env.backup`, and `.env.*`
- Detects apps from folders like `apps/server`, `apps/mobile`, `apps/frontend-web`, `packages/*`, and `services/*`
- Shows one dark dashboard with app navigation, env tabs, search, provider filter, and a key/value table
- Parses metadata from supported `# @field value` comments placed directly above an env key
- Uses explicit provider metadata for filtering and dashboard links
- Masks secret values until you click `Show`
- Runs only on `127.0.0.1`

## Install

Install it as a dev dependency in the root of the project you want to scan:

```bash
cd /path/to/your-project
```

```bash
npm i -D env-file-manager
```

For monorepos, install it at the monorepo root so it can scan all apps and packages.

Local development from this repo:

```bash
npm install
npm start
```

## Usage

Start the dashboard from your project root:

```bash
npx env-file-manager
```

By default, Env File Manager scans the current working directory. If you run it from somewhere else, pass the project path explicitly:

```bash
npx env-file-manager --root /path/to/project
```

Run without opening a browser:

```bash
npx env-file-manager --no-open --port 4783
```

Useful CLI commands:

```bash
npx env-file-manager scan
npx env-file-manager export --format json
npx env-file-manager export --format csv --out env-report.csv
npx env-file-manager watch
```

## Metadata

Env File Manager supports metadata only through `# @field value` comments placed directly above the env key:

```env
# @provider OpenAI
# @owner backend@company.com
# @account founder@company.com
# @dashboard https://platform.openai.com/api-keys
# @createdAt 2026-05-13
# @rotationPolicy 90 days
# @email backend@example.com
OPENAI_API_KEY=sk-...
```

Metadata parsing rules:

- Any comment matching `# @key value` becomes metadata for the next env key.
- `key` is the first word after `@`.
- `value` is everything after that key until the end of the line.
- Metadata resets after it is attached to one env key.

In the UI, metadata is rendered one item per line. URL metadata becomes a `click here` link so rotation is one click away.

## Supported Workspace Structure

Env File Manager is designed to work seamlessly with monorepos. For example, if your repository looks like this:

- `apps/server/`
- `apps/frontend-web/`
- `apps/mobile/`
- `apps/admin/`

And each app has multiple `.env.*` files, the dashboard will automatically group them, providing app navigation and environment tabs (e.g., `local`, `dev`, `staging`, and `prod`).

## Security

Env File Manager is local-first:

- the server binds to `127.0.0.1`
- secrets are not uploaded
- table values are masked by default
- raw values are only returned by the local reveal/copy action
- JSON exports omit raw secret values

## Development

```bash
npm run build
npm test
```

The implementation is TypeScript-first. Source lives in `src/**/*.ts`, tests live in `test/**/*.ts`, and `npm run build` compiles everything into `dist`. The npm binary is a tiny Node shim that runs the compiled CLI from `dist/src/cli.js`.
