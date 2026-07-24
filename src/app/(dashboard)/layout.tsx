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

  // تعديل هنا: معالجة حالة البيانات سواء كانت Object أو Array
  const rolesData: any = profile?.roles;
  const userRole = Array.isArray(rolesData) ? rolesData[0]?.name : rolesData?.name;
  const username = profile?.username || "مستخدم";

  return (
    <DashboardShell 
      username={username} 
      userRole={userRole || null}
    >
      {children}
    </DashboardShell>
  );
}
