import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrendingUp, ShoppingCart, Wallet, Package, Users, Truck, ArrowDownToLine, ArrowUpFromLine, BarChart3, AlertTriangle } from "lucide-react";

export default async function ReportsPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) redirect("/login");

  // التحقق من الصلاحيات
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", session.user.id)
    .single();

  const roleData: any = profile?.roles;
  const userRole = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;

  if (!["Administrator", "Accountant"].includes(userRole)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 bg-danger/10 text-danger rounded-2xl">
          <h2 className="text-xl font-bold">طلب مرفوض</h2>
          <p>ليس لديك صلاحية للوصول إلى التقارير.</p>
        </div>
      </div>
    );
  }

  // 1. التقارير المالية (المبيعات والمشتريات)
  const { data: sales } = await supabase.from("sales").select("total_amount").is("deleted_at", null);
  const totalSales = sales?.reduce((s, sale) => s + Number(sale.total_amount), 0) || 0;
  
  const { data: purchases } = await supabase.from("purchases").select("total_amount").is("deleted_at", null);
  const totalPurchases = purchases?.reduce((s, pur) => s + Number(pur.total_amount), 0) || 0;

  // 2. تقارير التحصيلات والصندوق
  const { data: cashTxns } = await supabase.from("cash_transactions").select("type, amount");
  const cashIn = cashTxns?.filter(t => t.type === "IN").reduce((s, t) => s + Number(t.amount), 0) || 0;
  const cashOut = cashTxns?.filter(t => t.type === "OUT").reduce((s, t) => s + Number(t.amount), 0) || 0;
  const cashBalance = cashIn - cashOut;

  const { data: collections } = await supabase.from("collections").select("amount, status");
  const totalCollected = collections?.filter(c => c.status === "COLLECTED").reduce((s, c) => s + Number(c.amount), 0) || 0;

  // 3. تقييم المخزون
  const { data: inventory } = await supabase
    .from("inventory_levels")
    .select("quantity, products ( purchase_price, min_stock )");
  
  const inventoryValue = inventory?.reduce((s, item) => s + (Number(item.quantity) * Number(item.products?.[0]?.purchase_price || 0)), 0) || 0;
  const lowStockCount = inventory?.filter(item => Number(item.quantity) <= Number(item.products?.[0]?.min_stock || 0)).length || 0;

  // 4. أرصدة العملاء والموردين
  const { data: customers } = await supabase.from("customers").select("opening_balance, credit_limit").is("deleted_at", null);
  const totalCustomerBalances = customers?.reduce((s, c) => s + Number(c.opening_balance), 0) || 0;
  const totalCreditLimits = customers?.reduce((s, c) => s + Number(c.credit_limit), 0) || 0;

  const { data: suppliers } = await supabase.from("suppliers").select("opening_balance").is("deleted_at", null);
  const totalSupplierBalances = suppliers?.reduce((s, sup) => s + Number(sup.opening_balance), 0) || 0;

  // 5. أفضل 5 عملاء (تجميع المبيعات)
  const { data: topSales } = await supabase
    .from("sales")
    .select("total_amount, customers ( name )")
    .is("deleted_at", null)
    .not("customer_id", "is", null);
  
  const customerMap = new Map();
  topSales?.forEach(s => {
    const name = s.customers?.[0]?.name || s.customers?.name || "غير معروف";
    customerMap.set(name, (customerMap.get(name) || 0) + Number(s.total_amount));
  });
  const topCustomersArr = Array.from(customerMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // مكون بطاقة الإحصائيات
  const StatCard = ({ title, value, icon: Icon, color, subtitle, isCurrency = true }: any) => (
    <div className="bg-card p-6 rounded-2xl shadow-soft border border-border hover:shadow-card transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h3 className="text-text-secondary text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-text-primary">{value.toLocaleString()} {isCurrency ? "ر.س" : ""}</p>
      {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-primary-blue" />
          التقارير الشاملة
        </h1>
        <p className="text-text-secondary mt-1">نظرة مالية وتشغيلية عامة على أداء النظام</p>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي المبيعات" value={totalSales} icon={TrendingUp} color="bg-primary-blue" />
        <StatCard title="إجمالي المشتريات" value={totalPurchases} icon={ShoppingCart} color="bg-warning" />
        <StatCard title="إجمالي التحصيلات (عهدة)" value={totalCollected} icon={Wallet} color="bg-success" />
        <StatCard title="رصيد الصندوق الحالي" value={cashBalance} icon={ArrowDownToLine} color="bg-info" subtitle={`إيداعات: ${cashIn.toLocaleString()} | سحوبات: ${cashOut.toLocaleString()}`} />
      </div>

      {/* Balances & Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="أرصدة العملاء (مدين)" value={totalCustomerBalances} icon={Users} color="bg-purple-500" subtitle={`حدود الائتمان: ${totalCreditLimits.toLocaleString()}`} />
        <StatCard title="أرصدة الموردين (دائن)" value={totalSupplierBalances} icon={Truck} color="bg-pink-500" />
        <StatCard title="قيمة المخزون (بسعر التكلفة)" value={inventoryValue} icon={Package} color="bg-indigo-500" />
        <div className={`bg-gradient-to-br from-primary-green to-success p-6 rounded-2xl shadow-card text-white`}>
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-white/80 text-sm mb-1">تنبيهات المخزون</h3>
          <p className="text-2xl font-bold">{lowStockCount} منتجات</p>
          <p className="text-xs text-white/70 mt-1">وصلت للحد الأدنى أو أقل</p>
        </div>
      </div>

      {/* Top Customers & Cash Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="bg-card p-6 rounded-2xl shadow-soft border border-border">
          <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-blue" /> أفضل العملاء
          </h3>
          <div className="space-y-4">
            {topCustomersArr.length === 0 ? (
              <p className="text-text-secondary text-sm text-center py-4">لا توجد بيانات كافية</p>
            ) : (
              topCustomersArr.map(([name, amount], index) => {
                const maxAmount = topCustomersArr[0][1];
                const percentage = (amount / maxAmount) * 100;
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-text-primary">{name}</span>
                      <span className="text-text-secondary">{amount.toLocaleString()} ر.س</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2.5">
                      <div className="bg-primary-blue h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Cash Flow Status */}
        <div className="bg-card p-6 rounded-2xl shadow-soft border border-border">
          <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-success" /> التدفق النقدي
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-success/5 rounded-xl border border-success/10">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-success" />
                <span className="text-sm font-medium text-text-primary">إجمالي النقدية الداخلة (In)</span>
              </div>
              <span className="font-bold text-success">{cashIn.toLocaleString()} ر.س</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-danger/5 rounded-xl border border-danger/10">
              <div className="flex items-center gap-2">
                <ArrowUpFromLine className="w-5 h-5 text-danger" />
                <span className="text-sm font-medium text-text-primary">إجمالي النقدية الخارجة (Out)</span>
              </div>
              <span className="font-bold text-danger">{cashOut.toLocaleString()} ر.س</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border mt-4">
              <span className="text-sm font-bold text-text-primary">الرصيد الصافي للنظام</span>
              <span className="font-bold text-primary-blue text-lg">{cashBalance.toLocaleString()} ر.س</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
