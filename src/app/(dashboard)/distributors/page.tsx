"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, PackageCheck, Truck, Eye, ArrowLeftRight } from "lucide-react";
import DistributorModals from "./DistributorModals";

export default function DistributorsPage() {
  const supabase = createClient();
  const [distributions, setDistributions] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<"receive" | "deliver" | "view" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewData, setViewData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. جلب عمليات التسليم للعملاء
    const { data: distData } = await supabase
      .from("distributions")
      .select(`id, distribution_date, status, customers ( name ), distribution_items ( total_price )`)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
      
    if (distData) {
      const formattedData = distData.map(d => ({
        ...d,
        total_amount: d.distribution_items?.reduce((sum: number, item: any) => sum + Number(item.total_price), 0) || 0
      }));
      setDistributions(formattedData);
    }

    // 2. جلب سجل التحويلات (استلام بضاعة من المخزن الرئيسي)
    const { data: transData } = await supabase
      .from("stock_movements")
      .select(`created_at, quantity_change, notes, products ( name ), warehouses ( name )`)
      .in("reference_type", ["DIST_RECEIVE_IN", "DIST_RECEIVE_OUT"])
      .order("created_at", { ascending: false });

    if (transData) setTransfers(transData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (type: "receive" | "deliver") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleView = async (distId: string) => {
    const { data } = await supabase
      .from("distributions")
      .select(`*, customers ( name ), distribution_items ( *, products ( name ) )`)
      .eq("id", distId)
      .single();
      
    if (data) {
      setViewData(data);
      setModalType("view");
      setIsModalOpen(true);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setViewData(null);
    fetchData();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">الموزعون</h1>
          <p className="text-text-secondary mt-1">إدارة عهدة الموزعين والتسليمات</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openModal("receive")} className="flex items-center gap-2 bg-primary-green/10 text-primary-green px-4 py-2.5 rounded-xl hover:bg-primary-green/20 transition-colors font-medium">
            <PackageCheck className="w-5 h-5" />
            <span className="hidden md:inline">استلام بضاعة</span>
          </button>
          <button onClick={() => openModal("deliver")} className="flex items-center gap-2 bg-primary-blue text-white px-4 py-2.5 rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-soft">
            <Send className="w-5 h-5" />
            <span className="hidden md:inline">تسليم للعميل</span>
          </button>
        </div>
      </div>

      {/* جدول التسليمات للعملاء */}
      <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-text-primary">فواتير التوزيع للعملاء</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-text-secondary">جاري التحميل...</div>
        ) : distributions.length === 0 ? (
          <div className="p-8 text-center text-text-secondary flex flex-col items-center gap-2">
            <Truck className="w-12 h-12 text-border" /> لا توجد حركات توزيع
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">رقم الحركة</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">العميل</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">إجمالي الفاتورة</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">التاريخ</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {distributions.map((d) => (
                  <tr key={d.id} className="hover:bg-background transition-colors">
                    <td className="py-4 px-6 font-medium text-text-primary">{d.id.substring(0, 8)}</td>
                    <td className="py-4 px-6 text-text-secondary">{d.customers?.name || "عميل نقدي"}</td>
                    <td className="py-4 px-6 font-bold text-success">{d.total_amount.toLocaleString()} ر.س</td>
                    <td className="py-4 px-6 text-text-secondary">{new Date(d.distribution_date).toLocaleDateString('ar-EG')}</td>
                    <td className="py-4 px-6">
                      <button onClick={() => handleView(d.id)} className="p-2 text-info hover:bg-info/10 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* جدول سجل التحويلات (استلام البضاعة) */}
      <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary-green" /> سجل التحويلات (استلام البضاعة من المخزن)
          </h3>
        </div>
        {transfers.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">لا توجد تحويلات بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">المنتج</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">الكمية</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">المخزن المتأثر</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">التفاصيل</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transfers.map((t, index) => (
                  <tr key={index} className="hover:bg-background transition-colors">
                    <td className="py-4 px-6 font-medium text-text-primary">{t.products?.name || "—"}</td>
                    <td className={`py-4 px-6 font-bold ${Number(t.quantity_change) > 0 ? 'text-success' : 'text-danger'}`}>
                      {Number(t.quantity_change) > 0 ? `+${t.quantity_change}` : t.quantity_change}
                    </td>
                    <td className="py-4 px-6 text-text-secondary">{t.warehouses?.name}</td>
                    <td className="py-4 px-6 text-text-secondary text-sm">{t.notes}</td>
                    <td className="py-4 px-6 text-text-secondary text-sm">{new Date(t.created_at).toLocaleString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DistributorModals type={modalType} isOpen={isModalOpen} onClose={handleClose} viewData={viewData} />
    </div>
  );
}
