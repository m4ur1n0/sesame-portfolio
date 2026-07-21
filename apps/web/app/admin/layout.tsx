import type { Metadata } from "next";
import { AdminNav } from "@/components/AdminNav";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s — Admin",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // admin has its own chrome separate from the public site
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <AdminNav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
