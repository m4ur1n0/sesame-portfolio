import type { Metadata } from "next";
import Link from "next/link";
import { getPurchaseArtworks, isApiConfigured } from "@/lib/api";
import { mediaUrl } from "@/lib/api";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Purchase",
  description: `Original works available for purchase by ${SITE.name}.`,
};

export const revalidate = 60;

export default async function PurchasePage() {
  const artworks = await getPurchaseArtworks();
  const apiReady = isApiConfigured();

  const available = artworks.filter((a) => a.availability === "available");
  const other = artworks.filter((a) => a.availability !== "available");

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <header className="max-w-2xl mb-16">
        <h1
          className="text-3xl sm:text-4xl text-[var(--color-text)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Purchase
        </h1>
        <p className="mt-4 text-[var(--color-muted)] leading-relaxed">
          {SITE.purchaseNote}
        </p>
      </header>

      {!apiReady && (
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-6 py-10 text-center">
          <p className="text-[var(--color-muted)] text-sm">
            API not configured. Set{" "}
            <code className="font-mono text-xs bg-[var(--color-border)] px-1 rounded">
              NEXT_PUBLIC_API_BASE_URL
            </code>{" "}
            to see available works.
          </p>
        </div>
      )}

      {apiReady && artworks.length === 0 && (
        <div className="py-24 text-center">
          <p className="text-[var(--color-muted)]">No works available at this time.</p>
          <p className="mt-2 text-sm text-[var(--color-subtle)]">
            Check back soon, or{" "}
            <Link
              href="/contact"
              className="underline underline-offset-2 hover:text-[var(--color-text)] transition-colors"
            >
              get in touch
            </Link>{" "}
            about commission work.
          </p>
        </div>
      )}

      {apiReady && artworks.length > 0 && (
        <div className="space-y-16">
          {/* available works */}
          {available.length > 0 && (
            <section aria-labelledby="available-heading">
              <h2
                id="available-heading"
                className="text-xl text-[var(--color-text)] mb-8 pb-3 border-b border-[var(--color-border)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Available
              </h2>
              <div className="space-y-0 divide-y divide-[var(--color-border)]">
                {available.map((artwork) => {
                  const imgUrl = artwork.hero_media_id
                    ? mediaUrl(artwork.hero_media_id)
                    : null;
                  return (
                    <div
                      key={artwork.id}
                      className="py-8 grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6 items-start"
                    >
                      {/* thumbnail */}
                      <Link href={`/gallery/${artwork.slug}`} tabIndex={-1} aria-hidden="true">
                        <div className="w-full aspect-[4/3] sm:w-48 sm:h-36 overflow-hidden rounded bg-[var(--color-surface-raised)] shrink-0">
                          {imgUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imgUrl}
                              alt={artwork.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-[var(--color-subtle)] text-xs">No image</span>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* info */}
                      <div className="space-y-3">
                        <div>
                          <Link
                            href={`/gallery/${artwork.slug}`}
                            className="hover:opacity-70 transition-opacity"
                          >
                            <h3
                              className="text-xl text-[var(--color-text)]"
                              style={{ fontFamily: "var(--font-display)" }}
                            >
                              {artwork.title}
                            </h3>
                          </Link>
                          <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-[var(--color-muted)]">
                            {artwork.year && <span>{artwork.year}</span>}
                            {artwork.medium && <span>{artwork.medium}</span>}
                            {artwork.dimensions && <span>{artwork.dimensions}</span>}
                          </div>
                        </div>

                        {artwork.price && (
                          <p className="text-lg font-medium text-[var(--color-text)]">
                            {artwork.price}
                          </p>
                        )}

                        {artwork.excerpt && (
                          <p className="text-sm text-[var(--color-muted)] leading-relaxed line-clamp-2">
                            {artwork.excerpt}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 items-center pt-1">
                          <Link
                            href={`/contact?artwork=${encodeURIComponent(artwork.slug)}&title=${encodeURIComponent(artwork.title)}`}
                            className="inline-flex items-center px-4 py-2 text-sm bg-[var(--color-text)] text-white rounded hover:opacity-80 transition-opacity"
                          >
                            Purchase or Inquire
                          </Link>
                          <Link
                            href={`/gallery/${artwork.slug}`}
                            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                          >
                            View details →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* other works (sold, reserved, etc.) */}
          {other.length > 0 && (
            <section aria-labelledby="other-heading">
              <h2
                id="other-heading"
                className="text-xl text-[var(--color-text)] mb-8 pb-3 border-b border-[var(--color-border)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Previous Works
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {other.map((artwork) => {
                  const imgUrl = artwork.hero_media_id
                    ? mediaUrl(artwork.hero_media_id)
                    : null;
                  return (
                    <Link
                      key={artwork.id}
                      href={`/gallery/${artwork.slug}`}
                      className="group block"
                    >
                      <div className="aspect-[4/3] overflow-hidden rounded bg-[var(--color-surface-raised)]">
                        {imgUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imgUrl}
                            alt={artwork.title}
                            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[var(--color-subtle)] text-xs">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text)] group-hover:opacity-70 transition-opacity">
                            {artwork.title}
                          </p>
                          {artwork.year && (
                            <p className="text-xs text-[var(--color-muted)]">{artwork.year}</p>
                          )}
                        </div>
                        <AvailabilityBadge availability={artwork.availability} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* shipping + commission info */}
      <div className="mt-20 pt-12 border-t border-[var(--color-border)] grid sm:grid-cols-2 gap-10 max-w-2xl">
        <div>
          <h3
            className="text-base text-[var(--color-text)] mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Shipping
          </h3>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            {SITE.shippingNote}
          </p>
        </div>
        <div>
          <h3
            className="text-base text-[var(--color-text)] mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Commissions
          </h3>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            {SITE.commissionNote}
          </p>
          <Link
            href="/contact"
            className="mt-3 inline-block text-sm text-[var(--color-text)] underline underline-offset-2 decoration-[var(--color-border)] hover:decoration-[var(--color-text)] transition-colors"
          >
            Start a conversation →
          </Link>
        </div>
      </div>
    </div>
  );
}
