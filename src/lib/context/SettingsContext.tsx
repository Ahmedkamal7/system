"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const SettingsContext = createContext({ currency: "ر.س", companyName: "Smart ERP" });

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [settings, setSettings] = useState({ currency: "ر.س", companyName: "Smart ERP" });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("settings").select("key, value");
      const obj: any = { currency: "ر.س", companyName: "Smart ERP" };
      data?.forEach(s => {
        if (s.key === "currency") obj.currency = s.value;
        if (s.key === "company_name") obj.companyName = s.value;
      });
      setSettings(obj);
    };
    fetchSettings();
  }, [supabase]);

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
