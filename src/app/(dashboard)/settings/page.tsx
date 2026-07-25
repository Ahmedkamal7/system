import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", session.user.id)
    .single();

  const roleData: any = profile?.roles;
  const userRole = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;

  if (userRole !== "Administrator") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 bg-danger/10 text-danger rounded-2xl">
          <h2 className="text-xl font-bold">طلب مرفوض</h2>
          <p>هذه الصفحة مخصصة للمدير فقط.</p>
        </div>
      </div>
    );
  }

  const [{ data: users }, { data: roles }, { data: settingsData }] = await Promise.all([
    supabase.from("profiles").select("id, username, full_name, role_id, is_active").order("created_at"),
    supabase.from("roles").select("id, name"),
    supabase.from("settings").select("key, value")
  ]);

  const settings: Record<string, string> = {};
  settingsData?.forEach(s => settings[s.key] = s.value);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary">الإعدادات</h1>
        <p className="text-text-secondary mt-1">إدارة المستخدمين وصلاحيات النظام</p>
      </div>
      <SettingsClient users={users || []} roles={roles || []} settings={settings} />
    </div>
  );
}
