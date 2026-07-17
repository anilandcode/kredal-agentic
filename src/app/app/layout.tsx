import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace, getUserWorkspaces } from "@/lib/data/workspaces";
import { AppTopbar } from "@/components/kredal/app-topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Cheap user-scoped read: platform_admins only exposes the caller's own row.
  const [workspaces, active, { data: adminRow }] = await Promise.all([
    getUserWorkspaces(),
    getActiveWorkspace(),
    supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppTopbar
        email={user.email ?? ""}
        workspaces={workspaces.map((w) => ({
          id: w.id,
          name: w.name,
          workspace_type: w.workspace_type,
        }))}
        activeWorkspaceId={active?.id ?? null}
        showAdminLink={!!adminRow}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
