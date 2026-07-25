"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/navigation";
import { X } from "lucide-react";
import { useSettings } from "@/lib/context/SettingsContext";

interface SidebarProps {
  userRole: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ userRole, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { companyName } = useSettings();
  
  const filteredNavItems = navItems.filter(item => 
    !userRole || userRole === "undefined" ? true : item.roles.includes(userRole)
  );

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 right-0 z-50 h-full w-72 glass-card border-l border-border
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}
        lg:translate-x-0 lg:static lg:z-0
      `}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-blue to-primary-green rounded-xl flex items-center justify-center shadow-soft">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-text-primary text-lg leading-tight">{companyName}</h1>
              <p className="text-xs text-text-secondary">ERP System</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-text-secondary hover:text-text-primary transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-100px)]">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? "bg-primary-blue/10 text-primary-blue font-semibold" 
                    : "text-text-secondary hover:bg-background hover:text-text-primary"}
                `}
              >
                <item.icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${isActive ? "text-primary-blue" : ""}`} />
                <span className="text-[15px]">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
