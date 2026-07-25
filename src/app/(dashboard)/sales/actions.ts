"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface SaleItemData {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export async function createSale(formData: {
  customer_id: string;
  warehouse_id: string;
  invoice_number: string;
  sub_total: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  notes: string;
  items: SaleItemData[];
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  if (formData.items.length === 0) return { error: "يجب إضافة منتج واحد على الأقل" };

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      customer_id: formData.customer_id || null,
      warehouse_id: formData.warehouse_id,
      invoice_number: formData.invoice_number || null,
      sub_total: Number(formData.sub_total),
      discount_amount: Number(formData.discount_amount),
      tax_amount: Number(formData.tax_amount),
      total_amount: Number(formData.total_amount),
      paid_amount: 0,
      notes: formData.notes,
      created_by: session.user.id
    })
    .select("id, invoice_number")
    .single();

  if (saleError) return { error: "فشل إنشاء الفاتورة: " + saleError.message };

  for (const item of formData.items) {
    const { error: itemError } = await supabase.from("sale_items").insert({
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total_price: Number(item.total_price)
    });

    if (itemError) return { error: "فشل إضافة الأصناف: " + itemError.message };

    const { error: movementError } = await supabase.from("stock_movements").insert({
      product_id: item.product_id,
      warehouse_id: formData.warehouse_id,
      quantity_change: -Math.abs(Number(item.quantity)),
      movement_type: "SALE",
      reference_id: sale.id,
      reference_type: "SALES_INVOICE",
      notes: `فاتورة مبيعات رقم: ${sale.invoice_number || sale.id}`,
      created_by: session.user.id
    });

    if (movementError) return { error: "فشل تحديث المخزون: " + movementError.message };
  }

  revalidatePath("/sales");
  return { success: true, saleId: sale.id };
}
