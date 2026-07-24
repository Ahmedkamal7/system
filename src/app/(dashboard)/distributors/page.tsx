"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, PackageCheck, Truck } from "lucide-react";
import DistributorModals from "./DistributorModals";

export default function DistributorsPage() {
  const supabase = createClient();
  const [distributions, setDistributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<"receive" | "deliver" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDistributions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("distributions")
      .select(`id, distribution_date, status, customers ( name )`)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (data) setDistributions(data);
    setLoading(false);
  };

  useEffect(() => { fetchDistributions(); }, []);

  const openModal = (type: "receive" | "deliver") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    fetchDistributions();
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

      <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
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
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">التاريخ</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {distributions.map((d) => (
                  <tr key={d.id} className="hover:bg-background transition-colors">
                    <td className="py-4 px-6 font-medium text-text-primary">{d.id.substring(0, 8)}</td>
                    <td className="py-4 px-6 text-text-secondary">{d.customers?.name || "عميل نقدي"}</td>
                    <td className="py-4 px-6 text-text-secondary">{new Date(d.distribution_date).toLocaleDateString('ar-EG')}</td>
                    <td className="py-4 px-6">
                      <span className="text-success bg-success/10 px-3 py-1 rounded-lg text-xs font-semibold">{d.status === 'DELIVERED' ? 'تم التسليم' : 'مرتجع'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DistributorModals type={modalType} isOpen={isModalOpen} onClose={handleClose} />
    </div>
  );
}
