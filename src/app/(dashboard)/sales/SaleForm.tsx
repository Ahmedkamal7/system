"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { createSale, SaleItemData } from "./actions";
import Modal from "@/components/ui/Modal";
import { Plus, Trash2, FileText, Printer } from "lucide-react";

export default function SaleForm({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printUrl, setPrintUrl] = useState<string | null>(null);
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [header, setHeader] = useState({ customer_id: "", warehouse_id: "", invoice_number: "", discount_amount: 0, tax_rate: 15, notes: "" });
  const [items, setItems] = useState<SaleItemData[]>([]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(false);
      setPrintUrl(null);
      setItems([]);
      setHeader({ customer_id: "", warehouse_id: "", invoice_number: "", discount_amount: 0, tax_rate: 15, notes: "" });

      const fetchData = async () => {
        const [{ data: custs }, { data: whs }, { data: prods }] = await Promise.all([
          supabase.from("customers").select("id, name").is("deleted_at", null),
          supabase.from("warehouses").select("id, name").is("deleted_at", null),
          supabase.from("products").select("id, name, selling_price").is("deleted_at", null)
        ]);
        if (custs) setCustomers(custs);
        if (whs) setWarehouses(whs);
        if (prods) setProducts(prods);
      };
      fetchData();
    }
  }, [isOpen, supabase]);

  const handleAddItem = () => setItems([...items, { product_id: "", quantity: 1, unit_price: 0, total_price: 0 }]);

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    if (field === "product_id") {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unit_price = product.selling_price;
        newItems[index].total_price = product.selling_price * newItems[index].quantity;
      }
    }
    if (field === "quantity" || field === "unit_price") {
      newItems[index].total_price = Number(newItems[index].quantity) * Number(newItems[index].unit_price);
    }
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const subTotal = items.reduce((sum, item) => sum + Number(item.total_price), 0);
  const discount = Number(header.discount_amount) || 0;
  const taxableAmount = subTotal - discount;
  const taxAmount = (taxableAmount * (Number(header.tax_rate) || 0)) / 100;
  const totalAmount = taxableAmount + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!header.warehouse_id) { setError("يجب اختيار المخزن"); setLoading(false); return; }

    const result = await createSale({
      ...header,
      sub_total: subTotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      items
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setPrintUrl(`/sales/${result.saleId}/print`);
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all text-sm";
  const labelClass = "block text-xs font-medium text-text-secondary mb-1";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إنشاء فاتورة مبيعات">
      {printUrl ? (
        <div className="text-center p-6 space-y-4">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-success" />
          </div>
          <h3 className="text-lg font-bold text-text-primary">تم حفظ الفاتورة بنجاح</h3>
          <a href={printUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-text-primary text-white px-6 py-2 rounded-xl hover:bg-text-secondary transition-colors">
            <Printer className="w-4 h-4" /> طباعة الفاتورة
          </a>
          <button onClick={() => { setPrintUrl(null); onClose(); }} className="block w-full text-text-secondary text-sm hover:text-text-primary mt-2">إغلاق</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>العميل</label>
              <select value={header.customer_id} onChange={(e) => setHeader({...header, customer_id: e.target.value})} className={inputClass}>
                <option value="">عميل نقدي</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>المخزن (إلزامي)</label>
              <select required value={header.warehouse_id} onChange={(e) => setHeader({...header, warehouse_id: e.target.value})} className={inputClass}>
                <option value="">اختر المخزن</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-background p-3 flex justify-between items-center">
              <h3 className="font-semibold text-text-primary text-sm">الأصناف</h3>
              <button type="button" onClick={handleAddItem} className="flex items-center gap-1 text-primary-blue text-sm font-medium hover:bg-primary-blue/10 px-2 py-1 rounded-lg">
                <Plus className="w-4 h-4" /> إضافة صنف
              </button>
            </div>
            <div className="p-3 space-y-3 max-h-60 overflow-y-auto">
              {items.length === 0 && <p className="text-center text-text-secondary text-sm py-4">لم يتم إضافة أصناف بعد</p>}
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <select required value={item.product_id} onChange={(e) => handleItemChange(index, "product_id", e.target.value)} className={`${inputClass} col-span-5`}>
                    <option value="">اختر منتج</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="number" required min="1" placeholder="كمية" value={item.quantity} onChange={(e) => handleItemChange(index, "quantity", e.target.value)} className={`${inputClass} col-span-2`} />
                  <input type="number" required min="0" placeholder="سعر" value={item.unit_price} onChange={(e) => handleItemChange(index, "unit_price", e.target.value)} className={`${inputClass} col-span-3`} />
                  <div className="col-span-1 text-center text-xs font-bold">{item.total_price.toLocaleString()}</div>
                  <button type="button" onClick={() => handleRemoveItem(index)} className="col-span-1 p-2 text-danger hover:bg-danger/10 rounded-lg justify-self-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>الخصم (مبلغ ثابت)</label>
              <input type="number" min="0" value={header.discount_amount} onChange={(e) => setHeader({...header, discount_amount: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>نسبة الضريبة (%)</label>
              <input type="number" min="0" value={header.tax_rate} onChange={(e) => setHeader({...header, tax_rate: e.target.value})} className={inputClass} />
            </div>
            <div className="bg-background p-3 rounded-xl flex flex-col justify-center">
              <span className="text-xs text-text-secondary">الإجمالي النهائي</span>
              <span className="text-lg font-bold text-primary-blue">{totalAmount.toLocaleString()} ر.س</span>
            </div>
          </div>

          {error && <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl text-center">{error}</div>}

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-primary-blue text-white py-2.5 rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-soft disabled:opacity-50">
            <FileText className="w-5 h-5" />
            {loading ? "جاري الحفظ..." : "حفظ الفاتورة"}
          </button>
        </form>
      )}
    </Modal>
  );
}
