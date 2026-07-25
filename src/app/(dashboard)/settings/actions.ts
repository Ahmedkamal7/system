"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function checkAdmin() {
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
    return { error: "ليس لديك صلاحية الوصول لهذه الصفحة", session: null };
  }
  return { error: null, session };
}

export async function updateUserRole(profileId: string, roleId: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const supabase = createClient();
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role_id: roleId })
    .eq("id", profileId);

  if (updateError) return { error: "فشل تحديث الدور" };
  revalidatePath("/settings");
  return { success: true };
}

export async function toggleUserStatus(profileId: string, isActive: boolean) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const supabase = createClient();
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", profileId);

  if (updateError) return { error: "فشل تحديث حالة المستخدم" };
  revalidatePath("/settings");
  return { success: true };
}

export async function saveSettings(formData: Record<string, string>) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const supabase = createClient();
  
  for (const [key, value] of Object.entries(formData)) {
    const { error: upsertError } = await supabase
      .from("settings")
      .upsert({ key, value }, { onConflict: "key" });
      
    if (upsertError) return { error: `فشل حفظ الإعداد: ${key}` };
  }

  revalidatePath("/settings");
  return { success: true };
}
