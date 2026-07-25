"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { addCashTransaction, transferCash, dailyClosing } from "./actions";
import Modal from "@/components/ui/Modal";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Lock } from "lucide-react";

export default function CashModals({ type, isOpen, onClose }: { type: "in" | "out" | "transfer" | "close" | null, isOpen: boolean, onClose: () => void }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({ box_id: "", from_box_id: "", to_box_id: "", amount: 0, notes: "" });

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(false);
      setFormData({ box_id: "", from_box_id: "", to_box_id: "", amount: 0, notes: "" });
      
      const fetchBoxes = async () => {
        const { data } = await supabase.from("cash_boxes").select("id, name, balance").is("deleted_at", null);
        if (data) setBoxes(data);
      };
      fetchBoxes();
    }
  }, [isOpen, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let result;
    if (type === "in" || type === "out") {
      result = await addCashTransaction({ ...formData, type: type === "in" ? "IN" : "OUT" });
    } else if (type === "transfer") {
      result = await transferCash(formData);
    } else if (type === "close") {
      result = await dailyClosing(formData);
    }

    if (result?.error) setError(result.error);
    else { setFormData({ box_id: "", from_box_id: "", to_box_id: "", amount: 0, notes: "" }); onClose(); }
    setLoading(false);
  };

  const inputClass = "w-full px-3 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all text-sm";
  const labelClass = "block text-sm font-medium text-text-secondary mb-1.5";

  const titles: any = {
    in: "إيداع نقدي (Cash In)",
    out: "سحب نقدي (Cash Out)",
    transfer: "تحويل بين الصناديق",
    close: "إقفال يومي للصندوق"
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titles[type!] || ""}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {type === "transfer" ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>من صندوق</label>
              <select required value={formData.from_box_id} onChange={(e) => setFormData({...formData, from_box_id: e.target.value})} className={inputClass}>
                <option value="">اختر</option>
                {boxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>إلى صندوق</label>
              <select required value={formData.to_box_id} onChange={(e) => setFormData({...formData, to_box_id: e.target.value})} className={inputClass}>
                <option value="">اختر</option>
                {boxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className={labelClass}>الصندوق</label>
            <select required value={formData.box_id} onChange={(e) => setFormData({...formData, box_id: e.target.value})} className={inputClass}>
              <option value="">اختر الصندوق</option>
              {boxes.map(b => <option key={b.id} value={b.id}>{b.name} ({b.balance.toLocaleString()})</option>)}
            </select>
          </div>
        )}

        {type !== "close" && (
          <div>
            <label className={labelClass}>المبلغ</label>
            <input type="number" required min="1" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className={inputClass} placeholder="0.00" />
          </div>
        )}

        <div>
          <label className={labelClass}>ملاحظات</label>
          <textarea rows={2} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className={inputClass}></textarea>
        </div>

        {error && <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl text-center">{error}</div>}

        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-primary-blue text-white py-2.5 rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-soft disabled:opacity-50">
          {type === "in" && <ArrowDownCircle className="w-5 h-5" />}
          {type === "out" && <ArrowUpCircle className="w-5 h-5" />}
          {type === "transfer" && <ArrowLeftRight className="w-5 h-5" />}
          {type === "close" && <Lock className="w-5 h-5" />}
          {loading ? "جاري التنفيذ..." : "تأكيد"}
        </button>
      </form>
    </Modal>
  );
}
