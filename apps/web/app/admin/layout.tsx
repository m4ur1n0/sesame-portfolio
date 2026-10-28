import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s — Admin",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // admin has its own chrome separate from the public site
  return <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">{children}</div>;
}
