"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addCashTransaction(formData: {
  box_id: string;
  type: "IN" | "OUT";
  amount: number;
  notes: string;
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  if (formData.amount <= 0) return { error: "المبلغ يجب أن يكون أكبر من صفر" };

  const { data: box } = await supabase.from("cash_boxes").select("balance").eq("id", formData.box_id).single();
  if (formData.type === "OUT" && box.balance < formData.amount) {
    return { error: "رصيد الصندوق غير كافي للسحب" };
  }

  const { error: txError } = await supabase.from("cash_transactions").insert({
    box_id: formData.box_id,
    type: formData.type,
    amount: Number(formData.amount),
    notes: formData.notes,
    created_by: session.user.id
  });

  if (txError) return { error: "فشل تسجيل الحركة" };

  const newBalance = formData.type === "IN" 
    ? box.balance + Number(formData.amount) 
    : box.balance - Number(formData.amount);

  await supabase.from("cash_boxes").update({ balance: newBalance }).eq("id", formData.box_id);

  revalidatePath("/cashbox");
  return { success: true };
}

export async function transferCash(formData: {
  from_box_id: string;
  to_box_id: string;
  amount: number;
  notes: string;
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  if (formData.from_box_id === formData.to_box_id) return { error: "لا يمكن التحويل لنفس الصندوق" };

  const { data: fromBox } = await supabase.from("cash_boxes").select("balance").eq("id", formData.from_box_id).single();
  if (fromBox.balance < formData.amount) return { error: "رصيد الصندوق المصدر غير كافي" };

  // خصم من المصدر
  await supabase.from("cash_transactions").insert({
    box_id: formData.from_box_id,
    type: "OUT",
    amount: Number(formData.amount),
    notes: `تحويل إلى صندوق آخر: ${formData.notes}`,
    created_by: session.user.id
  });
  await supabase.from("cash_boxes").update({ balance: fromBox.balance - Number(formData.amount) }).eq("id", formData.from_box_id);

  // إضافة للوجهة
  const { data: toBox } = await supabase.from("cash_boxes").select("balance").eq("id", formData.to_box_id).single();
  await supabase.from("cash_transactions").insert({
    box_id: formData.to_box_id,
    type: "IN",
    amount: Number(formData.amount),
    notes: `تحويل من صندوق آخر: ${formData.notes}`,
    created_by: session.user.id
  });
  await supabase.from("cash_boxes").update({ balance: toBox.balance + Number(formData.amount) }).eq("id", formData.to_box_id);

  revalidatePath("/cashbox");
  return { success: true };
}

export async function dailyClosing(formData: { box_id: string; notes: string }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const today = new Date().toISOString().split('T')[0];

  const { data: existingClosing } = await supabase
    .from("cash_closings")
    .select("id")
    .eq("box_id", formData.box_id)
    .eq("closing_date", today)
    .single();

  if (existingClosing) return { error: "تم إقفال هذا الصندوق اليوم بالفعل" };

  const { data: box } = await supabase.from("cash_boxes").select("balance").eq("id", formData.box_id).single();
  
  const { data: txns } = await supabase
    .from("cash_transactions")
    .select("type, amount")
    .eq("box_id", formData.box_id)
    .gte("created_at", `${today}T00:00:00`)
    .lte("created_at", `${today}T23:59:59`);

  const totalIn = txns?.filter(t => t.type === "IN").reduce((s, t) => s + Number(t.amount), 0) || 0;
  const totalOut = txns?.filter(t => t.type === "OUT").reduce((s, t) => s + Number(t.amount), 0) || 0;
  const openingBalance = box.balance - totalIn + totalOut;

  const { error: closeError } = await supabase.from("cash_closings").insert({
    closing_date: today,
    box_id: formData.box_id,
    opening_balance: openingBalance,
    closing_balance: box.balance,
    total_in: totalIn,
    total_out: totalOut,
    notes: formData.notes,
    created_by: session.user.id
  });

  if (closeError) return { error: "فشل الإقفال اليومي" };

  revalidatePath("/cashbox");
  return { success: true };
}
