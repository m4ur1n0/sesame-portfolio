import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { env, getPublishedBySlug } from "@/lib/db";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ artwork?: string }>;
}

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${SITE.name}.`,
};

export default async function ContactPage({ searchParams }: Props) {
  const { artwork: slug } = await searchParams;
  // title comes from the database, never the URL, so links can't put arbitrary text on the page
  const artwork = slug ? await getPublishedBySlug(slug) : null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="max-w-xl">
        <h1
          className="text-3xl sm:text-4xl text-[var(--color-text)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Contact
        </h1>
        <p className="mt-4 mb-10 text-[var(--color-muted)] leading-relaxed">
          {SITE.contactIntro}
        </p>

        <ContactForm
          turnstileSiteKey={env().TURNSTILE_SITE_KEY}
          artwork={artwork ? { slug: artwork.slug, title: artwork.title } : undefined}
        />

        <div className="mt-12 pt-8 border-t border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-muted)]">
            You can also reach me at{" "}
            <a
              href={`mailto:${SITE.email}`}
              className="text-[var(--color-text)] underline underline-offset-2 decoration-[var(--color-border)] hover:decoration-[var(--color-text)] transition-colors"
            >
              {SITE.email}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
