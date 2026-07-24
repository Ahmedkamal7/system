"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type SupplierFormData = {
  id?: string;
  name: string;
  phone: string;
  address: string;
  opening_balance: number;
  notes: string;
};

export async function upsertSupplier(formData: SupplierFormData) {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const supplierData = {
    name: formData.name,
    phone: formData.phone,
    address: formData.address,
    opening_balance: Number(formData.opening_balance) || 0,
    notes: formData.notes,
  };

  if (formData.id) {
    const { error } = await supabase
      .from("suppliers")
      .update(supplierData)
      .eq("id", formData.id);
      
    if (error) return { error: "حدث خطأ أثناء تحديث بيانات المورد" };
  } else {
    const { error } = await supabase
      .from("suppliers")
      .insert(supplierData);
      
    if (error) return { error: "حدث خطأ أثناء إضافة المورد" };
  }

  revalidatePath("/suppliers");
  return { success: true };
}

export async function softDeleteSupplier(id: string) {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { error } = await supabase
    .from("suppliers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: "حدث خطأ أثناء حذف المورد" };

  revalidatePath("/suppliers");
  return { success: true };
}
