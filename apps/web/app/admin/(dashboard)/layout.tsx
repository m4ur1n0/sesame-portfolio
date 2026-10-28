import { AdminNav } from "@/components/AdminNav";
import { adminUnreadCount } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // adminUnreadCount redirects to /admin/login without a valid session
  const unread = await adminUnreadCount();
  return (
    <>
      <AdminNav unread={unread} />
      <div className="flex-1">{children}</div>
    </>
  );
}
