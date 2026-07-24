"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// 1. تسجيل تحصيل من عميل (يذهب لعهدة المحصل)
export async function createCollection(formData: {
  customer_id: string;
  amount: number;
  payment_method: string;
  notes: string;
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  if (formData.amount <= 0) return { error: "المبلغ يجب أن يكون أكبر من صفر" };

  const { error } = await supabase.from("collections").insert({
    collector_id: session.user.id,
    customer_id: formData.customer_id || null,
    amount: Number(formData.amount),
    payment_method: formData.payment_method,
    notes: formData.notes,
    status: "COLLECTED",
    created_by: session.user.id
  });

  if (error) return { error: "فشل تسجيل التحصيل: " + error.message };

  revalidatePath("/collectors");
  return { success: true };
}

// 2. تسوية عهدة (تحويل من رصيد المحصل إلى الصندوق)
export async function settleCollector(formData: {
  collector_id: string;
  amount: number;
  notes: string;
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  // 1. حساب رصيد المحصل الحالي
  const { data: collections } = await supabase.from("collections").select("amount").eq("collector_id", formData.collector_id).eq("status", "COLLECTED");
  const totalCollected = collections?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

  const { data: settlements } = await supabase.from("collector_settlements").select("amount").eq("collector_id", formData.collector_id);
  const totalSettled = settlements?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
  const currentBalance = totalCollected - totalSettled;

  if (formData.amount > currentBalance) {
    return { error: `المبلغ يتجاوز رصيد المحصل الحالي (${currentBalance.toLocaleString()})` };
  }

  // 2. إنشاء سجل التسوية
  const { data: settlement, error: settleError } = await supabase
    .from("collector_settlements")
    .insert({
      collector_id: formData.collector_id,
      amount: Number(formData.amount),
      notes: formData.notes,
      created_by: session.user.id
    })
    .select("id")
    .single();

  if (settleError) return { error: "فشل إنشاء التسوية" };

  // 3. إضافة المبلغ للصندوق (Cash In)
  const { error: cashError } = await supabase
    .from("cash_transactions")
    .insert({
      type: "IN",
      amount: Number(formData.amount),
      reference_type: "COLLECTION_SETTLEMENT",
      reference_id: settlement.id,
      notes: `تسوية عهدة محصل`,
      created_by: session.user.id
    });

  if (cashError) return { error: "تم تسجيل التسوية لكن فشل تحديث الصندوق" };

  revalidatePath("/collectors");
  return { success: true };
}
