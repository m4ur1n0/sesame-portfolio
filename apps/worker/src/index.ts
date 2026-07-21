import { Hono } from "hono";
import { cors } from "hono/cors";

type Env = {
  Bindings: {
    DB: D1Database;
    MEDIA: R2Bucket;
    PUBLIC_SITE_URL: string;
    ENVIRONMENT: string;
    ADMIN_SECRET: string;
  };
};

const app = new Hono<Env>();

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const siteUrl = c.env.PUBLIC_SITE_URL ?? "";
      const allowed = [
        "http://localhost:3000",
        siteUrl,
      ].filter(Boolean);
      return allowed.includes(origin) ? origin : allowed[0] ?? null;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// ——— admin auth middleware ———

function requireAdmin(secret: string | undefined, authHeader: string | null | undefined) {
  if (!secret) return false;
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "");
  return token === secret;
}

// ——— health ———

app.get("/health", (c) => {
  return c.json({ ok: true, environment: c.env.ENVIRONMENT ?? "unknown" });
});

// ——— media serve ———

app.get("/media/:key", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.MEDIA.get(key);

  if (!object) return c.notFound();

  return new Response(object.body, {
    headers: {
      "Content-Type":
        object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

// ——— media upload (admin only) ———

app.post("/media", async (c) => {
  if (!requireAdmin(c.env.ADMIN_SECRET, c.req.header("Authorization"))) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const form = await c.req.formData();
  const file = form.get("file") as File | string | null;

  if (!file || typeof file === "string") {
    return c.json({ error: "missing file" }, 400);
  }

  const id = crypto.randomUUID();
  const ext = file.name.split(".").pop() ?? "bin";
  const key = `${id}.${ext}`;

  await c.env.MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });

  await c.env.DB.prepare(
    `INSERT INTO media (id, key, filename, mime_type, size_bytes)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(id, key, file.name, file.type || "application/octet-stream", file.size)
    .run();

  return c.json({ id, key, url: `/media/${key}` });
});

// ——— public artwork routes ———

const ARTWORK_PUBLIC_COLS = `
  id, title, slug, status, excerpt, body_html,
  hero_media_id, additional_media_ids,
  year, medium, dimensions, price, availability,
  artist_notes, purchase_instructions,
  published_at, created_at, updated_at,
  gallery_visible, purchase_visible, display_order, featured
`;

app.get("/artworks", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ${ARTWORK_PUBLIC_COLS}
     FROM posts
     WHERE status = 'published'
       AND content_type = 'artwork'
       AND gallery_visible = 1
     ORDER BY display_order ASC, published_at DESC`,
  ).all();

  return c.json({ artworks: results });
});

app.get("/artworks/featured", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ${ARTWORK_PUBLIC_COLS}
     FROM posts
     WHERE status = 'published'
       AND content_type = 'artwork'
       AND gallery_visible = 1
       AND featured = 1
     ORDER BY display_order ASC, published_at DESC
     LIMIT 6`,
  ).all();

  return c.json({ artworks: results });
});

app.get("/artworks/purchase", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ${ARTWORK_PUBLIC_COLS}
     FROM posts
     WHERE status = 'published'
       AND content_type = 'artwork'
       AND purchase_visible = 1
     ORDER BY display_order ASC, published_at DESC`,
  ).all();

  return c.json({ artworks: results });
});

app.get("/artworks/:slug", async (c) => {
  const slug = c.req.param("slug");

  const row = await c.env.DB.prepare(
    `SELECT ${ARTWORK_PUBLIC_COLS}
     FROM posts
     WHERE slug = ?
       AND status = 'published'
       AND content_type = 'artwork'`,
  )
    .bind(slug)
    .first();

  if (!row) return c.notFound();
  return c.json({ artwork: row });
});

// ——— contact form ———

app.post("/contact", async (c) => {
  const body = await c.req.json<{
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
    artwork_ref?: string;
  }>();

  if (!body.name?.trim() || !body.email?.trim() || !body.message?.trim()) {
    return c.json({ error: "name, email, and message are required" }, 400);
  }

  // basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return c.json({ error: "invalid email address" }, 400);
  }

  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO contact_submissions (id, name, email, subject, message, artwork_ref)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      body.name.trim(),
      body.email.trim().toLowerCase(),
      body.subject?.trim() ?? null,
      body.message.trim(),
      body.artwork_ref?.trim() ?? null,
    )
    .run();

  return c.json({ ok: true });
});

// ——— admin verify ———

app.get("/admin/verify", (c) => {
  if (!requireAdmin(c.env.ADMIN_SECRET, c.req.header("Authorization"))) {
    return c.json({ error: "unauthorized" }, 401);
  }
  return c.json({ ok: true });
});

// ——— admin artwork routes ———

const ARTWORK_ALL_COLS = `
  id, title, slug, status, excerpt, body_json, body_html,
  hero_media_id, additional_media_ids,
  year, medium, dimensions, price, availability,
  artist_notes, purchase_instructions,
  gallery_visible, purchase_visible, display_order, featured,
  published_at, created_at, updated_at, content_type
`;

app.get("/admin/artworks", async (c) => {
  if (!requireAdmin(c.env.ADMIN_SECRET, c.req.header("Authorization"))) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const { results } = await c.env.DB.prepare(
    `SELECT ${ARTWORK_ALL_COLS}
     FROM posts
     WHERE content_type = 'artwork'
     ORDER BY display_order ASC, updated_at DESC`,
  ).all();

  return c.json({ artworks: results });
});

app.get("/admin/artworks/:id", async (c) => {
  if (!requireAdmin(c.env.ADMIN_SECRET, c.req.header("Authorization"))) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const row = await c.env.DB.prepare(
    `SELECT ${ARTWORK_ALL_COLS} FROM posts WHERE id = ? AND content_type = 'artwork'`,
  )
    .bind(id)
    .first();

  if (!row) return c.notFound();
  return c.json({ artwork: row });
});

app.post("/admin/artworks", async (c) => {
  if (!requireAdmin(c.env.ADMIN_SECRET, c.req.header("Authorization"))) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const body = await c.req.json<{
    title: string;
    slug: string;
    excerpt?: string;
    body_html?: string;
    year?: string;
    medium?: string;
    dimensions?: string;
    price?: string;
    availability?: string;
    gallery_visible?: boolean;
    purchase_visible?: boolean;
    display_order?: number;
    featured?: boolean;
    hero_media_id?: string;
    additional_media_ids?: string[];
    artist_notes?: string;
    purchase_instructions?: string;
    status?: string;
  }>();

  if (!body.title?.trim() || !body.slug?.trim()) {
    return c.json({ error: "title and slug are required" }, 400);
  }

  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO posts (
      id, title, slug, status, content_type, excerpt, body_html, body_json,
      hero_media_id, additional_media_ids,
      year, medium, dimensions, price, availability,
      gallery_visible, purchase_visible, display_order, featured,
      artist_notes, purchase_instructions
    ) VALUES (?, ?, ?, ?, 'artwork', ?, ?, '{}', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      body.title.trim(),
      body.slug.trim(),
      body.status ?? "draft",
      body.excerpt ?? null,
      body.body_html ?? null,
      body.hero_media_id ?? null,
      body.additional_media_ids ? JSON.stringify(body.additional_media_ids) : null,
      body.year ?? null,
      body.medium ?? null,
      body.dimensions ?? null,
      body.price ?? null,
      body.availability ?? "available",
      body.gallery_visible !== false ? 1 : 0,
      body.purchase_visible !== false ? 1 : 0,
      body.display_order ?? 0,
      body.featured ? 1 : 0,
      body.artist_notes ?? null,
      body.purchase_instructions ?? null,
    )
    .run();

  return c.json({ id });
});

app.put("/admin/artworks/:id", async (c) => {
  if (!requireAdmin(c.env.ADMIN_SECRET, c.req.header("Authorization"))) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const body = await c.req.json<Record<string, unknown>>();

  // build dynamic SET clause from provided fields
  const allowed = [
    "title", "slug", "excerpt", "body_html",
    "year", "medium", "dimensions", "price", "availability",
    "artist_notes", "purchase_instructions",
  ];
  const boolFields = ["gallery_visible", "purchase_visible", "featured"];
  const numFields = ["display_order"];
  const jsonFields = ["additional_media_ids"];

  const sets: string[] = [];
  const values: unknown[] = [];

  for (const key of allowed) {
    if (key in body) {
      sets.push(`${key} = ?`);
      values.push(body[key] === undefined ? null : body[key]);
    }
  }
  for (const key of boolFields) {
    if (key in body) {
      sets.push(`${key} = ?`);
      values.push(body[key] ? 1 : 0);
    }
  }
  for (const key of numFields) {
    if (key in body) {
      sets.push(`${key} = ?`);
      values.push(Number(body[key]) ?? 0);
    }
  }
  for (const key of jsonFields) {
    if (key in body) {
      sets.push(`${key} = ?`);
      values.push(Array.isArray(body[key]) ? JSON.stringify(body[key]) : null);
    }
  }
  if ("hero_media_id" in body) {
    sets.push("hero_media_id = ?");
    values.push(body.hero_media_id ?? null);
  }

  if (sets.length === 0) {
    return c.json({ error: "no fields to update" }, 400);
  }

  sets.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);

  await c.env.DB.prepare(
    `UPDATE posts SET ${sets.join(", ")} WHERE id = ? AND content_type = 'artwork'`,
  )
    .bind(...values)
    .run();

  return c.json({ ok: true });
});

app.post("/admin/artworks/:id/publish", async (c) => {
  if (!requireAdmin(c.env.ADMIN_SECRET, c.req.header("Authorization"))) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const id = c.req.param("id");
  await c.env.DB.prepare(
    `UPDATE posts
     SET status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND content_type = 'artwork'`,
  )
    .bind(id)
    .run();

  return c.json({ ok: true });
});

app.post("/admin/artworks/:id/unpublish", async (c) => {
  if (!requireAdmin(c.env.ADMIN_SECRET, c.req.header("Authorization"))) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const id = c.req.param("id");
  await c.env.DB.prepare(
    `UPDATE posts
     SET status = 'draft', updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND content_type = 'artwork'`,
  )
    .bind(id)
    .run();

  return c.json({ ok: true });
});

app.delete("/admin/artworks/:id", async (c) => {
  if (!requireAdmin(c.env.ADMIN_SECRET, c.req.header("Authorization"))) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const id = c.req.param("id");
  await c.env.DB.prepare(
    `DELETE FROM posts WHERE id = ? AND content_type = 'artwork'`,
  )
    .bind(id)
    .run();

  return c.json({ ok: true });
});

// ——— admin contact submissions ———

app.get("/admin/contact", async (c) => {
  if (!requireAdmin(c.env.ADMIN_SECRET, c.req.header("Authorization"))) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT 100`,
  ).all();

  return c.json({ submissions: results });
});

// ——— legacy posts routes (preserved) ———

app.get("/posts", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, title, slug, status, excerpt, published_at, created_at, updated_at
     FROM posts
     WHERE content_type = 'post' OR content_type IS NULL
     ORDER BY created_at DESC`,
  ).all();

  return c.json({ posts: results });
});

app.post("/posts", async (c) => {
  if (!requireAdmin(c.env.ADMIN_SECRET, c.req.header("Authorization"))) {
    return c.json({ error: "unauthorized" }, 401);
  }

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
    `INSERT INTO posts (id, title, slug, excerpt, body_json, content_type)
     VALUES (?, ?, ?, ?, ?, 'post')`,
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

export default app;
