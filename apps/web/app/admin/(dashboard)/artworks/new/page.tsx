import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ArtworkEditor } from "@/components/ArtworkEditor";

export const metadata: Metadata = { title: "New Artwork" };

export default async function NewArtworkPage() {
  await requireAdmin();
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <nav className="mb-8 text-sm text-[var(--color-muted)]">
        <Link href="/admin" className="hover:text-[var(--color-text)] transition-colors">
          ← Artworks
        </Link>
      </nav>
      <h1
        className="text-2xl text-[var(--color-text)] mb-8"
        style={{ fontFamily: "var(--font-display)" }}
      >
        New Artwork
      </h1>
      <ArtworkEditor />
    </div>
  );
}
