"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Banknote, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Lock, Wallet } from "lucide-react";
import CashModals from "./CashModals";

export default function CashBoxPage() {
  const supabase = createClient();
  const [boxes, setBoxes] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<"in" | "out" | "transfer" | "close" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: bxs }, { data: txns }] = await Promise.all([
      supabase.from("cash_boxes").select("*").is("deleted_at", null),
      supabase.from("cash_transactions").select(`*, cash_boxes ( name )`).order("created_at", { ascending: false }).limit(10)
    ]);
    if (bxs) setBoxes(bxs);
    if (txns) setTransactions(txns);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (type: "in" | "out" | "transfer" | "close") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    fetchData();
  };

  const totalBalance = boxes.reduce((sum, b) => sum + Number(b.balance), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">صندوق النقدية</h1>
          <p className="text-text-secondary mt-1">إدارة السيولة، التحويلات، والإقفالات</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => openModal("in")} className="flex items-center gap-1 bg-success/10 text-success px-3 py-2 rounded-xl hover:bg-success/20 text-sm font-medium">
            <ArrowDownCircle className="w-4 h-4" /> إيداع
          </button>
          <button onClick={() => openModal("out")} className="flex items-center gap-1 bg-danger/10 text-danger px-3 py-2 rounded-xl hover:bg-danger/20 text-sm font-medium">
            <ArrowUpCircle className="w-4 h-4" /> سحب
          </button>
          <button onClick={() => openModal("transfer")} className="flex items-center gap-1 bg-info/10 text-info px-3 py-2 rounded-xl hover:bg-info/20 text-sm font-medium">
            <ArrowLeftRight className="w-4 h-4" /> تحويل
          </button>
          <button onClick={() => openModal("close")} className="flex items-center gap-1 bg-text-primary/10 text-text-primary px-3 py-2 rounded-xl hover:bg-text-primary/20 text-sm font-medium">
            <Lock className="w-4 h-4" /> إقفال يومي
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-primary-blue to-blue-600 p-6 rounded-2xl shadow-card text-white">
          <div className="flex justify-between items-start mb-4">
            <Wallet className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">إجمالي السيولة</span>
          </div>
          <h3 className="text-3xl font-bold">{totalBalance.toLocaleString()} ر.س</h3>
        </div>
        {boxes.map(box => (
          <div key={box.id} className="bg-card p-6 rounded-2xl shadow-soft border border-border">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-primary-green/10 rounded-xl flex items-center justify-center">
                <Banknote className="w-5 h-5 text-primary-green" />
              </div>
            </div>
            <h3 className="text-text-secondary text-sm mb-1">{box.name}</h3>
            <p className="text-2xl font-bold text-text-primary">{Number(box.balance).toLocaleString()} ر.س</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-text-primary">آخر الحركات النقدية</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-right py-3 px-6 text-sm font-semibold text-text-secondary">الصندوق</th>
                <th className="text-right py-3 px-6 text-sm font-semibold text-text-secondary">النوع</th>
                <th className="text-right py-3 px-6 text-sm font-semibold text-text-secondary">المبلغ</th>
                <th className="text-right py-3 px-6 text-sm font-semibold text-text-secondary">ملاحظات</th>
                <th className="text-right py-3 px-6 text-sm font-semibold text-text-secondary">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-background transition-colors">
                  <td className="py-3 px-6 text-text-primary">{t.cash_boxes?.name}</td>
                  <td className="py-3 px-6">
                    {t.type === "IN" ? (
                      <span className="text-success bg-success/10 px-2 py-1 rounded text-xs">إيداع</span>
                    ) : (
                      <span className="text-danger bg-danger/10 px-2 py-1 rounded text-xs">سحب</span>
                    )}
                  </td>
                  <td className={`py-3 px-6 font-bold ${t.type === "IN" ? "text-success" : "text-danger"}`}>
                    {t.type === "IN" ? "+" : "-"} {Number(t.amount).toLocaleString()}
                  </td>
                  <td className="py-3 px-6 text-text-secondary text-sm">{t.notes || "—"}</td>
                  <td className="py-3 px-6 text-text-secondary text-sm">{new Date(t.created_at).toLocaleDateString('ar-EG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CashModals type={modalType} isOpen={isModalOpen} onClose={handleClose} />
    </div>
  );
}
