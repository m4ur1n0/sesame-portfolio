import type { Metadata } from "next";
import { getArtworks, isApiConfigured } from "@/lib/api";
import { ArtworkCard } from "@/components/ArtworkCard";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gallery",
  description: `Browse original works by ${SITE.name}.`,
};

export const revalidate = 60;

export default async function GalleryPage() {
  const artworks = await getArtworks();
  const apiReady = isApiConfigured();

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1
          className="text-3xl sm:text-4xl text-[var(--color-text)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Gallery
        </h1>
        <p className="mt-2 text-[var(--color-muted)]">
          Original works by {SITE.name}
        </p>
      </header>

      {!apiReady && (
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-6 py-10 text-center">
          <p className="text-[var(--color-muted)] text-sm">
            API not configured. Set{" "}
            <code className="font-mono text-xs bg-[var(--color-border)] px-1 rounded">
              NEXT_PUBLIC_API_BASE_URL
            </code>{" "}
            to connect to the Cloudflare Worker.
          </p>
        </div>
      )}

      {apiReady && artworks.length === 0 && (
        <div className="py-24 text-center">
          <p className="text-[var(--color-muted)]">No works in the gallery yet.</p>
        </div>
      )}

      {apiReady && artworks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
          {artworks.map((artwork, i) => (
            <ArtworkCard key={artwork.id} artwork={artwork} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
