"use server";

import { createClient as createBrowserClient } from "@supabase/supabase-js"; // لاستخدام مفتاح service_role
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

export async function updateUsername(profileId: string, username: string) {
  const { error } = await checkAdmin();
  if (error) return { error };

  const supabase = createClient();
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", profileId);

  if (updateError) return { error: "فشل تحديث الاسم" };
  revalidatePath("/settings");
  return { success: true };
}

export async function createUser(formData: {
  email: string;
  password: string;
  username: string;
  role_id: string;
}) {
  const { error } = await checkAdmin();
  if (error) return { error };

  // إنشاء عميل مخصص باستخدام مفتاح service_role السري
  const supabaseAdmin = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 1. إنشاء حساب المصادقة (Auth)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true
  });

  if (authError) return { error: "فشل إنشاء الحساب: " + authError.message };

  // 2. إنشاء الملف الشخصي (Profile)
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: authData.user.id,
      username: formData.username,
      role_id: formData.role_id,
      is_active: true
    });

  if (profileError) return { error: "تم إنشاء الحساب لكن فشل إضافة الملف الشخصي: " + profileError.message };

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
