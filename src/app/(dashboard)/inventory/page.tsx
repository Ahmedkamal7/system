"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowRightLeft, SlidersHorizontal, Package, AlertTriangle, Warehouse } from "lucide-react";
import InventoryModals from "./InventoryModals";

export default function InventoryPage() {
  const supabase = createClient();
  const [inventory, setInventory] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<"transfer" | "adjust" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    let query = supabase
      .from("inventory_levels")
      .select(`
        quantity,
        products ( id, name, min_stock ),
        warehouses ( id, name )
      `)
      .gt("quantity", 0);

    if (selectedWarehouse) {
      query = query.eq("warehouse_id", selectedWarehouse);
    }

    const { data } = await query;
    if (data) setInventory(data);
    setLoading(false);
  };

  useEffect(() => {
    const fetchWarehouses = async () => {
      const { data } = await supabase.from("warehouses").select("id, name").is("deleted_at", null);
      if (data) setWarehouses(data);
    };
    fetchWarehouses();
  }, [supabase]);

  useEffect(() => {
    fetchInventory();
  }, [selectedWarehouse]); // إعادة جلب البيانات عند تغيير المخزن المختار

  const openModal = (type: "transfer" | "adjust") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    fetchInventory();
  };

  const inputClass = "w-full md:w-64 px-3 py-2.5 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all text-sm";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">المخزون</h1>
          <p className="text-text-secondary mt-1">الأرصدة الحالية، التحويلات، والتسويات</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select 
            value={selectedWarehouse} 
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className={inputClass}
          >
            <option value="">كل المخازن</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>

          <button onClick={() => openModal("transfer")} className="flex items-center gap-2 bg-primary-green/10 text-primary-green px-4 py-2.5 rounded-xl hover:bg-primary-green/20 transition-colors font-medium">
            <ArrowRightLeft className="w-5 h-5" />
            <span className="hidden md:inline">تحويل بين المخازن</span>
          </button>
          <button onClick={() => openModal("adjust")} className="flex items-center gap-2 bg-warning/10 text-warning px-4 py-2.5 rounded-xl hover:bg-warning/20 transition-colors font-medium">
            <SlidersHorizontal className="w-5 h-5" />
            <span className="hidden md:inline">تسوية مخزون</span>
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-secondary">جاري تحميل الأرصدة...</div>
        ) : inventory.length === 0 ? (
          <div className="p-8 text-center text-text-secondary flex flex-col items-center gap-2">
            <Warehouse className="w-12 h-12 text-border" />
            لا توجد أرصدة متاحة في هذا المخزون حالياً.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">المنتج</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">المخزن</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">الرصيد المتاح</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inventory.map((item, index) => {
                  const isLow = item.products?.min_stock > 0 && item.quantity <= item.products.min_stock;
                  return (
                    <tr key={index} className="hover:bg-background transition-colors">
                      <td className="py-4 px-6 font-medium text-text-primary flex items-center gap-2">
                        <Package className="w-4 h-4 text-text-secondary" />
                        {item.products?.name}
                      </td>
                      <td className="py-4 px-6 text-text-secondary">{item.warehouses?.name}</td>
                      <td className="py-4 px-6 font-bold text-text-primary">{item.quantity.toLocaleString()}</td>
                      <td className="py-4 px-6">
                        {isLow ? (
                          <span className="flex items-center gap-1 text-danger bg-danger/10 px-3 py-1 rounded-lg text-xs font-semibold w-fit">
                            <AlertTriangle className="w-3 h-3" /> منخفض
                          </span>
                        ) : (
                          <span className="text-success bg-success/10 px-3 py-1 rounded-lg text-xs font-semibold w-fit">متوفر</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InventoryModals type={modalType} isOpen={isModalOpen} onClose={handleClose} />
    </div>
  );
}
