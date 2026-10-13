import type { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/admin/guard";
import { AdminTopbar } from "@/components/kredal/admin/admin-topbar";

export const metadata: Metadata = {
  title: "Admin — Kredal",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Non-admins (and anyone unauthenticated who slips past middleware) get a
  // 404 — the area's existence stays hidden.
  const { user } = await requirePlatformAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminTopbar email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
