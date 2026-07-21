"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminGetArtworks } from "@/lib/api";
import type { Artwork } from "@/lib/types";

export default function AdminDashboard() {
  const router = useRouter();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    adminGetArtworks(token)
      .then(setArtworks)
      .catch(() => router.replace("/admin/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const published = artworks.filter((a) => a.status === "published").length;
  const drafts = artworks.filter((a) => a.status === "draft").length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-10">
        <h1
          className="text-2xl text-[var(--color-text)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Dashboard
        </h1>
        <Link
          href="/admin/artworks/new"
          className="inline-flex items-center px-4 py-2 text-sm bg-[var(--color-text)] text-white rounded hover:opacity-80 transition-opacity"
        >
          + New Artwork
        </Link>
      </div>

      {loading ? (
        <p className="text-[var(--color-muted)] text-sm">Loading…</p>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard label="Total Artworks" value={artworks.length} />
          <StatCard label="Published" value={published} />
          <StatCard label="Drafts" value={drafts} />
        </div>
      )}

      <div className="mt-10">
        <Link
          href="/admin/artworks"
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Manage artworks →
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-[var(--color-border)] bg-white p-5">
      <p className="text-xs text-[var(--color-muted)] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-light text-[var(--color-text)]">{value}</p>
    </div>
  );
}
