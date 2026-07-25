import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { History } from "lucide-react";

export default async function AuditLogsPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", session.user.id)
    .single();

  const roleData: any = profile?.roles;
  const userRole = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;

  if (userRole !== "Administrator") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 bg-danger/10 text-danger rounded-2xl">
          <h2 className="text-xl font-bold">طلب مرفوض</h2>
          <p>هذه الصفحة مخصصة للمدير فقط.</p>
        </div>
      </div>
    );
  }

  const { data: logs } = await supabase
    .from("audit_logs")
    .select(`changed_at, table_name, operation, changed_by, new_values`)
    .order("changed_at", { ascending: false })
    .limit(100);

  const translateOperation = (op: string) => {
    if (op === 'INSERT') return 'إضافة';
    if (op === 'UPDATE') return 'تعديل';
    if (op === 'DELETE') return 'حذف';
    return op;
  };

  const getOperationColor = (op: string) => {
    if (op === 'INSERT') return 'bg-success/10 text-success';
    if (op === 'UPDATE') return 'bg-warning/10 text-warning';
    if (op === 'DELETE') return 'bg-danger/10 text-danger';
    return 'bg-background text-text-secondary';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary flex items-center gap-2">
          <History className="w-8 h-8 text-primary-blue" /> سجل نشاط النظام
        </h1>
        <p className="text-text-secondary mt-1">مراقبة شاملة لجميع العمليات التي تتم في النظام (آخر 100 عملية)</p>
      </div>

      <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">الوقت والتاريخ</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">القسم المتأثر</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">العملية</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-text-secondary">القيم الجديدة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs?.map((log, index) => (
                <tr key={index} className="hover:bg-background transition-colors">
                  <td className="py-4 px-6 text-text-secondary text-sm">{new Date(log.changed_at).toLocaleString('ar-EG')}</td>
                  <td className="py-4 px-6 font-medium text-text-primary">
                    {log.table_name === 'customers' ? 'العملاء' :
                     log.table_name === 'suppliers' ? 'الموردون' :
                     log.table_name === 'products' ? 'المنتجات' :
                     log.table_name === 'sales' ? 'المبيعات' :
                     log.table_name === 'purchases' ? 'المشتريات' :
                     log.table_name === 'stock_movements' ? 'المخزون' :
                     log.table_name === 'cash_transactions' ? 'الصندوق' :
                     log.table_name === 'collections' ? 'التحصيلات' :
                     log.table_name === 'profiles' ? 'المستخدمون' : log.table_name}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getOperationColor(log.operation)}`}>
                      {translateOperation(log.operation)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-text-secondary text-xs max-w-md truncate overflow-hidden">
                    {log.new_values ? JSON.stringify(log.new_values).substring(0, 100) + '...' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
