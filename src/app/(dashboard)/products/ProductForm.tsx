"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProductFormData, upsertProduct, addCategory } from "./actions";
import Modal from "@/components/ui/Modal";
import { Plus } from "lucide-react";

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ProductFormData | null;
}

export default function ProductForm({ isOpen, onClose, product }: ProductFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState("");

  const [formData, setFormData] = useState<ProductFormData>({
    name: "", barcode: "", category_id: "", purchase_price: 0, selling_price: 0, min_stock: 0, max_stock: 0, tax_rate: 15
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(product || { name: "", barcode: "", category_id: "", purchase_price: 0, selling_price: 0, min_stock: 0, max_stock: 0, tax_rate: 15 });
      setError(null);
      setLoading(false);
      fetchCategories();
    }
  }, [isOpen, product]);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").is("deleted_at", null).order("name");
    if (data) setCategories(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const result = await addCategory(newCategory.trim());
    if (result.error) {
      setError(result.error);
    } else {
      setNewCategory("");
      fetchCategories();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const result = await upsertProduct(formData);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onClose();
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all";
  const labelClass = "block text-sm font-medium text-text-secondary mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product ? "تعديل المنتج" : "إضافة منتج جديد"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>اسم المنتج</label>
          <input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputClass} placeholder="أدخل اسم المنتج" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>الباركود</label>
            <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className={inputClass} placeholder="اختياري" />
          </div>
          <div>
            <label className={labelClass}>نسبة الضريبة (%)</label>
            <input type="number" name="tax_rate" value={formData.tax_rate} onChange={handleChange} className={inputClass} placeholder="15" />
          </div>
        </div>

        <div>
          <label className={labelClass}>الفئة</label>
          <div className="flex gap-2">
            <select name="category_id" value={formData.category_id} onChange={handleChange} className={inputClass}>
              <option value="">بدون فئة</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button type="button" onClick={handleAddCategory} className="p-2.5 bg-primary-green/10 text-primary-green rounded-xl hover:bg-primary-green/20 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <input 
            type="text" 
            value={newCategory} 
            onChange={(e) => setNewCategory(e.target.value)} 
            placeholder="أضف فئة جديدة سريعاً..." 
            className="w-full mt-2 px-4 py-2 bg-background border border-dashed border-border rounded-xl outline-none text-sm focus:border-primary-blue transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>سعر الشراء</label>
            <input type="number" name="purchase_price" required value={formData.purchase_price} onChange={handleChange} className={inputClass} placeholder="0.00" />
          </div>
          <div>
            <label className={labelClass}>سعر البيع</label>
            <input type="number" name="selling_price" required value={formData.selling_price} onChange={handleChange} className={inputClass} placeholder="0.00" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>الحد الأدنى للمخزون</label>
            <input type="number" name="min_stock" value={formData.min_stock} onChange={handleChange} className={inputClass} placeholder="0" />
          </div>
          <div>
            <label className={labelClass}>الحد الأقصى للمخزون</label>
            <input type="number" name="max_stock" value={formData.max_stock} onChange={handleChange} className={inputClass} placeholder="0" />
          </div>
        </div>

        {error && <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl text-center">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-background text-text-primary rounded-xl hover:bg-border transition-colors font-medium">إلغاء</button>
          <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-primary-blue text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-soft disabled:opacity-50">
            {loading ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
