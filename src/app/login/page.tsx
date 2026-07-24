"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("بيانات الدخول غير صحيحة. يرجى المحاولة مرة أخرى.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden relative">
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary-blue/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-primary-green/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="glass-card shadow-card rounded-3xl p-8 md:p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-blue to-primary-green rounded-2xl flex items-center justify-center shadow-soft mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary text-center">Smart ERP System</h1>
            <p className="text-text-secondary mt-2 text-center">نظام إدارة الموارد المؤسسية</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 border border-border rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all outline-none"
                placeholder="admin@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">كلمة المرور</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 border border-border rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-blue hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-soft hover:shadow-lg disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? "جاري التحقق..." : "تسجيل الدخول"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
