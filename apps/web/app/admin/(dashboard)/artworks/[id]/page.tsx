import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetArtwork } from "@/lib/admin";
import { ArtworkEditor } from "@/components/ArtworkEditor";

export const metadata: Metadata = { title: "Edit Artwork" };

export default async function EditArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  const artwork = await adminGetArtwork((await params).id);
  if (!artwork) notFound();

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <nav className="mb-8 text-sm text-[var(--color-muted)]">
        <Link href="/admin" className="hover:text-[var(--color-text)] transition-colors">
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
        {artwork.published && (
          <Link
            href={`/gallery/${artwork.slug}`}
            target="_blank"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            View live ↗
          </Link>
        )}
      </div>
      <ArtworkEditor initial={artwork} />
    </div>
  );
}
