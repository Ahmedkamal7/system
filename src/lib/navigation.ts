import { LayoutDashboard, Users, Truck, Package, ShoppingCart, FileText, Send, Wallet, Banknote, BarChart3, Settings } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles: string[];
}

export const navItems: NavItem[] = [
  { title: "لوحة التحكم", href: "/", icon: LayoutDashboard, roles: ["Administrator", "Accountant", "Warehouse Keeper"] },
  { title: "العملاء", href: "/customers", icon: Users, roles: ["Administrator", "Accountant"] },
  { title: "الموردون", href: "/suppliers", icon: Truck, roles: ["Administrator", "Accountant", "Warehouse Keeper"] },
  { title: "المنتجات", href: "/products", icon: Package, roles: ["Administrator", "Warehouse Keeper"] },
  { title: "المخزون", href: "/inventory", icon: Package, roles: ["Administrator", "Warehouse Keeper"] },
  { title: "المشتريات", href: "/purchasing", icon: ShoppingCart, roles: ["Administrator", "Warehouse Keeper"] },
  { title: "المبيعات", href: "/sales", icon: FileText, roles: ["Administrator", "Accountant"] },
  { title: "الموزعون", href: "/distributors", icon: Send, roles: ["Administrator", "Distributor"] },
  { title: "التحصيلات", href: "/collectors", icon: Wallet, roles: ["Administrator", "Accountant", "Collector"] },
  { title: "صندوق النقدية", href: "/cashbox", icon: Banknote, roles: ["Administrator", "Accountant"] },
  { title: "التقارير", href: "/reports", icon: BarChart3, roles: ["Administrator", "Accountant"] },
  { title: "الإعدادات", href: "/settings", icon: Settings, roles: ["Administrator"] },
];
