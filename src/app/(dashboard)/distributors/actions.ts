"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface DistItemData {
  product_id: string;
  delivered_quantity: number;
  returned_quantity?: number;
}

// 1. استلام بضاعة من المخزن الرئيسي إلى عهدة الموزع
export async function receiveStockFromWarehouse(formData: {
  warehouse_id: string;
  distributor_warehouse_id: string;
  items: { product_id: string; quantity: number }[];
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  for (const item of formData.items) {
    if (item.quantity <= 0) continue;

    // خصم من المخزن الرئيسي
    const { error: outError } = await supabase.from("stock_movements").insert({
      product_id: item.product_id,
      warehouse_id: formData.warehouse_id,
      quantity_change: -Math.abs(Number(item.quantity)),
      movement_type: "TRANSFER",
      reference_type: "DIST_RECEIVE_OUT",
      notes: `تحويل لعهدة موزع`,
      created_by: session.user.id
    });
    if (outError) return { error: "فشل خصم المخزون الرئيسي: " + outError.message };

    // إضافة لمخزون الموزع
    const { error: inError } = await supabase.from("stock_movements").insert({
      product_id: item.product_id,
      warehouse_id: formData.distributor_warehouse_id,
      quantity_change: Math.abs(Number(item.quantity)),
      movement_type: "TRANSFER",
      reference_type: "DIST_RECEIVE_IN",
      notes: `استلام من المخزن الرئيسي`,
      created_by: session.user.id
    });
    if (inError) return { error: "فشل إضافة لعهدة الموزع: " + inError.message };
  }

  revalidatePath("/distributors");
  return { success: true };
}

// 2. تسجيل تسليم بضاعة لعميل (مع المرتجع)
export async function createDistribution(formData: {
  customer_id: string;
  warehouse_id: string; // مخزون الموزع
  notes: string;
  items: DistItemData[];
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  if (formData.items.length === 0) return { error: "يجب إضافة منتج واحد على الأقل" };

  const { data: dist, error: distError } = await supabase
    .from("distributions")
    .insert({
      distributor_id: session.user.id,
      customer_id: formData.customer_id || null,
      warehouse_id: formData.warehouse_id,
      notes: formData.notes,
      status: "DELIVERED"
    })
    .select("id")
    .single();

  if (distError) return { error: "فشل إنشاء السجل: " + distError.message };

  for (const item of formData.items) {
    const delivered = Number(item.delivered_quantity) || 0;
    const returned = Number(item.returned_quantity) || 0;
    const netDelivered = delivered - returned;

    if (netDelivered <= 0 && returned === 0) continue;

    const { error: itemError } = await supabase.from("distribution_items").insert({
      distribution_id: dist.id,
      product_id: item.product_id,
      delivered_quantity: delivered,
      returned_quantity: returned
    });

    if (itemError) return { error: "فشل إضافة الأصناف: " + itemError.message };

    // خصم الصافي المسلم للعميل من مخزون الموزع (OUT)
    if (netDelivered > 0) {
      const { error: outError } = await supabase.from("stock_movements").insert({
        product_id: item.product_id,
        warehouse_id: formData.warehouse_id,
        quantity_change: -Math.abs(netDelivered),
        movement_type: "SALE",
        reference_id: dist.id,
        reference_type: "DISTRIBUTION",
        notes: `توزيع للعميل`,
        created_by: session.user.id
      });
      if (outError) return { error: "فشل تحديث مخزون الموزع: " + outError.message };
    }
  }

  revalidatePath("/distributors");
  return { success: true };
}
