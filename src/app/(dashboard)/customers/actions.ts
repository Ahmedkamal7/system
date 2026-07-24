"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CustomerFormData = {
  id?: string;
  name: string;
  phone: string;
  address: string;
  credit_limit: number;
  opening_balance: number;
  notes: string;
};

export async function upsertCustomer(formData: CustomerFormData) {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const customerData = {
    name: formData.name,
    phone: formData.phone,
    address: formData.address,
    credit_limit: Number(formData.credit_limit) || 0,
    opening_balance: Number(formData.opening_balance) || 0,
    notes: formData.notes,
  };

  if (formData.id) {
    const { error } = await supabase
      .from("customers")
      .update(customerData)
      .eq("id", formData.id);
      
    if (error) return { error: "حدث خطأ أثناء تحديث بيانات العميل" };
  } else {
    const { error } = await supabase
      .from("customers")
      .insert(customerData);
      
            if (error) return { error: error.message };
  }

  revalidatePath("/customers");
  return { success: true };
}

export async function softDeleteCustomer(id: string) {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { error } = await supabase
    .from("customers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: "حدث خطأ أثناء حذف العميل" };

  revalidatePath("/customers");
  return { success: true };
}
