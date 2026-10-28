import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Artwork } from "./types";

export function env() {
  return getCloudflareContext().env;
}

export type ArtworkRow = Omit<Artwork, "images" | "published" | "featured"> & {
  images: string;
  published: number;
  featured: number;
};

export function toArtwork(row: ArtworkRow): Artwork {
  return {
    ...row,
    images: JSON.parse(row.images),
    published: row.published === 1,
    featured: row.featured === 1,
  };
}

export const ARTWORK_COLS = `id, slug, title, year, medium, dimensions, price, description,
  artist_notes, purchase_instructions, availability, images, published, featured,
  sort_order, published_at, updated_at`;

export const ARTWORK_ORDER = "ORDER BY sort_order ASC, created_at DESC";

// the whole published catalogue is small, so pages filter this one list
export async function listPublished(): Promise<Artwork[]> {
  const { results } = await env()
    .DB.prepare(`SELECT ${ARTWORK_COLS} FROM artworks WHERE published = 1 ${ARTWORK_ORDER}`)
    .all<ArtworkRow>();
  return results.map(toArtwork);
}

export async function getPublishedBySlug(slug: string): Promise<Artwork | null> {
  const row = await env()
    .DB.prepare(`SELECT ${ARTWORK_COLS} FROM artworks WHERE slug = ? AND published = 1`)
    .bind(slug)
    .first<ArtworkRow>();
  return row ? toArtwork(row) : null;
}
