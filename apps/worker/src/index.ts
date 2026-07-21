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
  // workers-types types formData.get() as string | null; cast to include File
  const file = form.get("file") as File | string | null;

  if (!file || typeof file === "string") {
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

  return c.json({ id, key, url: `/media/${key}` });
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
