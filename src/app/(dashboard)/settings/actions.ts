export async function createUser(formData: {
  email: string;
  password: string;
  username: string;
  role_id: string;
}) {
  const { error } = await checkAdmin();
  if (error) return { error };

  // التحقق من وجود المفتاح السري
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "مفتاح Service Role غير موجود في إعدادات Vercel. يرجى إضافته." };
  }

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

  if (authError) {
    return { error: `فشل إنشاء الحساب: ${authError.message}` };
  }

  // 2. إنشاء الملف الشخصي (Profile)
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: authData.user.id,
      username: formData.username,
      role_id: formData.role_id,
      is_active: true
    });

  if (profileError) {
    return { error: "تم إنشاء الحساب لكن فشل إضافة الملف الشخصي: " + profileError.message };
  }

  revalidatePath("/settings");
  return { success: true };
}
