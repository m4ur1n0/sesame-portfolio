# Blog CMS Boilerplate Runbook

This repo is intended to sit inactive as a reusable boilerplate. Clone it when starting a new blog, journalist portfolio, or regular-posting site. The boilerplate itself should not contain real Cloudflare resource IDs, real bucket names, production URLs, secrets, or client-specific branding.

Important constraint: do not rely on `wrangler dev`. This setup assumes local Next.js development plus remote Cloudflare deployment/testing only when a real project is being launched.

---

## 1. Boilerplate philosophy

The boilerplate should contain:

- reusable frontend/admin code
- reusable Worker API code
- SQL migrations
- example environment files
- example Wrangler config
- setup documentation
- optional setup scripts

The boilerplate should not contain:

- real `database_id` values
- real R2 bucket names
- real deployed Worker URLs
- client-specific domains
- Cloudflare account IDs, unless deliberately added in a cloned project
- secrets
- generated `.wrangler` state

Recommended policy:

```txt
commit examples and templates
ignore real per-project config
create real Cloudflare resources only after cloning for a specific client/project
```

---

## 2. Recommended repo structure

```txt
blog-cms-boilerplate/
  apps/
    web/
      src/
      .env.example
      .env.local            # ignored
    worker/
      src/
      migrations/
      wrangler.example.toml
      wrangler.toml         # ignored
  docs/
    NEW_PROJECT_RUNBOOK.md
  scripts/
    init-project.mjs        # optional
  .gitignore
  package.json
```

---

## 3. Boilerplate `.gitignore` additions

Add these to the repo root `.gitignore`:

```gitignore
# per-project Cloudflare config
apps/worker/wrangler.toml
apps/worker/.wrangler/
.wrangler/

# frontend env
apps/web/.env.local
apps/web/.env*.local

# local/editor noise
.DS_Store
```

Keep `apps/worker/wrangler.example.toml` and `apps/web/.env.example` committed.

---

## 4. `apps/worker/wrangler.example.toml`

Use placeholders only:

```toml
name = "__PROJECT_SLUG__-worker"
main = "src/index.ts"
compatibility_date = "2026-07-01"

# Add this only in a cloned project if you want hard protection against deploying to the wrong Cloudflare account.
# account_id = "__CLOUDFLARE_ACCOUNT_ID__"

[vars]
PUBLIC_SITE_URL = "https://__DOMAIN__"
ENVIRONMENT = "production"

[[d1_databases]]
binding = "DB"
database_name = "__PROJECT_SLUG__-db"
database_id = "__D1_DATABASE_ID__"

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "__PROJECT_SLUG__-media"
```

Notes:

- `wrangler.toml` is the real per-project file.
- `wrangler.example.toml` is the committed template.
- Do not put a fake `database_id` into the real file. Wait until D1 is created.

---

## 5. `apps/web/.env.example`

```bash
NEXT_PUBLIC_SITE_NAME="Example Blog"
NEXT_PUBLIC_SITE_URL="https://example.com"
NEXT_PUBLIC_API_BASE_URL="https://example-worker.example.workers.dev"
```

In the inactive boilerplate, do not create `.env.local` unless you want to test frontend-only UI locally with mock data.

---

## 6. Worker package setup for the boilerplate

From `apps/worker`:

```bash
npm init -y
npm i hono zod
npm i -D wrangler typescript @cloudflare/workers-types
mkdir -p src migrations
```

Add these scripts to `apps/worker/package.json`:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "deploy": "wrangler deploy",
    "cf:whoami": "wrangler whoami",
    "d1:create": "echo 'Run manually: npx wrangler d1 create <project-slug>-db'",
    "r2:create": "echo 'Run manually: npx wrangler r2 bucket create <project-slug>-media'",
    "d1:migrate:remote": "wrangler d1 migrations apply DB --remote"
  }
}
```

Do not add a `dev` script that calls `wrangler dev`.

---

## 7. Worker TypeScript config

Create `apps/worker/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "WebWorker"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "types": ["@cloudflare/workers-types"],
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts"]
}
```

---

## 8. Initial D1 migration committed to boilerplate

Create `apps/worker/migrations/0001_init.sql`:

```sql
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  excerpt TEXT,
  body_json TEXT NOT NULL DEFAULT '{}',
  body_html TEXT,
  hero_media_id TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE media (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  alt TEXT,
  caption TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

You can add future migrations normally. The boilerplate stores migration files, not a real database.

---

## 9. Minimal Worker API committed to boilerplate

Create `apps/worker/src/index.ts`:

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";

type Env = {
  Bindings: {
    DB: D1Database;
    MEDIA: R2Bucket;
    PUBLIC_SITE_URL: string;
    ENVIRONMENT: string;
  };
};

const app = new Hono<Env>();

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.get("/health", (c) => {
  return c.json({ ok: true, environment: c.env.ENVIRONMENT ?? "unknown" });
});

app.get("/posts", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, title, slug, status, excerpt, published_at, created_at, updated_at
     FROM posts
     ORDER BY created_at DESC`,
  ).all();

  return c.json({ posts: results });
});

app.post("/posts", async (c) => {
  const body = await c.req.json<{
    title: string;
    slug: string;
    excerpt?: string;
    bodyJson?: unknown;
  }>();

  if (!body.title || !body.slug) {
    return c.json({ error: "title and slug are required" }, 400);
  }

  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO posts (id, title, slug, excerpt, body_json)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      body.title,
      body.slug,
      body.excerpt ?? null,
      JSON.stringify(body.bodyJson ?? {}),
    )
    .run();

  return c.json({ id });
});

app.post("/media", async (c) => {
  const form = await c.req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return c.json({ error: "missing file" }, 400);
  }

  const id = crypto.randomUUID();
  const ext = file.name.split(".").pop() || "bin";
  const key = `${id}.${ext}`;

  await c.env.MEDIA.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type || "application/octet-stream",
    },
  });

  await c.env.DB.prepare(
    `INSERT INTO media (id, key, filename, mime_type, size_bytes)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(id, key, file.name, file.type || "application/octet-stream", file.size)
    .run();

  return c.json({
    id,
    key,
    url: `/media/${key}`,
  });
});

app.get("/media/:key", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.MEDIA.get(key);

  if (!object) {
    return c.notFound();
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

export default app;
```

This code can be typechecked without deploying, but it cannot be meaningfully run on your Mac if `wrangler dev` is not viable.

---

## 10. Frontend local development strategy

The frontend should support two modes:

1. unconfigured boilerplate mode: API URL missing; UI can render mock data or show setup notices
2. real project mode: `NEXT_PUBLIC_API_BASE_URL` points to a deployed Worker

In `apps/web/src/lib/api.ts`:

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export function isApiConfigured(): boolean {
  return Boolean(API_BASE && !API_BASE.includes("example-worker"));
}

export async function apiGet<T>(path: string): Promise<T> {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }

  const res = await fetch(`${API_BASE}${path}`);

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}
```

For boilerplate UI work, run only:

```bash
cd apps/web
npm run dev
```

Do not expect real post/media persistence until a project-specific Worker is deployed.

---

## 11. Creating a new blog project from the boilerplate

### Step 1: Clone/copy the boilerplate

```bash
git clone <boilerplate-repo-url> client-blog
cd client-blog
```

Optionally reset the Git history if this is a new client repo:

```bash
rm -rf .git
git init
git add .
git commit -m "initial project from blog cms boilerplate"
```

### Step 2: Pick project variables

Choose these once:

```txt
PROJECT_SLUG=client-blog
SITE_NAME="Client Blog"
DOMAIN=clientblog.com
WORKER_NAME=client-blog-worker
D1_NAME=client-blog-db
R2_BUCKET=client-blog-media
```

Use lowercase kebab-case for `PROJECT_SLUG` and resource names.

### Step 3: Create frontend env

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local`:

```bash
NEXT_PUBLIC_SITE_NAME="Client Blog"
NEXT_PUBLIC_SITE_URL="https://clientblog.com"
NEXT_PUBLIC_API_BASE_URL="https://client-blog-worker.<workers-subdomain>.workers.dev"
```

You will not know the final Worker URL until first deploy unless you already know your Workers subdomain.

### Step 4: Create real Wrangler config

```bash
cp apps/worker/wrangler.example.toml apps/worker/wrangler.toml
```

Edit placeholders:

```txt
__PROJECT_SLUG__      -> client-blog
__DOMAIN__            -> clientblog.com
__D1_DATABASE_ID__    -> wait until D1 creation
```

Leave `account_id` commented unless you want to pin the project to a specific Cloudflare account.

### Step 5: Log into the correct Cloudflare account

```bash
cd apps/worker
npx wrangler login
npx wrangler whoami
```

Confirm Wrangler is using the intended account before creating resources.

### Step 6: Create D1 and R2 remotely

```bash
npx wrangler d1 create client-blog-db
npx wrangler r2 bucket create client-blog-media
```

Copy the printed D1 `database_id` into `apps/worker/wrangler.toml`.

### Step 7: Apply D1 migrations remotely

```bash
npx wrangler d1 migrations apply DB --remote
```

Do not run local migrations. Do not run `wrangler dev`.

### Step 8: Deploy the Worker

```bash
npx wrangler deploy
```

Test:

```bash
curl https://client-blog-worker.<workers-subdomain>.workers.dev/health
```

### Step 9: Update frontend API URL

Edit `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL="https://client-blog-worker.<workers-subdomain>.workers.dev"
```

Then run the frontend locally:

```bash
cd ../../apps/web
npm run dev
```

### Step 10: Build site-specific frontend/admin details

Change:

- site name
- logo
- colors/theme
- homepage layout
- post card design
- public article template
- admin branding
- allowed editor blocks
- journalist-specific metadata fields if needed

---

## 12. Deploying frontend

You can deploy the frontend separately through Vercel, Cloudflare Pages, or another host. For minimum Cloudflare consolidation, Cloudflare Pages is reasonable. For easiest Next.js hosting, Vercel is often faster.

Whichever host you use, set:

```bash
NEXT_PUBLIC_SITE_NAME
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_API_BASE_URL
```

Use the deployed Worker URL for `NEXT_PUBLIC_API_BASE_URL`.

---

## 13. Transfer / handoff to client Cloudflare account

There is no assumption that Worker + D1 + R2 can be transferred as one clean bundle. Treat handoff as a redeploy/migration into the client’s account.

### Preferred handoff flow

1. Client creates their own Cloudflare account.
2. Client adds their payment method if needed.
3. Client invites you as an account member/admin.
4. You log into/select their Cloudflare account with Wrangler.
5. You create new D1/R2 resources inside their account.
6. You deploy the Worker from the same codebase into their account.
7. You migrate/copy data and media.
8. You point the frontend production env to the client-owned Worker.
9. You connect or transfer domain/DNS as appropriate.
10. After verification, client removes your access or downgrades you to maintenance role.

### Commands in client account

From `apps/worker`:

```bash
npx wrangler login
npx wrangler whoami
```

Make sure the selected account is the client’s account.

Create resources:

```bash
npx wrangler d1 create client-blog-db
npx wrangler r2 bucket create client-blog-media
```

Update `apps/worker/wrangler.toml`:

```toml
name = "client-blog-worker"
account_id = "CLIENT_CLOUDFLARE_ACCOUNT_ID"

[[d1_databases]]
binding = "DB"
database_name = "client-blog-db"
database_id = "CLIENT_D1_DATABASE_ID"

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "client-blog-media"
```

Apply migrations:

```bash
npx wrangler d1 migrations apply DB --remote
```

Deploy Worker:

```bash
npx wrangler deploy
```

Update frontend env wherever the frontend is hosted:

```bash
NEXT_PUBLIC_API_BASE_URL="https://client-blog-worker.<client-workers-subdomain>.workers.dev"
```

### Data migration from your temporary account to client account

If the project was already live in your account, migrate data rather than trying to transfer ownership.

D1:

- export from your account
- import/apply into the client account
- verify row counts and key sample posts

R2:

- copy objects from your bucket to the client bucket
- preserve object keys exactly
- verify that media URLs resolve through the new Worker

After the client-owned deployment is verified, retire the old Worker/resources in your account.

---

## 14. Recommended Claude Code prompt for setting up the boilerplate

Use this prompt in the boilerplate repo. It is safe to use after `/clear` because it does not depend on prior Claude context.

```text
We are setting up a reusable blog CMS boilerplate. Important constraints:

- This repo is a dormant boilerplate that will be cloned for future client blog/journalist sites.
- Do not create real Cloudflare resources.
- Do not deploy anything.
- Do not run or add instructions relying on `wrangler dev`; my Mac cannot reliably run it.
- The Worker should be developed as code that can be typechecked now and deployed remotely only after the repo is cloned for a real project.
- Real `wrangler.toml` files, `.env.local`, and `.wrangler` state must be ignored.
- Commit only example/template config files such as `apps/worker/wrangler.example.toml` and `apps/web/.env.example`.
- only comment where completely necessary, and if so, use lowercase, human-like comments.

Implement the following:

1. In `apps/worker`, set up a TypeScript Cloudflare Worker API using Hono and Zod if not already present.
2. Add `wrangler.example.toml` with placeholders for project slug, domain, D1 database ID, and R2 bucket name.
3. Ensure real `wrangler.toml` is gitignored.
4. Add `tsconfig.json` for Worker typechecking with `@cloudflare/workers-types`.
5. Add scripts for `typecheck`, `deploy`, `cf:whoami`, and remote D1 migration only. Do not add `wrangler dev`.
6. Add an initial migration in `apps/worker/migrations/0001_init.sql` for `posts` and `media`.
7. Add a minimal Worker API with `/health`, `GET /posts`, `POST /posts`, `POST /media`, and `GET /media/:key` using D1 and R2 bindings.
8. In `apps/web`, add `.env.example` and a small API helper that fails clearly when `NEXT_PUBLIC_API_BASE_URL` is missing.
9. Add or update docs explaining how to clone the boilerplate for a new project, create Cloudflare resources remotely, deploy only after cloning, and later redeploy/migrate into a client-owned Cloudflare account.
10. Run typechecks/build checks that do not require Cloudflare local dev. If any check cannot run without deployment or secrets, skip it and explain exactly why.

At the end, summarize every file changed, every command run, and confirm that no Cloudflare resources were created and no deployment occurred.
```

---

## 15. Recommended Claude Code prompt for a new cloned project

Use this after cloning for a real client project. Do not use `/clear` if Claude already knows the exact client name/domain/resource names from the current session; otherwise this prompt is self-contained.

```text
We are converting this cloned blog CMS boilerplate into a real client project.

Important constraints:

- Do not run `wrangler dev`; my Mac cannot reliably run it.
- We will use remote Cloudflare resources only.
- Do not deploy until the config has been updated and I explicitly approve the deploy command.
- Real `apps/worker/wrangler.toml` and `apps/web/.env.local` are allowed in this cloned project but must remain gitignored unless I say otherwise.
- only comment where completely necessary, and if so, use lowercase, human-like comments.

Project variables:

PROJECT_SLUG=<fill this in>
SITE_NAME=<fill this in>
DOMAIN=<fill this in>
WORKER_NAME=<fill this in>
D1_NAME=<fill this in>
R2_BUCKET=<fill this in>

Tasks:

1. Copy `apps/worker/wrangler.example.toml` to `apps/worker/wrangler.toml` if it does not already exist.
2. Replace placeholders with the project variables, leaving `database_id` as `REPLACE_AFTER_D1_CREATE` if the D1 database has not been created yet.
3. Copy `apps/web/.env.example` to `apps/web/.env.local` if it does not already exist.
4. Replace site name/domain placeholders in `.env.local`.
5. Leave `NEXT_PUBLIC_API_BASE_URL` as a clear placeholder until the Worker has been deployed.
6. Search the repo for generic boilerplate branding and update only safe display text, not core code.
7. Run typecheck/build commands that do not require Cloudflare resources.
8. Stop before creating Cloudflare resources or deploying, and give me the exact next commands I should run manually.

At the end, summarize changed files and list any remaining placeholders.
```
