import { requireAdmin } from "./auth";
import { ARTWORK_COLS, ARTWORK_ORDER, env, toArtwork, type ArtworkRow } from "./db";
import type { Artwork, Inquiry } from "./types";

// every admin read checks the session itself; layouts alone don't guard data

export async function adminListArtworks(): Promise<Artwork[]> {
  await requireAdmin();
  const { results } = await env()
    .DB.prepare(`SELECT ${ARTWORK_COLS} FROM artworks ${ARTWORK_ORDER}`)
    .all<ArtworkRow>();
  return results.map(toArtwork);
}

export async function adminGetArtwork(id: string): Promise<Artwork | null> {
  await requireAdmin();
  const row = await env()
    .DB.prepare(`SELECT ${ARTWORK_COLS} FROM artworks WHERE id = ?`)
    .bind(id)
    .first<ArtworkRow>();
  return row ? toArtwork(row) : null;
}

export async function adminListInquiries(): Promise<Inquiry[]> {
  await requireAdmin();
  const { results } = await env()
    .DB.prepare("SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 200")
    .all<Inquiry>();
  return results;
}

export async function adminUnreadCount(): Promise<number> {
  await requireAdmin();
  const row = await env()
    .DB.prepare("SELECT COUNT(*) AS n FROM inquiries WHERE read_at IS NULL")
    .first<{ n: number }>();
  return row?.n ?? 0;
}
