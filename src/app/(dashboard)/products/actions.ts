"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ProductFormData = {
  id?: string;
  name: string;
  barcode: string;
  category_id: string;
  purchase_price: number;
  selling_price: number;
  min_stock: number;
  max_stock: number;
  tax_rate: number;
};

export async function upsertProduct(formData: ProductFormData) {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const productData = {
    name: formData.name,
    barcode: formData.barcode || null,
    category_id: formData.category_id || null,
    purchase_price: Number(formData.purchase_price) || 0,
    selling_price: Number(formData.selling_price) || 0,
    min_stock: Number(formData.min_stock) || 0,
    max_stock: Number(formData.max_stock) || 0,
    tax_rate: Number(formData.tax_rate) || 0,
  };

  if (formData.id) {
    const { error } = await supabase.from("products").update(productData).eq("id", formData.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("products").insert(productData);
    if (error) return { error: error.message };
  }

  revalidatePath("/products");
  return { success: true };
}

export async function softDeleteProduct(id: string) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: "حدث خطأ أثناء حذف المنتج" };

  revalidatePath("/products");
  return { success: true };
}

export async function addCategory(name: string) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { error } = await supabase.from("categories").insert({ name });
  if (error) return { error: "حدث خطأ أثناء إضافة الفئة" };

  revalidatePath("/products");
  return { success: true };
}
