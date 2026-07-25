"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { transferStock, adjustStock } from "./actions";
import Modal from "@/components/ui/Modal";
import { ArrowRightLeft, SlidersHorizontal } from "lucide-react";

export default function InventoryModals({ type, isOpen, onClose }: { type: "transfer" | "adjust" | null, isOpen: boolean, onClose: () => void }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [availableStock, setAvailableStock] = useState<number | null>(null); // لتخزين الرصيد المتاح
  
  const [formData, setFormData] = useState<any>({
    product_id: "",
    from_warehouse_id: "",
    to_warehouse_id: "",
    warehouse_id: "",
    quantity: 0,
    quantity_change: 0,
    notes: ""
  });

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(false);
      setAvailableStock(null);
      setFormData({ product_id: "", from_warehouse_id: "", to_warehouse_id: "", warehouse_id: "", quantity: 0, quantity_change: 0, notes: "" });
      
      const fetchData = async () => {
        const [{ data: prods }, { data: whs }] = await Promise.all([
          supabase.from("products").select("id, name").is("deleted_at", null),
          supabase.from("warehouses").select("id, name").is("deleted_at", null)
        ]);
        if (prods) setProducts(prods);
        if (whs) setWarehouses(whs);
      };
      fetchData();
    }
  }, [isOpen, supabase]);

  // جلب الرصيد المتاح عند اختيار المنتج والمخزن المصدر في حالة التحويل
  useEffect(() => {
    if (type === "transfer" && formData.product_id && formData.from_warehouse_id) {
      const fetchStock = async () => {
        const { data } = await supabase
          .from("inventory_levels")
          .select("quantity")
          .eq("product_id", formData.product_id)
          .eq("warehouse_id", formData.from_warehouse_id)
          .single();
        setAvailableStock(data?.quantity || 0);
      };
      fetchStock();
    } else {
      setAvailableStock(null);
    }
  }, [formData.product_id, formData.from_warehouse_id, type, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // فحص أمني إضافي في الواجهة قبل الإرسال
    if (type === "transfer" && availableStock !== null && Number(formData.quantity) > availableStock) {
      setError(`الكمية المطلوبة تتجاوز الرصيد المتاح (${availableStock})`);
      setLoading(false);
      return;
    }

    let result;
    if (type === "transfer") {
      if (formData.from_warehouse_id === formData.to_warehouse_id) {
        setError("يجب اختيار مخزنين مختلفين");
        setLoading(false);
        return;
      }
      result = await transferStock(formData);
    } else if (type === "adjust") {
      result = await adjustStock(formData);
    }

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onClose();
    }
  };

  const inputClass = "w-full px-3 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all text-sm";
  const labelClass = "block text-sm font-medium text-text-secondary mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={type === "transfer" ? "تحويل بين المخازن" : "تسوية مخزون (جرد)"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>المنتج</label>
          <select required name="product_id" value={formData.product_id} onChange={(e) => setFormData({...formData, product_id: e.target.value})} className={inputClass}>
            <option value="">اختر المنتج</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {type === "transfer" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>من مخزن</label>
              <select required value={formData.from_warehouse_id} onChange={(e) => setFormData({...formData, from_warehouse_id: e.target.value})} className={inputClass}>
                <option value="">اختر المصدر</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>إلى مخزن</label>
              <select required value={formData.to_warehouse_id} onChange={(e) => setFormData({...formData, to_warehouse_id: e.target.value})} className={inputClass}>
                <option value="">اختر الوجهة</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className={labelClass}>المخزن</label>
            <select required value={formData.warehouse_id} onChange={(e) => setFormData({...formData, warehouse_id: e.target.value})} className={inputClass}>
              <option value="">اختر المخزن</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className={labelClass}>
            {type === "transfer" ? "الكمية المحولة" : "الكمية (سالب للخصم، موجب للإضافة)"}
            {type === "transfer" && availableStock !== null && (
              <span className="text-primary-blue mr-2">(المتاح: {availableStock})</span>
            )}
          </label>
          <input 
            type="number" 
            required 
            min="1"
            max={type === "transfer" && availableStock !== null ? availableStock : undefined}
            value={type === "transfer" ? formData.quantity : formData.quantity_change}
            onChange={(e) => setFormData({...formData, [type === "transfer" ? "quantity" : "quantity_change"]: e.target.value})} 
            className={inputClass} 
            placeholder="0"
          />
        </div>

        <div>
          <label className={labelClass}>ملاحظات</label>
          <textarea rows={2} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className={inputClass} placeholder="سبب التحويل/التسوية..."></textarea>
        </div>

        {error && <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl text-center">{error}</div>}

        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-primary-blue text-white py-2.5 rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-soft disabled:opacity-50">
          {type === "transfer" ? <ArrowRightLeft className="w-5 h-5" /> : <SlidersHorizontal className="w-5 h-5" />}
          {loading ? "جاري التنفيذ..." : "تأكيد العملية"}
        </button>
      </form>
    </Modal>
  );
}
