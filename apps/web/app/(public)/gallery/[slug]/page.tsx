import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getArtworkBySlug } from "@/lib/api";
import { ArtworkDetail } from "@/components/ArtworkDetail";
import { SITE } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artwork = await getArtworkBySlug(slug);
  if (!artwork) return { title: "Artwork not found" };

  return {
    title: artwork.title,
    description: artwork.excerpt ?? `${artwork.title} — ${artwork.medium ?? "work"} by ${SITE.name}`,
  };
}

export const revalidate = 60;

export default async function ArtworkPage({ params }: Props) {
  const { slug } = await params;
  const artwork = await getArtworkBySlug(slug);

  if (!artwork) notFound();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <nav aria-label="Breadcrumb" className="mb-8">
        <Link
          href="/gallery"
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          ← Gallery
        </Link>
      </nav>
      <ArtworkDetail artwork={artwork} />
    </div>
  );
}
