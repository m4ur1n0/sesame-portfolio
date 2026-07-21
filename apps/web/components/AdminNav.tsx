"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SITE } from "@/lib/site";

export function AdminNav() {
  const router = useRouter();

  function handleLogout() {
    sessionStorage.removeItem("admin_token");
    router.replace("/admin/login");
  }

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
            <Link href="/admin/artworks" className="hover:text-[var(--color-text)] transition-colors">
              Artworks
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
          <button
            onClick={handleLogout}
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
