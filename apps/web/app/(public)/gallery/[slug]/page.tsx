import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedBySlug } from "@/lib/db";
import { mediaUrl } from "@/lib/media";
import { ArtworkDetail } from "@/components/ArtworkDetail";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artwork = await getPublishedBySlug(slug);
  if (!artwork) return { title: "Artwork not found" };

  const description =
    artwork.description ?? `${artwork.title} — ${artwork.medium ?? "work"} by ${SITE.name}`;
  const image = artwork.images[0];

  return {
    title: artwork.title,
    description,
    alternates: { canonical: `/gallery/${artwork.slug}` },
    openGraph: {
      title: artwork.title,
      description,
      type: "article",
      images: image
        ? [{ url: mediaUrl(image, "large"), width: image.w, height: image.h, alt: image.alt || artwork.title }]
        : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary" },
  };
}

export default async function ArtworkPage({ params }: Props) {
  const { slug } = await params;
  const artwork = await getPublishedBySlug(slug);

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
