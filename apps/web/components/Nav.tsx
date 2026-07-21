"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";

const links = [
  { href: "/", label: "Home" },
  { href: "/gallery", label: "Gallery" },
  { href: "/purchase", label: "Purchase" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-bg)]/90 backdrop-blur-sm border-b border-[var(--color-border)]">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        {/* wordmark */}
        <Link
          href="/"
          onClick={closeMenu}
          className="font-display text-lg tracking-tight text-[var(--color-text)] hover:opacity-70 transition-opacity"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {SITE.name}
        </Link>

        {/* desktop nav */}
        <nav aria-label="Primary navigation" className="hidden md:flex gap-8">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-sm tracking-wide transition-colors",
                pathname === href
                  ? "text-[var(--color-text)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* mobile toggle */}
        <button
          className="md:hidden p-2 -mr-2 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          className="md:hidden absolute inset-x-0 top-full bg-[var(--color-bg)] border-b border-[var(--color-border)] shadow-sm"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <nav className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={closeMenu}
                className={cn(
                  "py-3 text-base border-b border-[var(--color-border)] last:border-0 transition-colors",
                  pathname === href
                    ? "text-[var(--color-text)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
