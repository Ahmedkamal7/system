"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { receiveStockFromWarehouse, createDistribution } from "./actions";
import Modal from "@/components/ui/Modal";
import { Plus, Trash2, Send, PackageCheck } from "lucide-react";

export default function DistributorModals({ type, isOpen, onClose }: { type: "receive" | "deliver" | null, isOpen: boolean, onClose: () => void }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [header, setHeader] = useState<any>({ warehouse_id: "", distributor_warehouse_id: "", customer_id: "" });
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(false);
      setItems([]);
      setHeader({ warehouse_id: "", distributor_warehouse_id: "", customer_id: "" });
      
      const fetchData = async () => {
        const [{ data: whs }, { data: custs }, { data: prods }] = await Promise.all([
          supabase.from("warehouses").select("id, name").is("deleted_at", null),
          supabase.from("customers").select("id, name").is("deleted_at", null),
          supabase.from("products").select("id, name").is("deleted_at", null)
        ]);
        if (whs) setWarehouses(whs);
        if (custs) setCustomers(custs);
        if (prods) setProducts(prods);
      };
      fetchData();
    }
  }, [isOpen, supabase]);

  const handleAddItem = () => setItems([...items, { product_id: "", quantity: 1, delivered_quantity: 1, returned_quantity: 0 }]);
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };
  const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let result;
    if (type === "receive") {
      if (!header.warehouse_id || !header.distributor_warehouse_id) {
        setError("اختر المخزن الرئيسي ومخزن الموزع"); setLoading(false); return;
      }
      result = await receiveStockFromWarehouse({ ...header, items });
    } else if (type === "deliver") {
      if (!header.warehouse_id) { setError("اختر مخزن الموزع"); setLoading(false); return; }
      result = await createDistribution({ customer_id: header.customer_id, warehouse_id: header.warehouse_id, notes: "", items });
    }

    if (result?.error) setError(result.error);
    else { setItems([]); onClose(); }
    setLoading(false);
  };

  const inputClass = "w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all text-sm";
  const labelClass = "block text-xs font-medium text-text-secondary mb-1";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={type === "receive" ? "استلام بضاعة من المخزن" : "تسليم بضاعة لعميل"}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {type === "receive" ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>من مخزن (رئيسي)</label>
              <select required value={header.warehouse_id} onChange={(e) => setHeader({...header, warehouse_id: e.target.value})} className={inputClass}>
                <option value="">اختر</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>إلى مخزن (عهدة الموزع)</label>
              <select required value={header.distributor_warehouse_id} onChange={(e) => setHeader({...header, distributor_warehouse_id: e.target.value})} className={inputClass}>
                <option value="">اختر</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>مخزن الموزع (الخصم منه)</label>
              <select required value={header.warehouse_id} onChange={(e) => setHeader({...header, warehouse_id: e.target.value})} className={inputClass}>
                <option value="">اختر</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>العميل</label>
              <select value={header.customer_id} onChange={(e) => setHeader({...header, customer_id: e.target.value})} className={inputClass}>
                <option value="">عميل نقدي</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-background p-3 flex justify-between items-center">
            <h3 className="font-semibold text-text-primary text-sm">الأصناف</h3>
            <button type="button" onClick={handleAddItem} className="flex items-center gap-1 text-primary-blue text-sm font-medium hover:bg-primary-blue/10 px-2 py-1 rounded-lg">
              <Plus className="w-4 h-4" /> إضافة
            </button>
          </div>
          <div className="p-3 space-y-3 max-h-60 overflow-y-auto">
            {items.length === 0 && <p className="text-center text-text-secondary text-sm py-4">لا توجد أصناف</p>}
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <select required value={item.product_id} onChange={(e) => handleItemChange(index, "product_id", e.target.value)} className={`${inputClass} col-span-5`}>
                  <option value="">اختر منتج</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {type === "receive" ? (
                  <input type="number" required min="1" placeholder="كمية" value={item.quantity} onChange={(e) => handleItemChange(index, "quantity", e.target.value)} className={`${inputClass} col-span-5`} />
                ) : (
                  <>
                    <input type="number" required min="0" placeholder="تسليم" value={item.delivered_quantity} onChange={(e) => handleItemChange(index, "delivered_quantity", e.target.value)} className={`${inputClass} col-span-3`} />
                    <input type="number" min="0" placeholder="مرتجع" value={item.returned_quantity} onChange={(e) => handleItemChange(index, "returned_quantity", e.target.value)} className={`${inputClass} col-span-3`} />
                  </>
                )}
                <button type="button" onClick={() => handleRemoveItem(index)} className="col-span-2 p-2 text-danger hover:bg-danger/10 rounded-lg justify-self-center">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl text-center">{error}</div>}

        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-primary-blue text-white py-2.5 rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-soft disabled:opacity-50">
          {type === "receive" ? <PackageCheck className="w-5 h-5" /> : <Send className="w-5 h-5" />}
          {loading ? "جاري التنفيذ..." : "تأكيد العملية"}
        </button>
      </form>
    </Modal>
  );
}
