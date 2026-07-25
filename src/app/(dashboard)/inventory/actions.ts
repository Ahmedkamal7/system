"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function transferStock(formData: {
  product_id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  quantity: number;
  notes: string;
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  // 1. التحقق من الرصيد المتاح في المخزن المصدر
  const { data: sourceLevel } = await supabase
    .from("inventory_levels")
    .select("quantity")
    .eq("product_id", formData.product_id)
    .eq("warehouse_id", formData.from_warehouse_id)
    .single();

  const availableQty = sourceLevel?.quantity || 0;

  // 2. إذا كانت الكمية المطلوبة أكبر من المتاح، ارفض العملية
  if (Number(formData.quantity) > availableQty) {
    return { error: `الكمية المطلوبة (${formData.quantity}) تتجاوز الرصيد المتاح (${availableQty})` };
  }

  // خصم من المخزن المصدر
  const { error: outError } = await supabase.from("stock_movements").insert({
    product_id: formData.product_id,
    warehouse_id: formData.from_warehouse_id,
    quantity_change: -Math.abs(Number(formData.quantity)),
    movement_type: "TRANSFER",
    reference_type: "TRANSFER_OUT",
    notes: `تحويل إلى مخزن آخر: ${formData.notes}`,
    created_by: session.user.id
  });
  if (outError) return { error: "فشل خصم الكمية من المخزن المصدر: " + outError.message };

  // إضافة للمخزن الوجهة
  const { error: inError } = await supabase.from("stock_movements").insert({
    product_id: formData.product_id,
    warehouse_id: formData.to_warehouse_id,
    quantity_change: Math.abs(Number(formData.quantity)),
    movement_type: "TRANSFER",
    reference_type: "TRANSFER_IN",
    notes: `تحويل من مخزن آخر: ${formData.notes}`,
    created_by: session.user.id
  });
  if (inError) return { error: "فشل إضافة الكمية للمخزن الوجهة: " + inError.message };

  revalidatePath("/inventory");
  return { success: true };
}

export async function adjustStock(formData: {
  product_id: string;
  warehouse_id: string;
  quantity_change: number;
  notes: string;
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { error: insertError } = await supabase.from("stock_movements").insert({
    product_id: formData.product_id,
    warehouse_id: formData.warehouse_id,
    quantity_change: Number(formData.quantity_change),
    movement_type: "ADJUSTMENT",
    notes: `تسوية مخزون: ${formData.notes}`,
    created_by: session.user.id
  });

  if (insertError) return { error: "حدث خطأ أثناء التسوية: " + insertError.message };

  revalidatePath("/inventory");
  return { success: true };
}
