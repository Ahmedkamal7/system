"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, Edit2, Trash2, Users, Phone, Wallet } from "lucide-react";
import CustomerForm, { CustomerFormData } from "./CustomerForm";
import { softDeleteCustomer } from "./actions";

export default function CustomersPage() {
  const supabase = createClient();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerFormData | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (data) setCustomers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا العميل؟ (لن يتم حذفه نهائياً)")) {
      await softDeleteCustomer(id);
      fetchCustomers();
    }
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || "",
      address: customer.address || "",
      credit_limit: customer.credit_limit || 0,
      opening_balance: customer.opening_balance || 0,
      notes: customer.notes || "",
    });
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">العملاء</h1>
          <p className="text-text-secondary mt-1">إدارة بيانات العملاء وأرصدتهم</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 bg-primary-blue text-white px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-soft"
        >
          <Plus className="w-5 h-5" />
          إضافة عميل
        </button>
      </div>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-card border border-border rounded-xl py-3 pr-12 pl-4 outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all"
        />
      </div>

      <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-secondary">جاري تحميل البيانات...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-text-secondary flex flex-col items-center gap-2">
            <Users className="w-12 h-12 text-border" />
            لا يوجد عملاء لعرضهم
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">اسم العميل</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">الهاتف</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">حد الائتمان</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">الرصيد الافتتاحي</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-background transition-colors">
                      <td className="py-4 px-6 font-medium text-text-primary">{customer.name}</td>
                      <td className="py-4 px-6 text-text-secondary">{customer.phone || "—"}</td>
                      <td className="py-4 px-6 text-text-secondary">{customer.credit_limit?.toLocaleString() || "0"}</td>
                      <td className="py-4 px-6 text-text-secondary">{customer.opening_balance?.toLocaleString() || "0"}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(customer)} className="p-2 text-info hover:bg-info/10 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(customer.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-border">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-text-primary">{customer.name}</h3>
                      {customer.phone && <p className="text-sm text-text-secondary flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {customer.phone}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(customer)} className="p-2 text-info hover:bg-info/10 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(customer.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1 text-text-secondary">
                      <Wallet className="w-3 h-3" />
                      حد الائتمان: <span className="font-semibold text-text-primary">{customer.credit_limit?.toLocaleString() || "0"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

           <CustomerForm 
        isOpen={isFormOpen} 
        onClose={() => { setIsFormOpen(false); fetchCustomers(); }} 
        customer={editingCustomer}
      />
    </div>
  );
}
