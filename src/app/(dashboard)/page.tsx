"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, Edit2, Trash2, Truck, Phone, Wallet } from "lucide-react";
import SupplierForm, { SupplierFormData } from "./SupplierForm";
import { softDeleteSupplier } from "./actions";

export default function SuppliersPage() {
  const supabase = createClient();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierFormData | null>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (data) setSuppliers(data);
    setLoading(false);
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المورد؟")) {
      await softDeleteSupplier(id);
      fetchSuppliers();
    }
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier({
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone || "",
      address: supplier.address || "",
      opening_balance: supplier.opening_balance || 0,
      notes: supplier.notes || "",
    });
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    setIsFormOpen(true);
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone?.includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">الموردون</h1>
          <p className="text-text-secondary mt-1">إدارة بيانات الموردين والأرصدة المستحقة</p>
        </div>
        <button onClick={handleAdd} className="flex items-center justify-center gap-2 bg-primary-blue text-white px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-soft">
          <Plus className="w-5 h-5" /> إضافة مورد
        </button>
      </div>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input type="text" placeholder="ابحث بالاسم أو رقم الهاتف..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-card border border-border rounded-xl py-3 pr-12 pl-4 outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all" />
      </div>

      <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-secondary">جاري تحميل البيانات...</div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-8 text-center text-text-secondary flex flex-col items-center gap-2">
            <Truck className="w-12 h-12 text-border" /> لا يوجد موردون لعرضهم
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">اسم المورد</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">الهاتف</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">الرصيد الافتتاحي</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-background transition-colors">
                      <td className="py-4 px-6 font-medium text-text-primary">{supplier.name}</td>
                      <td className="py-4 px-6 text-text-secondary">{supplier.phone || "—"}</td>
                      <td className="py-4 px-6 text-text-secondary">{supplier.opening_balance?.toLocaleString() || "0"}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(supplier)} className="p-2 text-info hover:bg-info/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(supplier.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-border">
              {filteredSuppliers.map((supplier) => (
                <div key={supplier.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-text-primary">{supplier.name}</h3>
                      {supplier.phone && <p className="text-sm text-text-secondary flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {supplier.phone}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(supplier)} className="p-2 text-info hover:bg-info/10 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(supplier.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1 text-text-secondary">
                      <Wallet className="w-3 h-3" /> الرصيد: <span className="font-semibold text-text-primary">{supplier.opening_balance?.toLocaleString() || "0"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <SupplierForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} supplier={editingSupplier} />
    </div>
  );
}
