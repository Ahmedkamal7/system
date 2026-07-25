"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { SettingsProvider } from "@/lib/context/SettingsContext";

interface DashboardShellProps {
  children: React.ReactNode;
  username: string;
  userRole: string | null;
}

export default function DashboardShell({ children, username, userRole }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <SettingsProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar 
          userRole={userRole} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            onMenuClick={() => setIsSidebarOpen(true)} 
            username={username}
            roleName={userRole}
          />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SettingsProvider>
  );
}
