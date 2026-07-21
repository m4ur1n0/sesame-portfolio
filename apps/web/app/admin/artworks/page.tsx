"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  adminGetArtworks,
  adminDeleteArtwork,
  adminPublishArtwork,
  adminUnpublishArtwork,
} from "@/lib/api";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import type { Artwork } from "@/lib/types";

export default function AdminArtworksList() {
  const router = useRouter();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef("");

  const load = useCallback(
    async (tok: string) => {
      try {
        const data = await adminGetArtworks(tok);
        setArtworks(data);
      } catch {
        router.replace("/admin/login");
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const tok = sessionStorage.getItem("admin_token") ?? "";
    if (!tok) { router.replace("/admin/login"); return; }
    tokenRef.current = tok;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(tok);
  }, [router, load]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await adminDeleteArtwork(id, tokenRef.current);
    setArtworks((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleTogglePublish(artwork: Artwork) {
    if (artwork.status === "published") {
      await adminUnpublishArtwork(artwork.id, tokenRef.current);
    } else {
      await adminPublishArtwork(artwork.id, tokenRef.current);
    }
    load(tokenRef.current);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-2xl text-[var(--color-text)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Artworks
        </h1>
        <Link
          href="/admin/artworks/new"
          className="inline-flex items-center px-4 py-2 text-sm bg-[var(--color-text)] text-white rounded hover:opacity-80 transition-opacity"
        >
          + New Artwork
        </Link>
      </div>

      {loading && <p className="text-[var(--color-muted)] text-sm">Loading…</p>}

      {!loading && artworks.length === 0 && (
        <div className="py-16 text-center border border-[var(--color-border)] rounded">
          <p className="text-[var(--color-muted)]">No artworks yet.</p>
          <Link
            href="/admin/artworks/new"
            className="mt-4 inline-block text-sm text-[var(--color-text)] underline underline-offset-2"
          >
            Add your first artwork
          </Link>
        </div>
      )}

      {!loading && artworks.length > 0 && (
        <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded bg-white">
          {artworks.map((artwork) => (
            <div
              key={artwork.id}
              className="px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-[var(--color-text)] truncate">
                    {artwork.title}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      artwork.status === "published"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-[var(--color-surface-raised)] text-[var(--color-muted)]"
                    }`}
                  >
                    {artwork.status}
                  </span>
                  <AvailabilityBadge availability={artwork.availability} />
                </div>
                <div className="mt-0.5 flex gap-3 text-xs text-[var(--color-muted)]">
                  {artwork.year && <span>{artwork.year}</span>}
                  {artwork.medium && <span>{artwork.medium}</span>}
                  {artwork.price && <span>{artwork.price}</span>}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleTogglePublish(artwork)}
                  className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  {artwork.status === "published" ? "Unpublish" : "Publish"}
                </button>
                {artwork.status === "published" && (
                  <Link
                    href={`/gallery/${artwork.slug}`}
                    target="_blank"
                    className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    View ↗
                  </Link>
                )}
                <Link
                  href={`/admin/artworks/${artwork.id}/edit`}
                  className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(artwork.id, artwork.title)}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
