# Env Manager Flow

This shows what happens when an existing project adds the `env-manager` npm package.

```txt
Existing Big Project
└── apps/
    ├── server/
    │   ├── .env.local
    │   ├── .env.production
    │   └── src/...
    ├── web/
    │   ├── .env.local
    │   ├── .env.staging
    │   └── src/...
    └── admin/
        ├── .env.local
        └── src/...
```

```txt
1. Install package
   |
   v
npm install -D env-manager
```

```txt
2. Add supported metadata above important env keys

.env.local
------------------------------------------------
# @provider OpenAI
# @owner backend@company.com
# @account founder@company.com
# @dashboard https://platform.openai.com/api-keys
# @createdAt 2026-05-13
# @rotationPolicy 90 days
OPENAI_API_KEY=sk-...

DATABASE_URL=postgres://...
------------------------------------------------
```

```txt
3. Start Env Manager

npx env-manager
        |
        v
Local server starts on 127.0.0.1
```

```txt
4. Env Manager scans the project

Project root
   |
   |-- find .env files
   |     .env
   |     .env.local
   |     .env.production
   |     .env.staging
   |
   |-- detect app folder
   |     apps/server
   |     apps/web
   |     apps/admin
   |
   |-- parse env keys
   |     OPENAI_API_KEY
   |     DATABASE_URL
   |
   |-- attach supported metadata
   |     provider
   |     owner
   |     account
   |     dashboard
   |     createdAt
   |     rotationPolicy
   |
   v
Build local scan result
```

```txt
5. Browser dashboard shows

Env Manager UI
------------------------------------------------
Apps              Environments        Table
------------------------------------------------
apps/server       local               OPENAI_API_KEY
apps/web          staging             DATABASE_URL
apps/admin        production          STRIPE_SECRET_KEY

Metadata:
file: apps/server/.env.local
provider: OpenAI
owner: backend@company.com
account: founder@company.com
dashboard: click here
createdAt: 2026-05-13
rotationPolicy: 90 days
------------------------------------------------
```

```txt
6. Team uses it to answer questions

Who owns this key?
        |
        v
owner: backend@company.com

Where do I rotate it?
        |
        v
dashboard: click here

Which app/env has this key?
        |
        v
file: apps/server/.env.local
env: local

Can I reveal/copy value?
        |
        v
Only locally, from 127.0.0.1
```

```txt
Full Flow

Developer installs package
        |
        v
Runs npx env-manager
        |
        v
Env Manager scans local repo only
        |
        v
Finds .env files across apps
        |
        v
Parses env keys and supported comment metadata
        |
        v
Masks secret values
        |
        v
Shows local dashboard
        |
        v
Developer filters by app/env/provider,
finds owner/dashboard/source file,
and rotates or manages secrets faster
```

Env Manager does not sync to a cloud service or upload secrets. It reads the existing project locally and gives a dashboard over the `.env` files.
