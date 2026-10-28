"use client";

import { useState } from "react";
import Link from "next/link";
import { mediaUrl } from "@/lib/media";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { Lightbox } from "@/components/Lightbox";
import { Button } from "@/components/ui/button";
import type { Artwork } from "@/lib/types";

interface Props {
  artwork: Artwork;
}

export function ArtworkDetail({ artwork }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [hero, ...additional] = artwork.images;
  const count = artwork.images.length;

  const canPurchase =
    artwork.availability === "available" || artwork.availability === "inquire";

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* images */}
        <div className="space-y-3">
          {hero ? (
            <button
              className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
              aria-label="View full image"
              onClick={() => setLightboxIndex(0)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(hero, "large")}
                width={hero.w}
                height={hero.h}
                alt={hero.alt || artwork.title}
                className="w-full rounded object-contain max-h-[70vh] bg-[var(--color-surface-raised)] cursor-zoom-in"
              />
            </button>
          ) : (
            <div className="w-full aspect-[4/5] rounded bg-[var(--color-surface-raised)] flex items-center justify-center">
              <span className="text-[var(--color-subtle)] text-sm">No image</span>
            </div>
          )}

          {additional.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {additional.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setLightboxIndex(i + 1)}
                  aria-label={`View image ${i + 2}`}
                  className="w-16 h-16 overflow-hidden rounded border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(img, "thumb")}
                    alt={img.alt || `${artwork.title}, image ${i + 2}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1
                className="text-3xl sm:text-4xl text-[var(--color-text)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {artwork.title}
              </h1>
              <AvailabilityBadge availability={artwork.availability} className="mt-1 shrink-0" />
            </div>

            <dl className="mt-5 space-y-2 text-sm">
              {artwork.year && (
                <div className="flex gap-3">
                  <dt className="w-24 text-[var(--color-muted)] shrink-0">Year</dt>
                  <dd className="text-[var(--color-text)]">{artwork.year}</dd>
                </div>
              )}
              {artwork.medium && (
                <div className="flex gap-3">
                  <dt className="w-24 text-[var(--color-muted)] shrink-0">Medium</dt>
                  <dd className="text-[var(--color-text)]">{artwork.medium}</dd>
                </div>
              )}
              {artwork.dimensions && (
                <div className="flex gap-3">
                  <dt className="w-24 text-[var(--color-muted)] shrink-0">Dimensions</dt>
                  <dd className="text-[var(--color-text)]">{artwork.dimensions}</dd>
                </div>
              )}
              {artwork.availability === "available" && artwork.price && (
                <div className="flex gap-3">
                  <dt className="w-24 text-[var(--color-muted)] shrink-0">Price</dt>
                  <dd className="text-[var(--color-text)] font-medium">{artwork.price}</dd>
                </div>
              )}
            </dl>
          </div>

          {artwork.description && (
            <p className="text-[var(--color-muted)] leading-relaxed whitespace-pre-line">
              {artwork.description}
            </p>
          )}

          {artwork.artist_notes && (
            <div className="border-t border-[var(--color-border)] pt-5">
              <h2 className="text-sm font-medium text-[var(--color-muted)] mb-2 uppercase tracking-wider">
                Artist Notes
              </h2>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed whitespace-pre-line">
                {artwork.artist_notes}
              </p>
            </div>
          )}

          {canPurchase && (
            <div className="border-t border-[var(--color-border)] pt-5 space-y-3">
              {artwork.purchase_instructions && (
                <p className="text-sm text-[var(--color-muted)]">
                  {artwork.purchase_instructions}
                </p>
              )}
              <Button asChild>
                <Link href={`/contact?artwork=${encodeURIComponent(artwork.slug)}`}>
                  {artwork.availability === "available" ? "Purchase or Inquire" : "Inquire"}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {lightboxIndex !== null && count > 0 && (
        <Lightbox
          images={artwork.images}
          currentIndex={lightboxIndex}
          alt={artwork.title}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => ((i ?? 0) - 1 + count) % count)}
          onNext={() => setLightboxIndex((i) => ((i ?? 0) + 1) % count)}
        />
      )}
    </div>
  );
}
