'use client';

import { useState } from 'react';
import { AlertTriangle, Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface ForceChangeCredentialsProps {
  admin: { id: string; email: string; name: string; isDefaultPassword: boolean };
  onChanged: (admin: { id: string; email: string; name: string; isDefaultPassword: boolean }) => void;
  onLogout: () => void;
}

export default function ForceChangeCredentials({ admin, onChanged, onLogout }: ForceChangeCredentialsProps) {
  const [newEmail, setNewEmail] = useState(admin.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newEmail.includes('@')) {
      setError('البريد الإلكتروني غير صالح');
      return;
    }

    if (newPassword.length < 6) {
      setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          currentPassword,
          newPassword,
          newEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ');
        return;
      }

      setSuccess('تم تحديث البيانات بنجاح! جاري الدخول...');
      setTimeout(() => {
        onChanged(data.admin);
      }, 1000);
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-trading-border bg-trading-bg py-3 pr-10 pl-10 text-sm text-trading-text placeholder:text-trading-text-secondary/50 focus:border-trading-gold focus:outline-none focus:ring-1 focus:ring-trading-gold/30";

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: '#0a0e17' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-trading-sell/20 to-trading-sell/5 border-2 border-trading-sell/30">
            <AlertTriangle className="h-8 w-8 text-trading-sell" />
          </div>
          <h2 className="text-xl font-bold text-trading-text">⚠️ تغيير بيانات المدير مطلوب</h2>
          <p className="mt-2 text-sm text-trading-text-secondary">
            أنت تستخدم البيانات الافتراضية. يرجى تغيير البريد وكلمة المرور للمتابعة.
          </p>
        </div>

        <form onSubmit={handleChange} className="space-y-4 rounded-2xl border border-trading-border bg-trading-card p-6">
          {/* البريد الجديد */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-trading-text-secondary">البريد الإلكتروني الجديد</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-trading-text-secondary" />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="admin@forexyemeni.com"
                required
                dir="ltr"
                className={inputClass}
              />
            </div>
          </div>

          {/* كلمة المرور الحالية */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-trading-text-secondary">كلمة المرور الحالية</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-trading-text-secondary" />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                dir="ltr"
                className={inputClass}
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-trading-text-secondary hover:text-trading-text">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* كلمة المرور الجديدة */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-trading-text-secondary">كلمة المرور الجديدة</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-trading-text-secondary" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6 أحرف على الأقل"
                required
                dir="ltr"
                className={inputClass}
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-trading-text-secondary hover:text-trading-text">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword.length > 0 && newPassword.length < 6 && (
              <p className="mt-1 text-[10px] text-trading-sell">كلمة المرور يجب أن تكون 6 أحرف على الأقل</p>
            )}
          </div>

          {/* تأكيد كلمة المرور */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-trading-text-secondary">تأكيد كلمة المرور الجديدة</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-trading-text-secondary" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
                required
                dir="ltr"
                className={inputClass}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-trading-text-secondary hover:text-trading-text">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="mt-1 text-[10px] text-trading-sell">كلمة المرور غير متطابقة</p>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-trading-sell/10 border border-trading-sell/20 p-3 text-center text-sm text-trading-sell">{error}</div>
          )}
          {success && (
            <div className="rounded-lg bg-trading-buy/10 border border-trading-buy/20 p-3 text-center text-sm text-trading-buy">{success}</div>
          )}

          <button
            type="submit"
            disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword || !currentPassword || !newEmail.includes('@')}
            className="w-full rounded-xl bg-gradient-to-l from-trading-gold to-amber-600 py-3 text-sm font-bold text-black transition-all hover:shadow-lg hover:shadow-trading-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                جاري التحديث...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                تحديث البيانات
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full rounded-xl border border-trading-border py-2.5 text-xs text-trading-text-secondary hover:bg-trading-bg"
          >
            تسجيل خروج
          </button>
        </form>
      </div>
    </div>
  );
}
