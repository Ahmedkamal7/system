"use client";

import { useState, useEffect } from "react";
import { CustomerFormData, upsertCustomer } from "./actions";
import Modal from "@/components/ui/Modal";

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: CustomerFormData | null;
}

export default function CustomerForm({ isOpen, onClose, customer }: CustomerFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "", phone: "", address: "", credit_limit: 0, opening_balance: 0, notes: ""
  });

  // تحديث الحقول بالبيانات الجديدة في كل مرة تُفتح فيها النافذة أو يتغير العميل
  useEffect(() => {
    if (isOpen) {
      setFormData(customer || { name: "", phone: "", address: "", credit_limit: 0, opening_balance: 0, notes: "" });
      setError(null);
      setLoading(false);
    }
  }, [isOpen, customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const result = await upsertCustomer(formData);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={customer ? "تعديل بيانات العميل" : "إضافة عميل جديد"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">اسم العميل</label>
          <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all" placeholder="أدخل اسم العميل" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">رقم الهاتف</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all" placeholder="05xxxxxxxx" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">حد الائتمان</label>
            <input type="number" name="credit_limit" value={formData.credit_limit} onChange={handleChange} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all" placeholder="0.00" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">العنوان</label>
          <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all" placeholder="المدينة، الحي، الشارع" />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">الرصيد الافتتاحي</label>
          <input type="number" name="opening_balance" value={formData.opening_balance} onChange={handleChange} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all" placeholder="0.00" />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">ملاحظات</label>
          <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all resize-none" placeholder="أي معلومات إضافية..."></textarea>
        </div>

        {error && <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl text-center">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-background text-text-primary rounded-xl hover:bg-border transition-colors font-medium">إلغاء</button>
          <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-primary-blue text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-soft disabled:opacity-50">{loading ? "جاري الحفظ..." : "حفظ"}</button>
        </div>
      </form>
    </Modal>
  );
}
