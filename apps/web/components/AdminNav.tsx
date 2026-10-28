import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { SITE } from "@/lib/site";

export function AdminNav({ unread }: { unread: number }) {
  return (
    <header className="border-b border-[var(--color-border)] bg-white">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="text-sm font-medium text-[var(--color-text)] hover:opacity-70 transition-opacity"
          >
            {SITE.name} Admin
          </Link>
          <nav className="flex gap-4 text-sm text-[var(--color-muted)]">
            <Link href="/admin" className="hover:text-[var(--color-text)] transition-colors">
              Artworks
            </Link>
            <Link
              href="/admin/inbox"
              className="hover:text-[var(--color-text)] transition-colors inline-flex items-center gap-1.5"
            >
              Inbox
              {unread > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-[var(--color-accent)] text-white text-xs leading-5 text-center">
                  {unread}
                </span>
              )}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            target="_blank"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            View site ↗
          </Link>
          <form action={logoutAction}>
            <button className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
