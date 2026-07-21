import Link from "next/link";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span
            className="text-sm font-medium"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {SITE.name}
          </span>
          {SITE.location && (
            <span className="text-xs text-[var(--color-muted)]">
              {SITE.location}
            </span>
          )}
        </div>

        <nav
          className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--color-muted)]"
          aria-label="Footer navigation"
        >
          <Link href="/gallery" className="hover:text-[var(--color-text)] transition-colors">
            Gallery
          </Link>
          <Link href="/purchase" className="hover:text-[var(--color-text)] transition-colors">
            Purchase
          </Link>
          <Link href="/contact" className="hover:text-[var(--color-text)] transition-colors">
            Contact
          </Link>
          {SITE.instagram && (
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--color-text)] transition-colors"
            >
              Instagram
            </a>
          )}
        </nav>

        <p className="text-xs text-[var(--color-subtle)]">{SITE.copyright}</p>
      </div>
    </footer>
  );
}
