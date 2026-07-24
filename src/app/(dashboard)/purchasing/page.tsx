"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, ShoppingCart, FileText, Truck } from "lucide-react";
import PurchaseForm from "./PurchaseForm";

export default function PurchasingPage() {
  const supabase = createClient();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchPurchases = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("purchases")
      .select(`id, invoice_number, total_amount, status, created_at, suppliers ( name ), warehouses ( name )`)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (data) setPurchases(data);
    setLoading(false);
  };

  useEffect(() => { fetchPurchases(); }, []);

  const handleClose = () => {
    setIsFormOpen(false);
    fetchPurchases();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">المشتريات</h1>
          <p className="text-text-secondary mt-1">فواتير الشراء من الموردين وتحديث المخازن</p>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="flex items-center justify-center gap-2 bg-primary-blue text-white px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-soft">
          <Plus className="w-5 h-5" /> فاتورة شراء جديدة
        </button>
      </div>

      <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-secondary">جاري التحميل...</div>
        ) : purchases.length === 0 ? (
          <div className="p-8 text-center text-text-secondary flex flex-col items-center gap-2">
            <ShoppingCart className="w-12 h-12 text-border" /> لا توجد فواتير شراء
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">رقم الفاتورة</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">المورد</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">المخزن</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">الإجمالي</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-background transition-colors">
                    <td className="py-4 px-6 font-medium text-text-primary flex items-center gap-2">
                      <FileText className="w-4 h-4 text-text-secondary" />
                      {p.invoice_number || p.id.substring(0, 8)}
                    </td>
                    <td className="py-4 px-6 text-text-secondary">{p.suppliers?.name || "—"}</td>
                    <td className="py-4 px-6 text-text-secondary flex items-center gap-1"><Truck className="w-4 h-4" /> {p.warehouses?.name || "—"}</td>
                    <td className="py-4 px-6 font-bold text-primary-green">{p.total_amount.toLocaleString()}</td>
                    <td className="py-4 px-6 text-text-secondary text-sm">{new Date(p.created_at).toLocaleDateString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PurchaseForm isOpen={isFormOpen} onClose={handleClose} />
    </div>
  );
}
