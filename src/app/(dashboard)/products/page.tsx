"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, Edit2, Trash2, Package, Barcode, DollarSign } from "lucide-react";
import ProductForm, { ProductFormData } from "./ProductForm";
import { softDeleteProduct } from "./actions";

export default function ProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select(`*, categories ( name )`)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      await softDeleteProduct(id);
      fetchProducts();
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      barcode: product.barcode || "",
      category_id: product.category_id || "",
      purchase_price: product.purchase_price || 0,
      selling_price: product.selling_price || 0,
      min_stock: product.min_stock || 0,
      max_stock: product.max_stock || 0,
      tax_rate: product.tax_rate || 0,
    });
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">المنتجات</h1>
          <p className="text-text-secondary mt-1">إدارة الأصناف، الأسعار، والباركود</p>
        </div>
        <button onClick={handleAdd} className="flex items-center justify-center gap-2 bg-primary-blue text-white px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-soft">
          <Plus className="w-5 h-5" /> إضافة منتج
        </button>
      </div>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input type="text" placeholder="ابحث باسم المنتج أو الباركود..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-card border border-border rounded-xl py-3 pr-12 pl-4 outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all" />
      </div>

      <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-secondary">جاري تحميل البيانات...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-text-secondary flex flex-col items-center gap-2">
            <Package className="w-12 h-12 text-border" /> لا توجد منتجات لعرضها
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">اسم المنتج</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">الباركود</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">الفئة</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">سعر الشراء</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">سعر البيع</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-background transition-colors">
                      <td className="py-4 px-6 font-medium text-text-primary">{product.name}</td>
                      <td className="py-4 px-6 text-text-secondary flex items-center gap-1">
                        {product.barcode ? <><Barcode className="w-4 h-4" /> {product.barcode}</> : "—"}
                      </td>
                      <td className="py-4 px-6 text-text-secondary">{product.categories?.name || "—"}</td>
                      <td className="py-4 px-6 text-text-secondary">{product.purchase_price?.toLocaleString()}</td>
                      <td className="py-4 px-6 text-success font-medium">{product.selling_price?.toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(product)} className="p-2 text-info hover:bg-info/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(product.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-border">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-text-primary">{product.name}</h3>
                      <p className="text-xs text-text-secondary mt-1">{product.categories?.name || "بدون فئة"}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(product)} className="p-2 text-info hover:bg-info/10 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <div className="flex items-center gap-1 text-sm text-text-secondary">
                      <DollarSign className="w-4 h-4 text-success" /> بيع: <span className="font-semibold text-text-primary">{product.selling_price?.toLocaleString()}</span>
                    </div>
                    {product.barcode && (
                      <div className="flex items-center gap-1 text-xs text-text-secondary"><Barcode className="w-3 h-3" /> {product.barcode}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ProductForm 
        isOpen={isFormOpen} 
        onClose={() => { setIsFormOpen(false); fetchProducts(); }} 
        product={editingProduct}
      />
    </div>
  );
}
