import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, role_id, roles(name)")
    .eq("id", session.user.id)
    .single();

  const userRole = profile?.roles?.[0]?.name || null;
  const username = profile?.username || "مستخدم";

  return (
    <DashboardShell 
      username={username} 
      userRole={userRole}
    >
      {children}
    </DashboardShell>
  );
}
