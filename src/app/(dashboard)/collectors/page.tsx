"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Banknote, Wallet, Users } from "lucide-react";
import CollectorModals from "./CollectorModals";

export default function CollectorsPage() {
  const supabase = createClient();
  const [collectorsData, setCollectorsData] = useState<any[]>([]);
  const [recentCollections, setRecentCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<"collect" | "settle" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    // 1. جلب المحصلين ورصيدهم
    const { data: collectors } = await supabase
      .from("profiles")
      .select("id, username, roles(name)")
      .eq("roles.name", "Collector");

    if (collectors) {
      const collectorsWithBalances = await Promise.all(collectors.map(async (coll) => {
        const { data: colls } = await supabase.from("collections").select("amount").eq("collector_id", coll.id).eq("status", "COLLECTED");
        const { data: setts } = await supabase.from("collector_settlements").select("amount").eq("collector_id", coll.id);
        
        const totalCollected = colls?.reduce((s, c) => s + Number(c.amount), 0) || 0;
        const totalSettled = setts?.reduce((s, c) => s + Number(c.amount), 0) || 0;
        
        return { ...coll, balance: totalCollected - totalSettled, totalCollected };
      }));
      setCollectorsData(collectorsWithBalances);
    }

    // 2. جلب أحدث التحصيلات
    const { data: collections } = await supabase
      .from("collections")
      .select(`id, amount, collection_date, customers ( name )`)
      .order("created_at", { ascending: false })
      .limit(5);
    if (collections) setRecentCollections(collections);

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (type: "collect" | "settle") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    fetchData();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">التحصيلات والعهد</h1>
          <p className="text-text-secondary mt-1">إدارة أرصدة المحصلين والتسويات المالية</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openModal("collect")} className="flex items-center gap-2 bg-primary-green/10 text-primary-green px-4 py-2.5 rounded-xl hover:bg-primary-green/20 transition-colors font-medium">
            <Banknote className="w-5 h-5" />
            <span className="hidden md:inline">تسجيل تحصيل</span>
          </button>
          <button onClick={() => openModal("settle")} className="flex items-center gap-2 bg-primary-blue text-white px-4 py-2.5 rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-soft">
            <Wallet className="w-5 h-5" />
            <span className="hidden md:inline">تسوية عهدة</span>
          </button>
        </div>
      </div>

      {/* Collector Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="p-8 text-center text-text-secondary col-span-full">جاري تحميل البيانات...</div>
        ) : collectorsData.length === 0 ? (
          <div className="p-8 text-center text-text-secondary col-span-full flex flex-col items-center gap-2">
            <Users className="w-12 h-12 text-border" /> لا يوجد محصلون مسجلون
          </div>
        ) : (
          collectorsData.map((coll) => (
            <div key={coll.id} className="bg-card p-6 rounded-2xl shadow-soft border border-border">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-blue/10 rounded-full flex items-center justify-center text-primary-blue font-bold">
                    {coll.username?.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-text-primary">{coll.username}</h3>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">إجمالي المحصل:</span>
                  <span className="font-semibold text-text-primary">{coll.totalCollected.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">الرصيد الحالي (العهدة):</span>
                  <span className="font-bold text-danger">{coll.balance.toLocaleString()} ر.س</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Collections */}
      <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-text-primary">أحدث التحصيلات</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-right py-3 px-6 text-sm font-semibold text-text-secondary">العميل</th>
                <th className="text-right py-3 px-6 text-sm font-semibold text-text-secondary">المبلغ</th>
                <th className="text-right py-3 px-6 text-sm font-semibold text-text-secondary">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentCollections.map((c) => (
                <tr key={c.id} className="hover:bg-background transition-colors">
                  <td className="py-3 px-6 text-text-primary">{c.customers?.name || "عميل نقدي"}</td>
                  <td className="py-3 px-6 font-bold text-success">{c.amount.toLocaleString()} ر.س</td>
                  <td className="py-3 px-6 text-text-secondary text-sm">{new Date(c.collection_date).toLocaleDateString('ar-EG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CollectorModals type={modalType} isOpen={isModalOpen} onClose={handleClose} />
    </div>
  );
}
