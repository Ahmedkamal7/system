"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface PurchaseItemData {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export async function createPurchase(formData: {
  supplier_id: string;
  warehouse_id: string;
  invoice_number: string;
  notes: string;
  items: PurchaseItemData[];
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  if (formData.items.length === 0) return { error: "يجب إضافة منتج واحد على الأقل" };

  // 1. إنشاء رأس الفاتورة
  const totalAmount = formData.items.reduce((sum, item) => sum + Number(item.total_price), 0);
  
  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({
      supplier_id: formData.supplier_id || null,
      warehouse_id: formData.warehouse_id,
      invoice_number: formData.invoice_number || null,
      total_amount: totalAmount,
      paid_amount: 0,
      notes: formData.notes,
      created_by: session.user.id
    })
    .select("id")
    .single();

  if (purchaseError) return { error: "فشل إنشاء الفاتورة: " + purchaseError.message };

  // 2. إدراج عناصر الفاتورة + 3. تسجيل حركات المخزون (IN)
  for (const item of formData.items) {
    const { error: itemError } = await supabase.from("purchase_items").insert({
      purchase_id: purchase.id,
      product_id: item.product_id,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total_price: Number(item.total_price)
    });

    if (itemError) return { error: "فشل إضافة الأصناف: " + itemError.message };

    const { error: movementError } = await supabase.from("stock_movements").insert({
      product_id: item.product_id,
      warehouse_id: formData.warehouse_id,
      quantity_change: Number(item.quantity),
      movement_type: "PURCHASE",
      reference_id: purchase.id,
      reference_type: "PURCHASE_INVOICE",
      notes: `فاتورة شراء رقم: ${formData.invoice_number || purchase.id}`,
      created_by: session.user.id
    });

    if (movementError) return { error: "فشل تحديث المخزون: " + movementError.message };
  }

  revalidatePath("/purchasing");
  return { success: true };
}
