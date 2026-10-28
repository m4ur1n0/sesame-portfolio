import Link from "next/link";
import { mediaUrl } from "@/lib/media";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import type { Artwork } from "@/lib/types";

interface Props {
  artwork: Artwork;
  priority?: boolean;
}

export function ArtworkCard({ artwork, priority }: Props) {
  const img = artwork.images[0];

  return (
    <Link
      href={`/gallery/${artwork.slug}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
    >
      {/* image area */}
      <div className="relative overflow-hidden bg-[var(--color-surface-raised)] aspect-[4/5]">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(img, "thumb")}
            alt={img.alt || artwork.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            loading={priority ? "eager" : "lazy"}
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[var(--color-subtle)] text-sm">No image</span>
          </div>
        )}

        {/* availability overlay on hover */}
        <div className="absolute bottom-0 inset-x-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-gradient-to-t from-black/40 to-transparent">
          <AvailabilityBadge availability={artwork.availability} />
        </div>
      </div>

      {/* text */}
      <div className="pt-3 pb-1">
        <h3
          className="text-base font-normal text-[var(--color-text)] group-hover:opacity-70 transition-opacity"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {artwork.title}
        </h3>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-[var(--color-muted)]">
          {artwork.year && <span>{artwork.year}</span>}
          {artwork.medium && <span>{artwork.medium}</span>}
        </div>
        {artwork.availability === "available" && artwork.price && (
          <p className="mt-1 text-sm text-[var(--color-text)]">{artwork.price}</p>
        )}
      </div>
    </Link>
  );
}
