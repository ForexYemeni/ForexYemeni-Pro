'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Eye, EyeOff, Check, X, RefreshCw, Key, TrendingUp, Lock, AlertTriangle, Users, UserCheck, UserX, ShieldBan, Shield } from 'lucide-react';
import type { Signal, AdminUser } from '@/lib/types';
import SignalForm from './SignalForm';
import LicenseManager from './LicenseManager';

interface AdminDashboardProps {
  admin: AdminUser;
  onPasswordChanged: (admin: AdminUser) => void;
  onLogout: () => void;
}

// Force Password Change Component
function ForcePasswordChange({ admin, onPasswordChanged }: { admin: AdminUser; onPasswordChanged: (admin: AdminUser) => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ');
        return;
      }

      setSuccess('تم تغيير كلمة المرور بنجاح');
      // Update admin with new state
      onPasswordChanged({ ...admin, isDefaultPassword: false });
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-trading-sell/20 to-trading-sell/5 border border-trading-sell/30">
          <AlertTriangle className="h-8 w-8 text-trading-sell" />
        </div>
        <h2 className="text-xl font-bold text-trading-text">تغيير كلمة المرور مطلوب</h2>
        <p className="mt-2 text-sm text-trading-text-secondary">
          أنت تستخدم كلمة المرور الافتراضية. يرجى تغييرها للمتابعة.
        </p>
      </div>

      <form onSubmit={handleChangePassword} className="rounded-xl border border-trading-border bg-trading-card p-6 space-y-4">
        {/* Current Password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-trading-text-secondary">
            كلمة المرور الحالية
          </label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-trading-text-secondary" />
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              dir="ltr"
              className="w-full rounded-lg border border-trading-border bg-trading-bg py-2.5 pr-10 pl-10 text-sm text-trading-text placeholder:text-trading-text-secondary/50 focus:border-trading-gold focus:outline-none focus:ring-1 focus:ring-trading-gold"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-trading-text-secondary hover:text-trading-text"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-trading-text-secondary">
            كلمة المرور الجديدة
          </label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-trading-text-secondary" />
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="6 أحرف على الأقل"
              required
              dir="ltr"
              className="w-full rounded-lg border border-trading-border bg-trading-bg py-2.5 pr-10 pl-10 text-sm text-trading-text placeholder:text-trading-text-secondary/50 focus:border-trading-gold focus:outline-none focus:ring-1 focus:ring-trading-gold"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-trading-text-secondary hover:text-trading-text"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {newPassword.length > 0 && newPassword.length < 6 && (
            <p className="mt-1 text-[10px] text-trading-sell">كلمة المرور يجب أن تكون 6 أحرف على الأقل</p>
          )}
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-trading-text-secondary">
            تأكيد كلمة المرور الجديدة
          </label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-trading-text-secondary" />
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="أعد إدخال كلمة المرور"
              required
              dir="ltr"
              className="w-full rounded-lg border border-trading-border bg-trading-bg py-2.5 pr-10 pl-10 text-sm text-trading-text placeholder:text-trading-text-secondary/50 focus:border-trading-gold focus:outline-none focus:ring-1 focus:ring-trading-gold"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-trading-text-secondary hover:text-trading-text"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p className="mt-1 text-[10px] text-trading-sell">كلمة المرور غير متطابقة</p>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-trading-sell/10 border border-trading-sell/20 p-3 text-center text-sm text-trading-sell">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-trading-buy/10 border border-trading-buy/20 p-3 text-center text-sm text-trading-buy">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword || !currentPassword}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-l from-trading-gold to-yellow-600 py-2.5 text-sm font-bold text-trading-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-trading-bg border-t-transparent" />
          ) : (
            <>
              <Lock className="h-4 w-4" />
              تغيير كلمة المرور
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// Main Admin Dashboard
export default function AdminDashboard({ admin, onPasswordChanged, onLogout }: AdminDashboardProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSignal, setEditingSignal] = useState<Signal | null>(null);
  const [activeTab, setActiveTab] = useState<'signals' | 'users' | 'licenses' | 'create'>('signals');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);

  const fetchSignals = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/signals');
      const data = await res.json();
      setSignals(data);
    } catch {
      console.error('Failed to fetch signals');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch {}
    finally { setIsLoadingUsers(false); }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  const handleDeleteSignal = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الإشارة؟')) return;

    try {
      await fetch(`/api/signals/${id}`, { method: 'DELETE' });
      setSignals((prev) => prev.filter((s) => s.id !== id));
    } catch {
      console.error('Failed to delete signal');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/signals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const updated = await res.json();
      setSignals((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch {
      console.error('Failed to update signal');
    }
  };

  const handleToggleTarget = async (signalId: string, targetId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'HIT' ? 'PENDING' : 'HIT';
    try {
      await fetch(`/api/signals/${signalId}/target`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, status: newStatus }),
      });
      fetchSignals();
    } catch {
      console.error('Failed to update target');
    }
  };

  const handleSignalCreated = () => {
    setShowForm(false);
    setEditingSignal(null);
    setActiveTab('signals');
    fetchSignals();
  };

  const tabs = [
    { id: 'signals' as const, label: 'الإشارات', icon: TrendingUp },
    { id: 'users' as const, label: 'المستخدمون', icon: Users },
    { id: 'create' as const, label: 'إشارة جديدة', icon: Plus },
    { id: 'licenses' as const, label: 'التراخيص', icon: Key },
  ];

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch {}
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'نشطة', color: 'text-trading-gold' },
    TP_HIT: { label: 'ناجحة', color: 'text-trading-buy' },
    SL_HIT: { label: 'خاسرة', color: 'text-trading-sell' },
    CLOSED: { label: 'مغلقة', color: 'text-gray-400' },
  };

  // If admin has default password, force change (after all hooks)
  if (admin.isDefaultPassword) {
    return <ForcePasswordChange admin={admin} onPasswordChanged={onPasswordChanged} />;
  }

  return (
    <div>
      {/* Tabs */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto border-b border-trading-border pb-3 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'signals') fetchSignals();
              if (tab.id === 'users') fetchUsers();
            }}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-trading-gold text-trading-bg'
                : 'text-trading-text-secondary hover:bg-trading-card'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-trading-text">
              المستخدمون ({users.length})
            </h3>
            <button
              onClick={fetchUsers}
              className="flex items-center gap-1.5 rounded-lg border border-trading-border px-3 py-1.5 text-xs text-trading-text-secondary hover:bg-trading-card"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              تحديث
            </button>
          </div>

          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-trading-border border-t-trading-gold" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-trading-border bg-trading-card py-12">
              <Users className="mb-3 h-12 w-12 text-trading-text-secondary" />
              <p className="text-sm text-trading-text-secondary">لا يوجد مستخدمون</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user: any) => (
                <div key={user.id} className="overflow-hidden rounded-xl border border-trading-border bg-trading-card">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h4 className="text-sm font-bold text-trading-text">{user.name}</h4>
                          {user.isApproved ? (
                            <span className="rounded-md bg-trading-buy/15 px-2 py-0.5 text-[10px] font-bold text-trading-buy">معتمد</span>
                          ) : (
                            <span className="rounded-md bg-yellow-500/15 px-2 py-0.5 text-[10px] font-bold text-yellow-400">بانتظار</span>
                          )}
                          {user.isBlocked && (
                            <span className="rounded-md bg-trading-sell/15 px-2 py-0.5 text-[10px] font-bold text-trading-sell">محظور</span>
                          )}
                        </div>
                        <p className="text-xs text-trading-text-secondary" dir="ltr">{user.email}</p>
                        <p className="mt-1 text-[10px] text-trading-text-secondary">
                          تاريخ التسجيل: {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {!user.isApproved && !user.isBlocked && (
                        <>
                          <button
                            onClick={() => handleUserAction(user.id, 'approve')}
                            className="flex items-center gap-1 rounded-lg border border-trading-buy/30 bg-trading-buy/5 px-3 py-1.5 text-[11px] font-medium text-trading-buy hover:bg-trading-buy/10"
                          >
                            <UserCheck className="h-3 w-3" />
                            موافقة
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, 'reject')}
                            className="flex items-center gap-1 rounded-lg border border-trading-sell/30 bg-trading-sell/5 px-3 py-1.5 text-[11px] font-medium text-trading-sell hover:bg-trading-sell/10"
                          >
                            <UserX className="h-3 w-3" />
                            رفض
                          </button>
                        </>
                      )}
                      {user.isApproved && !user.isBlocked && (
                        <button
                          onClick={() => handleUserAction(user.id, 'block')}
                          className="flex items-center gap-1 rounded-lg border border-orange-500/30 bg-orange-500/5 px-3 py-1.5 text-[11px] font-medium text-orange-400 hover:bg-orange-500/10"
                        >
                          <ShieldBan className="h-3 w-3" />
                          حظر
                        </button>
                      )}
                      {user.isBlocked && (
                        <button
                          onClick={() => handleUserAction(user.id, 'unblock')}
                          className="flex items-center gap-1 rounded-lg border border-trading-gold/30 bg-trading-gold/5 px-3 py-1.5 text-[11px] font-medium text-trading-gold hover:bg-trading-gold/10"
                        >
                          <Shield className="h-3 w-3" />
                          إلغاء الحظر
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) {
                            handleUserAction(user.id, 'delete');
                          }
                        }}
                        className="flex items-center gap-1 rounded-lg border border-trading-sell/30 bg-trading-sell/5 px-3 py-1.5 text-[11px] font-medium text-trading-sell hover:bg-trading-sell/10"
                      >
                        <Trash2 className="h-3 w-3" />
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Signals Tab */}
      {activeTab === 'signals' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-trading-text">
              جميع الإشارات ({signals.length})
            </h3>
            <button
              onClick={fetchSignals}
              className="flex items-center gap-1.5 rounded-lg border border-trading-border px-3 py-1.5 text-xs text-trading-text-secondary hover:bg-trading-card"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-trading-border border-t-trading-gold" />
            </div>
          ) : signals.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-trading-border bg-trading-card py-12">
              <span className="mb-3 text-4xl">📭</span>
              <p className="text-sm text-trading-text-secondary">لا توجد إشارات</p>
            </div>
          ) : (
            <div className="space-y-3 pb-safe">
              {signals.map((signal) => (
                <div
                  key={signal.id}
                  className="overflow-hidden rounded-xl border border-trading-border bg-trading-card"
                >
                  {/* Signal Header */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-lg px-2.5 py-1 text-sm font-bold ${
                          signal.type === 'BUY'
                            ? 'bg-trading-buy/15 text-trading-buy'
                            : 'bg-trading-sell/15 text-trading-sell'
                        }`}
                      >
                        {signal.type === 'BUY' ? 'شراء' : 'بيع'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-trading-text">{signal.pair}</h4>
                        <p className="text-[11px] text-trading-text-secondary">
                          {signal.timeframe} · دخول: {signal.entryPrice}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${statusConfig[signal.status]?.color || ''}`}>
                        {statusConfig[signal.status]?.label || signal.status}
                      </span>
                      <button
                        onClick={() => setExpandedSignal(expandedSignal === signal.id ? null : signal.id)}
                        className="rounded-lg p-1 text-trading-text-secondary hover:bg-trading-card-alt"
                      >
                        {expandedSignal === signal.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedSignal === signal.id && (
                    <div className="border-t border-trading-border p-4">
                      {/* Targets */}
                      <div className="mb-3">
                        <p className="mb-2 text-xs font-medium text-trading-text-secondary">الأهداف:</p>
                        <div className="space-y-1.5">
                          {signal.targets.map((target) => (
                            <div
                              key={target.id}
                              className="flex items-center justify-between rounded-lg bg-trading-bg/50 px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleTarget(signal.id, target.id, target.status)}
                                  className={`flex h-6 w-6 items-center justify-center rounded-md border transition-colors ${
                                    target.status === 'HIT'
                                      ? 'border-trading-buy bg-trading-buy text-trading-bg'
                                      : 'border-trading-border hover:border-trading-buy'
                                  }`}
                                >
                                  {target.status === 'HIT' ? <Check className="h-3.5 w-3.5" /> : <span className="text-xs">{target.order}</span>}
                                </button>
                                <span className="text-sm text-trading-text">{target.price}</span>
                                <span className="text-[10px] text-trading-text-secondary">{target.percentage}%</span>
                              </div>
                              <span className={`text-[10px] font-medium ${target.status === 'HIT' ? 'text-trading-buy' : 'text-trading-text-secondary'}`}>
                                {target.status === 'HIT' ? '✓ تحقق' : '⏳ انتظار'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status Actions */}
                      <div className="mb-3">
                        <p className="mb-2 text-xs font-medium text-trading-text-secondary">تحديث الحالة:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(statusConfig).map(([status, config]) => (
                            <button
                              key={status}
                              onClick={() => handleUpdateStatus(signal.id, status)}
                              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                                signal.status === status
                                  ? 'border-trading-gold bg-trading-gold/15 text-trading-gold'
                                  : 'border-trading-border text-trading-text-secondary hover:bg-trading-card-alt'
                              }`}
                            >
                              {config.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingSignal(signal);
                            setActiveTab('create');
                          }}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-trading-border py-2 text-xs text-trading-text-secondary hover:bg-trading-card-alt"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteSignal(signal.id)}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-trading-sell/30 bg-trading-sell/5 px-4 py-2 text-xs text-trading-sell hover:bg-trading-sell/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          حذف
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Signal Tab */}
      {activeTab === 'create' && (
        <SignalForm
          editingSignal={editingSignal}
          onCreated={handleSignalCreated}
          onCancel={() => {
            setEditingSignal(null);
            setActiveTab('signals');
          }}
        />
      )}

      {/* Licenses Tab */}
      {activeTab === 'licenses' && <LicenseManager />}
    </div>
  );
}
