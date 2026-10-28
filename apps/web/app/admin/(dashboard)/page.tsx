import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { adminListArtworks } from "@/lib/admin";
import { mediaUrl } from "@/lib/media";
import { deleteArtwork, moveArtwork, setPublished } from "@/app/admin/actions";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function AdminArtworksPage() {
  const artworks = await adminListArtworks();
  const link = "text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors";
  const arrow =
    "p-1 text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-25 disabled:pointer-events-none";

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-2xl text-[var(--color-text)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Artworks
        </h1>
        <Link
          href="/admin/artworks/new"
          className="inline-flex items-center px-4 py-2 text-sm bg-[var(--color-text)] text-white rounded hover:opacity-80 transition-opacity"
        >
          + New Artwork
        </Link>
      </div>

      {artworks.length === 0 ? (
        <div className="py-16 text-center border border-[var(--color-border)] rounded">
          <p className="text-[var(--color-muted)]">No artworks yet.</p>
          <Link
            href="/admin/artworks/new"
            className="mt-4 inline-block text-sm text-[var(--color-text)] underline underline-offset-2"
          >
            Add your first artwork
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-[var(--color-muted)]">
            The order here is the order on the site. Use the arrows to rearrange.
          </p>
          <ul className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded bg-white">
            {artworks.map((artwork, i) => {
              const img = artwork.images[0];
              return (
                <li key={artwork.id} className="px-3 py-3 flex items-center gap-3">
                  <div className="flex flex-col">
                    <form action={moveArtwork.bind(null, artwork.id, -1)}>
                      <button className={arrow} disabled={i === 0} aria-label={`Move ${artwork.title} up`}>
                        <ChevronUp size={16} />
                      </button>
                    </form>
                    <form action={moveArtwork.bind(null, artwork.id, 1)}>
                      <button
                        className={arrow}
                        disabled={i === artworks.length - 1}
                        aria-label={`Move ${artwork.title} down`}
                      >
                        <ChevronDown size={16} />
                      </button>
                    </form>
                  </div>

                  <div className="w-14 h-14 shrink-0 rounded overflow-hidden bg-[var(--color-surface-raised)]">
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl(img, "thumb")} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/admin/artworks/${artwork.id}`}
                        className="text-sm font-medium text-[var(--color-text)] truncate hover:underline"
                      >
                        {artwork.title}
                      </Link>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          artwork.published
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-[var(--color-surface-raised)] text-[var(--color-muted)]"
                        }`}
                      >
                        {artwork.published ? "Published" : "Draft"}
                      </span>
                      {artwork.featured && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-accent-light)] text-[var(--color-text)]">
                          Featured
                        </span>
                      )}
                      <AvailabilityBadge availability={artwork.availability} />
                    </div>
                    <div className="mt-0.5 flex gap-3 text-xs text-[var(--color-muted)]">
                      {artwork.year && <span>{artwork.year}</span>}
                      {artwork.medium && <span>{artwork.medium}</span>}
                      {artwork.price && <span>{artwork.price}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <form action={setPublished.bind(null, artwork.id, !artwork.published)}>
                      <button className={link}>{artwork.published ? "Unpublish" : "Publish"}</button>
                    </form>
                    {artwork.published && (
                      <Link href={`/gallery/${artwork.slug}`} target="_blank" className={link}>
                        View ↗
                      </Link>
                    )}
                    <Link href={`/admin/artworks/${artwork.id}`} className={link}>
                      Edit
                    </Link>
                    <form action={deleteArtwork.bind(null, artwork.id)}>
                      <ConfirmButton
                        message={`Delete "${artwork.title}" and its images? This cannot be undone.`}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        Delete
                      </ConfirmButton>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
