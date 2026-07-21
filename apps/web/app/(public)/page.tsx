import Link from "next/link";
import { getFeaturedArtworks, isApiConfigured } from "@/lib/api";
import { ArtworkCard } from "@/components/ArtworkCard";
import { SITE } from "@/lib/site";

export const revalidate = 60;

export default async function HomePage() {
  const featured = await getFeaturedArtworks();
  const apiReady = isApiConfigured();

  return (
    <div>
      {/* hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-xl animate-fade-up">
          <h1
            className="text-4xl sm:text-5xl text-[var(--color-text)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {SITE.heroHeadline}
          </h1>
          <p className="mt-5 text-[var(--color-muted)] leading-relaxed">
            {SITE.heroSubtext}
          </p>
          <div className="mt-8 flex gap-4 flex-wrap">
            <Link
              href="/gallery"
              className="inline-flex items-center px-5 py-2.5 text-sm bg-[var(--color-text)] text-white rounded hover:opacity-80 transition-opacity"
            >
              View Gallery
            </Link>
            <Link
              href="/purchase"
              className="inline-flex items-center px-5 py-2.5 text-sm border border-[var(--color-border)] text-[var(--color-text)] rounded hover:border-[var(--color-border-strong)] transition-colors"
            >
              Works for Sale
            </Link>
          </div>
        </div>
      </section>

      {/* featured works */}
      {apiReady && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="flex items-baseline justify-between mb-8">
            <h2
              className="text-2xl text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Selected Work
            </h2>
            <Link
              href="/gallery"
              className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              All works →
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {featured.map((artwork, i) => (
                <ArtworkCard key={artwork.id} artwork={artwork} priority={i < 3} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-[var(--color-muted)]">
              <p>No featured works yet.</p>
            </div>
          )}
        </section>
      )}

      {/* about */}
      <section
        className="border-t border-[var(--color-border)]"
        id="about"
        aria-labelledby="about-heading"
      >
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <h2
              id="about-heading"
              className="text-2xl text-[var(--color-text)] mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              About
            </h2>
            <p className="text-[var(--color-muted)] leading-relaxed whitespace-pre-line">
              {SITE.bio}
            </p>
            <div className="mt-8">
              <Link
                href="/contact"
                className="text-sm text-[var(--color-text)] underline underline-offset-4 decoration-[var(--color-border)] hover:decoration-[var(--color-text)] transition-colors"
              >
                Get in touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
