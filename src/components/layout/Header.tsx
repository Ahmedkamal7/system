"use client";

import { Menu, Search, Bell } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  onMenuClick: () => void;
  username: string | null;
  roleName: string | null;
}

export default function Header({ onMenuClick, username, roleName }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 glass-card border-b border-border">
      <div className="flex items-center justify-between px-4 md:px-8 h-20">
        
        <div className="flex items-center gap-4 flex-1">
          <button onClick={onMenuClick} className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="hidden md:flex items-center gap-2 bg-background border border-border rounded-xl px-4 py-2.5 w-full max-w-md">
            <Search className="w-5 h-5 text-text-secondary" />
            <input 
              type="text" 
              placeholder="ابحث عن عميل، فاتورة، أو منتج..." 
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-text-secondary"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-text-secondary hover:text-text-primary transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white"></span>
          </button>

          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1 pr-2 rounded-xl hover:bg-background transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-blue to-info rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-text-primary leading-tight">{username || "مستخدم"}</p>
                <p className="text-xs text-text-secondary leading-tight">{roleName || "غير محدد"}</p>
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute left-0 mt-2 w-56 glass-card border border-border rounded-xl shadow-card py-2 animate-fade-in">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-semibold text-text-primary">{username}</p>
                  <p className="text-xs text-text-secondary">{roleName}</p>
                </div>
                <form action="/auth/signout" method="post">
                  <button type="submit" className="w-full text-right px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors">
                    تسجيل الخروج
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
