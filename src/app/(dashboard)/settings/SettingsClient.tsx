"use client";

import { useState } from "react";
import { updateUserRole, toggleUserStatus, saveSettings, updateUsername, createUser } from "./actions";
import { UserCog, Save, Building2, Clock, Coins, UserPlus, Edit2, Check, X } from "lucide-react";
import Modal from "@/components/ui/Modal";

export default function SettingsClient({ users, roles, settings }: { 
  users: any[]; 
  roles: any[];
  settings: Record<string, string>;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settingsForm, setSettingsForm] = useState(settings);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [tempUsername, setTempUsername] = useState("");
  const [newUser, setNewUser] = useState({ email: "", password: "", username: "", role_id: "" });

  const handleRoleChange = async (profileId: string, roleId: string) => {
    setLoading(profileId);
    setError(null);
    const result = await updateUserRole(profileId, roleId);
    if (result.error) setError(result.error);
    setLoading(null);
  };

  const handleStatusToggle = async (profileId: string, isActive: boolean) => {
    setLoading(profileId);
    setError(null);
    const result = await toggleUserStatus(profileId, !isActive);
    if (result.error) setError(result.error);
    setLoading(null);
  };

  const handleEditUsername = (userId: string, currentName: string) => {
    setEditingUser(userId);
    setTempUsername(currentName);
  };

  const handleSaveUsername = async (userId: string) => {
    setLoading(userId);
    const result = await updateUsername(userId, tempUsername);
    if (result.error) setError(result.error);
    setEditingUser(null);
    setLoading(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("creating_user");
    setError(null);
    const result = await createUser(newUser);
    if (result.error) setError(result.error);
    else { setIsUserModalOpen(false); setNewUser({ email: "", password: "", username: "", role_id: "" }); }
    setLoading(null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("settings");
    setError(null);
    setSuccess(null);
    const result = await saveSettings(settingsForm);
    if (result.error) setError(result.error);
    else setSuccess("تم حفظ الإعدادات بنجاح");
    setLoading(null);
  };

  const inputClass = "w-full px-3 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all text-sm";
  const labelClass = "block text-sm font-medium text-text-secondary mb-1.5";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* User Management */}
      <div className="lg:col-span-2 bg-card p-6 rounded-2xl shadow-soft border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary-blue" /> إدارة المستخدمين والصلاحيات
          </h2>
          <button onClick={() => setIsUserModalOpen(true)} className="flex items-center gap-1 bg-primary-blue text-white px-3 py-2 rounded-xl text-sm hover:bg-blue-600">
            <UserPlus className="w-4 h-4" /> إضافة مستخدم
          </button>
        </div>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-background rounded-xl gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-primary-blue/10 rounded-full flex items-center justify-center text-primary-blue font-bold">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  {editingUser === user.id ? (
                    <div className="flex items-center gap-2">
                      <input type="text" value={tempUsername} onChange={(e) => setTempUsername(e.target.value)} className={`${inputClass} w-40`} />
                      <button onClick={() => handleSaveUsername(user.id)} className="p-2 text-success hover:bg-success/10 rounded-lg"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingUser(null)} className="p-2 text-danger hover:bg-danger/10 rounded-lg"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-text-primary">{user.username}</p>
                      <button onClick={() => handleEditUsername(user.id, user.username)} className="p-1 text-text-secondary hover:text-primary-blue"><Edit2 className="w-3 h-3" /></button>
                    </div>
                  )}
                  <p className="text-xs text-text-secondary">{user.full_name || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={user.role_id || ""}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className={`${inputClass} w-40`}
                  disabled={loading === user.id}
                >
                  <option value="" disabled>اختر الدور</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleStatusToggle(user.id, user.is_active)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    user.is_active 
                      ? "bg-success/10 text-success hover:bg-success/20" 
                      : "bg-danger/10 text-danger hover:bg-danger/20"
                  }`}
                  disabled={loading === user.id}
                >
                  {user.is_active ? "مفعل" : "معطل"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-card p-6 rounded-2xl shadow-soft border border-border h-fit">
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary-green" /> إعدادات النظام
        </h2>
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className={labelClass}>اسم الشركة</label>
            <div className="relative">
              <Building2 className="absolute right-3 top-3 w-4 h-4 text-text-secondary" />
              <input type="text" value={settingsForm.company_name || ""} onChange={(e) => setSettingsForm({...settingsForm, company_name: e.target.value})} className={`${inputClass} pr-9`} />
            </div>
          </div>
          <div>
            <label className={labelClass}>العملة</label>
            <div className="relative">
              <Coins className="absolute right-3 top-3 w-4 h-4 text-text-secondary" />
              <input type="text" value={settingsForm.currency || ""} onChange={(e) => setSettingsForm({...settingsForm, currency: e.target.value})} className={`${inputClass} pr-9`} />
            </div>
          </div>
          <div>
            <label className={labelClass}>المنطقة الزمنية للأعمال</label>
            <div className="relative">
              <Clock className="absolute right-3 top-3 w-4 h-4 text-text-secondary" />
              <input type="text" value={settingsForm.timezone || ""} onChange={(e) => setSettingsForm({...settingsForm, timezone: e.target.value})} className={`${inputClass} pr-9`} placeholder="Asia/Riyadh" />
            </div>
          </div>

          {error && <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl text-center">{error}</div>}
          {success && <div className="bg-success/10 text-success text-sm p-3 rounded-xl text-center">{success}</div>}

          <button type="submit" disabled={loading === "settings"} className="w-full flex items-center justify-center gap-2 bg-primary-blue text-white py-2.5 rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-soft disabled:opacity-50">
            <Save className="w-4 h-4" />
            {loading === "settings" ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
        </form>
      </div>

      {/* Add User Modal */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="إضافة مستخدم جديد">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className={labelClass}>اسم المستخدم</label>
            <input type="text" required value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>البريد الإلكتروني</label>
            <input type="email" required value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>كلمة المرور</label>
            <input type="password" required minLength={6} value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>الدور</label>
            <select required value={newUser.role_id} onChange={(e) => setNewUser({...newUser, role_id: e.target.value})} className={inputClass}>
              <option value="">اختر الدور</option>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
          </div>
          {error && <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl text-center">{error}</div>}
          <button type="submit" disabled={loading === "creating_user"} className="w-full bg-primary-blue text-white py-2.5 rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50">
            {loading === "creating_user" ? "جاري الإنشاء..." : "إنشاء الحساب"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
