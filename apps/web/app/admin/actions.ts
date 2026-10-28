"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { login, logout, requireAdmin } from "@/lib/auth";
import { env } from "@/lib/db";
import { mediaKey } from "@/lib/media";
import { AVAILABILITY, type ArtworkImage, type Availability } from "@/lib/types";

// ——— session ———

export async function loginAction(_prev: { error: string }, form: FormData) {
  const result = await login(String(form.get("password") ?? ""));
  if (result === "locked") return { error: "Too many attempts. Try again in 15 minutes." };
  if (result === "invalid") return { error: "Incorrect password." };
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

// ——— artworks ———

export interface ArtworkInput {
  title: string;
  slug: string;
  year: string;
  medium: string;
  dimensions: string;
  price: string;
  description: string;
  artist_notes: string;
  purchase_instructions: string;
  availability: Availability;
  published: boolean;
  featured: boolean;
  images: ArtworkImage[];
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function validImages(value: unknown): ArtworkImage[] | null {
  if (!Array.isArray(value) || value.length > 30) return null;
  const images: ArtworkImage[] = [];
  for (const i of value) {
    if (
      !i ||
      typeof i.id !== "string" ||
      !UUID.test(i.id) ||
      (i.ext !== "webp" && i.ext !== "jpg") ||
      !Number.isInteger(i.w) ||
      !Number.isInteger(i.h) ||
      i.w <= 0 ||
      i.h <= 0
    ) {
      return null;
    }
    images.push({ id: i.id, ext: i.ext, w: i.w, h: i.h, alt: text(i.alt, 300) ?? "" });
  }
  return images;
}

async function deleteImageFiles(images: ArtworkImage[]) {
  if (images.length === 0) return;
  await env().MEDIA.delete(
    images.flatMap((img) => [mediaKey(img, "thumb"), mediaKey(img, "large")]),
  );
}

export async function saveArtwork(
  id: string | null,
  input: ArtworkInput,
): Promise<{ error: string } | { ok: true }> {
  await requireAdmin();

  const title = text(input.title, 200);
  const slug = text(input.slug, 120);
  const images = validImages(input.images);
  if (!title) return { error: "Title is required." };
  if (!slug || !SLUG.test(slug)) {
    return { error: "Slug must be lowercase letters, numbers and single hyphens." };
  }
  if (!AVAILABILITY.includes(input.availability)) return { error: "Invalid availability." };
  if (!images) return { error: "Invalid image list." };

  const { DB } = env();
  const published = input.published ? 1 : 0;
  const values = [
    title,
    slug,
    text(input.year, 20),
    text(input.medium, 200),
    text(input.dimensions, 200),
    text(input.price, 50),
    text(input.description, 5000),
    text(input.artist_notes, 5000),
    text(input.purchase_instructions, 2000),
    input.availability,
    JSON.stringify(images),
    published,
    input.featured ? 1 : 0,
  ];

  let previous: ArtworkImage[] = [];
  try {
    if (id) {
      const row = await DB.prepare("SELECT images FROM artworks WHERE id = ?")
        .bind(id)
        .first<{ images: string }>();
      if (!row) return { error: "Artwork not found." };
      previous = JSON.parse(row.images);

      // `values` bind to ?1–?13 (published is ?12); id is ?14
      await DB.prepare(
        `UPDATE artworks SET title = ?, slug = ?, year = ?, medium = ?, dimensions = ?, price = ?,
           description = ?, artist_notes = ?, purchase_instructions = ?, availability = ?,
           images = ?, published = ?, featured = ?,
           published_at = CASE WHEN ?12 = 1 THEN COALESCE(published_at, CURRENT_TIMESTAMP) ELSE published_at END,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = ?14`,
      )
        .bind(...values, id)
        .run();
    } else {
      // new works go to the top of the list. id is ?1, `values` are ?2–?14 (published is ?13)
      await DB.prepare(
        `INSERT INTO artworks (id, title, slug, year, medium, dimensions, price, description,
           artist_notes, purchase_instructions, availability, images, published, featured,
           published_at, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
           CASE WHEN ?13 = 1 THEN CURRENT_TIMESTAMP END,
           (SELECT COALESCE(MIN(sort_order), 1) - 1 FROM artworks))`,
      )
        .bind(crypto.randomUUID(), ...values)
        .run();
    }
  } catch (err) {
    if (String(err).includes("UNIQUE")) {
      return { error: "Another artwork already uses that slug." };
    }
    throw err;
  }

  // images removed in the editor are deleted from storage once the row no longer references them
  await deleteImageFiles(previous.filter((p) => !images.some((i) => i.id === p.id)));

  revalidatePath("/", "layout");
  if (!id) redirect("/admin");
  return { ok: true };
}

export async function deleteArtwork(id: string) {
  await requireAdmin();
  const { DB } = env();
  const row = await DB.prepare("DELETE FROM artworks WHERE id = ? RETURNING images")
    .bind(id)
    .first<{ images: string }>();
  if (row) await deleteImageFiles(JSON.parse(row.images));
  revalidatePath("/", "layout");
}

export async function setPublished(id: string, published: boolean) {
  await requireAdmin();
  await env()
    .DB.prepare(
      `UPDATE artworks SET published = ?1,
         published_at = CASE WHEN ?1 = 1 THEN COALESCE(published_at, CURRENT_TIMESTAMP) ELSE published_at END,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?2`,
    )
    .bind(published ? 1 : 0, id)
    .run();
  revalidatePath("/", "layout");
}

// swaps an artwork with its neighbour, renumbering everything so ties can't stick
export async function moveArtwork(id: string, direction: -1 | 1) {
  await requireAdmin();
  const { DB } = env();
  const { results } = await DB.prepare(
    "SELECT id FROM artworks ORDER BY sort_order ASC, created_at DESC",
  ).all<{ id: string }>();
  const ids = results.map((r) => r.id);
  const from = ids.indexOf(id);
  const to = from + direction;
  if (from === -1 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  await DB.batch(
    ids.map((artworkId, i) =>
      DB.prepare("UPDATE artworks SET sort_order = ? WHERE id = ?").bind(i, artworkId),
    ),
  );
  revalidatePath("/", "layout");
}

// ——— inquiries ———

export async function markInquiryRead(id: string, read: boolean) {
  await requireAdmin();
  await env()
    .DB.prepare(
      "UPDATE inquiries SET read_at = CASE WHEN ? THEN CURRENT_TIMESTAMP END WHERE id = ?",
    )
    .bind(read ? 1 : 0, id)
    .run();
  revalidatePath("/admin", "layout");
}

export async function deleteInquiry(id: string) {
  await requireAdmin();
  await env().DB.prepare("DELETE FROM inquiries WHERE id = ?").bind(id).run();
  revalidatePath("/admin", "layout");
}
