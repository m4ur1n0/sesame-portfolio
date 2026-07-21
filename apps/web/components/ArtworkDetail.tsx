"use client";

import { useState } from "react";
import Link from "next/link";
import { mediaUrl } from "@/lib/api";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { Lightbox } from "@/components/Lightbox";
import { Button } from "@/components/ui/button";
import type { Artwork } from "@/lib/types";

interface Props {
  artwork: Artwork;
}

export function ArtworkDetail({ artwork }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // build full image key list
  const additionalIds: string[] = (() => {
    if (!artwork.additional_media_ids) return [];
    try {
      return JSON.parse(artwork.additional_media_ids) as string[];
    } catch {
      return [];
    }
  })();

  const allKeys = [
    ...(artwork.hero_media_id ? [artwork.hero_media_id] : []),
    ...additionalIds,
  ];

  const heroKey = artwork.hero_media_id ?? null;

  const canPurchase =
    artwork.availability === "available" || artwork.availability === "inquire";

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* images */}
        <div className="space-y-3">
          {/* hero image */}
          {heroKey ? (
            <button
              className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
              aria-label="View full image"
              onClick={() => setLightboxIndex(0)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(heroKey)}
                alt={artwork.title}
                className="w-full rounded object-contain max-h-[70vh] bg-[var(--color-surface-raised)] cursor-zoom-in"
              />
            </button>
          ) : (
            <div className="w-full aspect-[4/5] rounded bg-[var(--color-surface-raised)] flex items-center justify-center">
              <span className="text-[var(--color-subtle)] text-sm">No image</span>
            </div>
          )}

          {/* additional thumbnails */}
          {additionalIds.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {additionalIds.map((key, i) => (
                <button
                  key={key}
                  onClick={() => setLightboxIndex(i + 1)}
                  aria-label={`View image ${i + 2}`}
                  className="w-16 h-16 overflow-hidden rounded border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(key)}
                    alt={`${artwork.title} detail ${i + 2}`}
                    className="w-full h-full object-cover"
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

            {/* metadata */}
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

          {/* description */}
          {artwork.excerpt && (
            <div>
              <p className="text-[var(--color-muted)] leading-relaxed">{artwork.excerpt}</p>
            </div>
          )}

          {artwork.body_html && (
            <div
              className="prose prose-sm text-[var(--color-muted)] max-w-none"
              dangerouslySetInnerHTML={{ __html: artwork.body_html }}
            />
          )}

          {/* artist notes */}
          {artwork.artist_notes && (
            <div className="border-t border-[var(--color-border)] pt-5">
              <h2
                className="text-sm font-medium text-[var(--color-muted)] mb-2 uppercase tracking-wider"
              >
                Artist Notes
              </h2>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                {artwork.artist_notes}
              </p>
            </div>
          )}

          {/* purchase / inquiry */}
          {canPurchase && (
            <div className="border-t border-[var(--color-border)] pt-5 space-y-3">
              {artwork.purchase_instructions && (
                <p className="text-sm text-[var(--color-muted)]">
                  {artwork.purchase_instructions}
                </p>
              )}
              <Button asChild>
                <Link
                  href={`/contact?artwork=${encodeURIComponent(artwork.slug)}&title=${encodeURIComponent(artwork.title)}`}
                >
                  {artwork.availability === "available"
                    ? "Purchase or Inquire"
                    : "Inquire"}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* lightbox */}
      {lightboxIndex !== null && allKeys.length > 0 && (
        <Lightbox
          keys={allKeys}
          currentIndex={lightboxIndex}
          alt={artwork.title}
          onClose={() => setLightboxIndex(null)}
          onPrev={() =>
            setLightboxIndex((i) =>
              i !== null ? (i - 1 + allKeys.length) % allKeys.length : 0,
            )
          }
          onNext={() =>
            setLightboxIndex((i) =>
              i !== null ? (i + 1) % allKeys.length : 0,
            )
          }
        />
      )}
    </div>
  );
}
