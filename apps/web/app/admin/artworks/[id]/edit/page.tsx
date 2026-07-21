"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArtworkEditor } from "@/components/ArtworkEditor";
import {
  adminGetArtwork,
  adminUpdateArtwork,
  adminPublishArtwork,
  adminUnpublishArtwork,
} from "@/lib/api";
import type { ArtworkPayload } from "@/lib/api";
import type { Artwork } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditArtworkPage({ params }: Props) {
  const router = useRouter();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState("");
  const [id, setId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    params.then(({ id: artworkId }) => {
      setId(artworkId);
      const tok = sessionStorage.getItem("admin_token") ?? "";
      if (!tok) { router.replace("/admin/login"); return; }
      setToken(tok);
      adminGetArtwork(artworkId, tok)
        .then(setArtwork)
        .catch(() => router.replace("/admin/artworks"));
    });
  }, [params, router]);

  async function handleSave(payload: ArtworkPayload) {
    setSaving(true);
    setMessage("");
    try {
      await adminUpdateArtwork(id, payload, token);
      setMessage("Saved.");
      // refresh artwork state
      const updated = await adminGetArtwork(id, token);
      setArtwork(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish() {
    if (!artwork) return;
    setSaving(true);
    try {
      if (artwork.status === "published") {
        await adminUnpublishArtwork(id, token);
      } else {
        await adminPublishArtwork(id, token);
      }
      const updated = await adminGetArtwork(id, token);
      setArtwork(updated);
      setMessage(updated.status === "published" ? "Published." : "Unpublished.");
    } finally {
      setSaving(false);
    }
  }

  if (!artwork) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <p className="text-[var(--color-muted)] text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <nav className="mb-8 text-sm text-[var(--color-muted)]">
        <Link href="/admin/artworks" className="hover:text-[var(--color-text)] transition-colors">
          ← Artworks
        </Link>
      </nav>

      <div className="flex items-start justify-between mb-8 gap-4">
        <h1
          className="text-2xl text-[var(--color-text)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {artwork.title}
        </h1>
        <div className="flex items-center gap-3 shrink-0">
          {artwork.status === "published" && (
            <Link
              href={`/gallery/${artwork.slug}`}
              target="_blank"
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              View live ↗
            </Link>
          )}
          <button
            onClick={handleTogglePublish}
            disabled={saving}
            className="text-sm px-3 py-1.5 border border-[var(--color-border)] rounded hover:border-[var(--color-border-strong)] transition-colors text-[var(--color-text)] disabled:opacity-50"
          >
            {artwork.status === "published" ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>

      {message && (
        <p className="mb-6 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
          {message}
        </p>
      )}

      <ArtworkEditor initial={artwork} onSave={handleSave} saving={saving} />
    </div>
  );
}
