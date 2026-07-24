"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { createCollection, settleCollector } from "./actions";
import Modal from "@/components/ui/Modal";
import { Banknote, Wallet } from "lucide-react";

export default function CollectorModals({ type, isOpen, onClose }: { type: "collect" | "settle" | null, isOpen: boolean, onClose: () => void }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [collectors, setCollectors] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<any>({
    customer_id: "",
    amount: 0,
    payment_method: "CASH",
    collector_id: "",
    notes: ""
  });

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(false);
      setFormData({ customer_id: "", amount: 0, payment_method: "CASH", collector_id: "", notes: "" });
      
      const fetchData = async () => {
        const { data: custs } = await supabase.from("customers").select("id, name").is("deleted_at", null);
        if (custs) setCustomers(custs);

        // جلب المستخدمين الذين دورهم Collector (أو المحاسب نفسه)
        const { data: colls } = await supabase
          .from("profiles")
          .select("id, username, roles(name)")
          .eq("roles.name", "Collector");
          
        if (colls) setCollectors(colls);
      };
      fetchData();
    }
  }, [isOpen, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let result;
    if (type === "collect") {
      result = await createCollection(formData);
    } else if (type === "settle") {
      if (!formData.collector_id) { setError("اختر المحصل"); setLoading(false); return; }
      result = await settleCollector(formData);
    }

    if (result?.error) setError(result.error);
    else { setFormData({ customer_id: "", amount: 0, payment_method: "CASH", collector_id: "", notes: "" }); onClose(); }
    setLoading(false);
  };

  const inputClass = "w-full px-3 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all text-sm";
  const labelClass = "block text-sm font-medium text-text-secondary mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={type === "collect" ? "تسجيل تحصيل (عهدة)" : "تسوية عهدة محصل"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {type === "collect" ? (
          <div>
            <label className={labelClass}>العميل</label>
            <select value={formData.customer_id} onChange={(e) => setFormData({...formData, customer_id: e.target.value})} className={inputClass}>
              <option value="">عميل نقدي</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className={labelClass}>المحصل</label>
            <select required value={formData.collector_id} onChange={(e) => setFormData({...formData, collector_id: e.target.value})} className={inputClass}>
              <option value="">اختر المحصل</option>
              {collectors.map(c => <option key={c.id} value={c.id}>{c.username}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>المبلغ</label>
            <input type="number" required min="1" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className={inputClass} placeholder="0.00" />
          </div>
          {type === "collect" && (
            <div>
              <label className={labelClass}>طريقة الدفع</label>
              <select value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})} className={inputClass}>
                <option value="CASH">نقدي</option>
                <option value="CREDIT">آجل</option>
                <option value="PARTIAL">جزئي</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>ملاحظات</label>
          <textarea rows={2} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className={inputClass}></textarea>
        </div>

        {error && <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl text-center">{error}</div>}

        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-primary-blue text-white py-2.5 rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-soft disabled:opacity-50">
          {type === "collect" ? <Banknote className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
          {loading ? "جاري التنفيذ..." : "تأكيد"}
        </button>
      </form>
    </Modal>
  );
}
