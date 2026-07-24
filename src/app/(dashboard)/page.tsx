"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  TrendingUp, Wallet, Banknote, Users, Truck, Package, 
  AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Activity, 
  ShoppingBag, UserCheck
} from "lucide-react";

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});

  const fetchDashboardData = async () => {
    setLoading(true);
    
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();

    const { data: todaySales } = await supabase
      .from("sales")
      .select("total_amount")
      .gte("created_at", startOfDay);
    
    const totalTodaySales = todaySales?.reduce((s, sale) => s + Number(sale.total_amount), 0) || 0;

    const { data: todayCollections } = await supabase
      .from("collections")
      .select("amount")
      .gte("created_at", startOfDay);
    
    const totalTodayCollections = todayCollections?.reduce((s, c) => s + Number(c.amount), 0) || 0;

    const { data: cashBoxes } = await supabase.from("cash_boxes").select("balance");
    const totalCash = cashBoxes?.reduce((s, c) => s + Number(c.balance), 0) || 0;

    const { data: allCollections } = await supabase.from("collections").select("amount, status").eq("status", "COLLECTED");
    const collectorBalances = allCollections?.reduce((s, c) => s + Number(c.amount), 0) || 0;

    const { data: customers } = await supabase.from("customers").select("opening_balance").is("deleted_at", null);
    const customerBalances = customers?.reduce((s, c) => s + Number(c.opening_balance), 0) || 0;

    const { data: suppliers } = await supabase.from("suppliers").select("opening_balance").is("deleted_at", null);
    const supplierBalances = suppliers?.reduce((s, sup) => s + Number(sup.opening_balance), 0) || 0;

    const { data: inventory } = await supabase
      .from("inventory_levels")
      .select("quantity, products ( name, purchase_price, min_stock )");
    
    const inventoryValue = inventory?.reduce((s, item) => s + (Number(item.quantity) * Number(item.products?.purchase_price || 0)), 0) || 0;
    const lowStockItems = inventory?.filter(item => Number(item.quantity) <= Number(item.products?.min_stock)) || [];

    const { data: recentSales } = await supabase
      .from("sales")
      .select("id, total_amount, created_at, customers ( name )")
      .order("created_at", { ascending: false })
      .limit(5);

    setStats({
      totalTodaySales,
      totalTodayCollections,
      totalCash,
      collectorBalances,
      customerBalances,
      supplierBalances,
      inventoryValue,
      lowStockCount: lowStockItems.length,
      recentSales
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => fetchDashboardData())
      .on("postgres_changes", { event: "*", schema: "public", table: "collections" }, () => fetchDashboardData())
      .on("postgres_changes", { event: "*", schema: "public", table: "cash_transactions" }, () => fetchDashboardData())
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_levels" }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const StatCard = ({ title, value, icon: Icon, color, subtitle, isCurrency = true }: any) => (
    <div className="bg-card p-6 rounded-2xl shadow-soft border border-border hover:shadow-card transition-all duration-300 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shadow-soft`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h3 className="text-text-secondary text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-text-primary">
        {loading ? "..." : value.toLocaleString()} {isCurrency ? "ر.س" : ""}
      </p>
      {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">لوحة التحكم التنفيذية</h1>
          <p className="text-text-secondary mt-1 flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            متصل مباشر (Realtime)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="مبيعات اليوم" value={stats.totalTodaySales || 0} icon={TrendingUp} color="bg-primary-blue" />
        <StatCard title="تحصيلات اليوم" value={stats.totalTodayCollections || 0} icon={Banknote} color="bg-success" />
        <StatCard title="رصيد الصندوق" value={stats.totalCash || 0} icon={Wallet} color="bg-info" />
        <StatCard title="عهدة المحصلين" value={stats.collectorBalances || 0} icon={UserCheck} color="bg-warning" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="أرصدة العملاء" value={stats.customerBalances || 0} icon={Users} color="bg-purple-500" subtitle="إجمالي المديونيات" />
        <StatCard title="أرصدة الموردين" value={stats.supplierBalances || 0} icon={Truck} color="bg-pink-500" subtitle="إجمالي المستحقات" />
        <StatCard title="قيمة المخزون" value={stats.inventoryValue || 0} icon={Package} color="bg-indigo-500" subtitle="بسعر التكلفة" />
        <StatCard title="تنبيهات المخزون" value={stats.lowStockCount || 0} icon={AlertTriangle} color="bg-danger" isCurrency={false} subtitle="منتجات وصلت للحد الأدنى" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card p-6 rounded-2xl shadow-soft border border-border">
          <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-blue" /> أحدث المعاملات (المبيعات)
          </h3>
          <div className="space-y-3">
            {loading ? (
              <p className="text-text-secondary text-sm text-center py-4">جاري تحميل المعاملات...</p>
            ) : stats.recentSales?.length === 0 ? (
              <p className="text-text-secondary text-sm text-center py-4">لا توجد معاملات حديثة</p>
            ) : (
              stats.recentSales?.map((sale: any) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-background rounded-xl border border-border hover:border-primary-blue/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-blue/10 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-primary-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary text-sm">{sale.customers?.name || "عميل نقدي"}</p>
                      <p className="text-xs text-text-secondary">{new Date(sale.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <p className="font-bold text-success">{Number(sale.total_amount).toLocaleString()} ر.س</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl shadow-soft border border-border">
          <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-success" /> صحة النظام
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-success/5 rounded-xl border border-success/10">
              <span className="text-sm font-medium text-text-primary">حالة قاعدة البيانات</span>
              <span className="flex items-center gap-1 text-success text-sm font-semibold">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span> تعمل
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-info/5 rounded-xl border border-info/10">
              <span className="text-sm font-medium text-text-primary">اتصال Realtime</span>
              <span className="flex items-center gap-1 text-info text-sm font-semibold">
                <span className="w-2 h-2 bg-info rounded-full animate-pulse"></span> نشط
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
              <span className="text-sm font-medium text-text-primary">إجمالي السيولة المتاحة</span>
              <span className="font-bold text-primary-blue">{((stats.totalCash || 0) + (stats.collectorBalances || 0)).toLocaleString()} ر.س</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
