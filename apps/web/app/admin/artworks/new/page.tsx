"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArtworkEditor } from "@/components/ArtworkEditor";
import { adminCreateArtwork } from "@/lib/api";
import type { ArtworkPayload } from "@/lib/api";

export default function NewArtworkPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const tokenRef = useRef("");

  useEffect(() => {
    const tok = sessionStorage.getItem("admin_token") ?? "";
    if (!tok) { router.replace("/admin/login"); return; }
    tokenRef.current = tok;
  }, [router]);

  async function handleSave(payload: ArtworkPayload) {
    setSaving(true);
    try {
      const { id } = await adminCreateArtwork(payload, tokenRef.current);
      router.push(`/admin/artworks/${id}/edit`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <nav className="mb-8 text-sm text-[var(--color-muted)]">
        <Link href="/admin/artworks" className="hover:text-[var(--color-text)] transition-colors">
          ← Artworks
        </Link>
      </nav>
      <h1
        className="text-2xl text-[var(--color-text)] mb-8"
        style={{ fontFamily: "var(--font-display)" }}
      >
        New Artwork
      </h1>
      <ArtworkEditor onSave={handleSave} saving={saving} />
    </div>
  );
}
