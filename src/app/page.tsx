'use client';

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/shared/Navigation';
import StatsBar from '@/components/user/StatsBar';
import SignalList from '@/components/user/SignalList';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AuthPage from '@/components/auth/AuthPage';
import ForceChangeCredentials from '@/components/auth/ForceChangeCredentials';
import type { AppView, AdminUser, Signal, Stats } from '@/lib/types';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isApproved?: boolean;
  isBlocked?: boolean;
}

export default function HomePage() {
  const [currentView, setCurrentView] = useState<AppView>('user');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTrades: 0, closedTrades: 0, winTrades: 0, lossTrades: 0, winRate: 0, activeSignals: 0,
  });
  const [isLoadingSignals, setIsLoadingSignals] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isSeeding, setIsSeeding] = useState(true);

  // التحقق من الجلسة المحفوظة
  useEffect(() => {
    const savedToken = localStorage.getItem('fy_token');
    const savedUser = localStorage.getItem('fy_user');
    const savedAdmin = localStorage.getItem('fy_admin');
    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setAuthUser(user);
        setAuthToken(savedToken);
        fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${savedToken}` },
        }).then(res => {
          if (res.ok) return res.json();
          throw new Error();
        }).then(data => {
          if (data.user) {
            const freshUser = { id: data.user.id, email: data.user.email, name: data.user.name, role: data.user.role, isApproved: data.user.isApproved ?? false, isBlocked: data.user.isBlocked ?? false };
            setAuthUser(freshUser);
            localStorage.setItem('fy_user', JSON.stringify(freshUser));
            if (freshUser.isBlocked) {
              localStorage.removeItem('fy_token');
              localStorage.removeItem('fy_user');
              setAuthUser(null);
              setAuthToken(null);
            }
          }
        }).catch(() => {
          localStorage.removeItem('fy_token');
          localStorage.removeItem('fy_user');
          setAuthUser(null);
          setAuthToken(null);
        });
      } catch {
        localStorage.removeItem('fy_token');
        localStorage.removeItem('fy_user');
      }
    }
    // استعادة جلسة المدير
    if (savedAdmin) {
      try {
        const admin = JSON.parse(savedAdmin);
        setAdminUser(admin);
        setIsAdmin(true);
        setCurrentView('admin-dashboard');
      } catch {}
    }
    setIsAuthLoading(false);
  }, []);

  // إعداد قاعدة البيانات
  useEffect(() => {
    const setup = async () => {
      try { await fetch('/api'); } catch {}
      try { await fetch('/api/seed', { method: 'POST' }); } catch {}
      finally { setIsSeeding(false); }
    };
    setup();
  }, []);

  const fetchSignals = useCallback(async () => {
    setIsLoadingSignals(true);
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch('/api/signals', { headers });
      const data = await res.json();
      if (Array.isArray(data)) setSignals(data);
      // إذا approved: false، لا نقوم بتعيين الإشارات (تم التعامل معها في الواجهة)
    } catch {}
    finally { setIsLoadingSignals(false); }
  }, [authToken]);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch('/api/stats', { headers });
      const data = await res.json();
      setStats(data);
    } catch {}
    finally { setIsLoadingStats(false); }
  }, [authToken]);

  useEffect(() => {
    if (!isSeeding && authUser) {
      fetchSignals();
      fetchStats();
    }
  }, [isSeeding, authUser, fetchSignals, fetchStats]);

  useEffect(() => {
    if (currentView === 'user' && !isSeeding && authUser) {
      const interval = setInterval(() => { fetchSignals(); fetchStats(); }, 30000);
      return () => clearInterval(interval);
    }
  }, [currentView, isSeeding, authUser, fetchSignals, fetchStats]);

  const handleAuthSuccess = (user: { id: string; email: string; name: string; role: string; token: string; isApproved?: boolean; isBlocked?: boolean }) => {
    const userData = { id: user.id, email: user.email, name: user.name, role: user.role, isApproved: user.isApproved ?? false, isBlocked: user.isBlocked ?? false };
    setAuthUser(userData);
    setAuthToken(user.token);
    localStorage.setItem('fy_token', user.token);
    localStorage.setItem('fy_user', JSON.stringify(userData));
  };

  const handleUserLogout = async () => {
    if (authToken) {
      try { await fetch('/api/auth/me', { method: 'POST', headers: { 'Authorization': `Bearer ${authToken}` } }); } catch {}
    }
    setAuthUser(null);
    setAuthToken(null);
    localStorage.removeItem('fy_token');
    localStorage.removeItem('fy_user');
    setSignals([]);
  };

  // تسجيل دخول المدير من صفحة الدخول
  const handleAdminLogin = (admin: { id: string; email: string; name: string; isDefaultPassword: boolean }) => {
    if (admin.isDefaultPassword) {
      // يفرض تغيير البيانات
      setAdminUser(admin);
    } else {
      // يدخل مباشرة لوحة التحكم
      setAdminUser(admin);
      setIsAdmin(true);
      setCurrentView('admin-dashboard');
      localStorage.setItem('fy_admin', JSON.stringify(admin));
    }
  };

  // بعد تغيير بيانات المدير
  const handleAdminCredentialsChanged = (admin: AdminUser) => {
    setAdminUser({ ...admin, isDefaultPassword: false });
    setIsAdmin(true);
    setCurrentView('admin-dashboard');
    localStorage.setItem('fy_admin', JSON.stringify({ ...admin, isDefaultPassword: false }));
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    setIsAdmin(false);
    setCurrentView('user');
    localStorage.removeItem('fy_admin');
  };

  // شاشة تحميل
  if (isAuthLoading || isSeeding) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#0a0e17' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-trading-border border-t-trading-gold" />
          <p className="text-sm text-trading-text-secondary">جاري تحميل المنصة...</p>
        </div>
      </div>
    );
  }

  // ═══ صفحة تغيير بيانات المدير الإجبارية ═══
  if (adminUser && adminUser.isDefaultPassword) {
    return (
      <ForceChangeCredentials
        admin={adminUser}
        onChanged={handleAdminCredentialsChanged}
        onLogout={handleAdminLogout}
      />
    );
  }

  // ═══ صفحة تسجيل الدخول ═══
  if (!authUser && !isAdmin) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} onAdminLogin={handleAdminLogin} />;
  }

  // ═══ التطبيق الرئيسي ═══
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0e17' }}>
      <Navigation
        currentView={currentView}
        onViewChange={setCurrentView}
        isAdmin={isAdmin}
        onLogout={handleAdminLogout}
        authUser={authUser}
        onUserLogout={handleUserLogout}
      />

      <main className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6">
        {currentView === 'user' && authUser && (
          <div className="space-y-6">
            {/* البانر الترحيبي - يظهر دائماً */}
            <div className="relative overflow-hidden rounded-2xl border border-trading-gold/20 bg-gradient-to-l from-trading-gold/10 via-trading-card to-trading-card p-5 sm:p-6">
              <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-trading-gold/5 blur-3xl" />
              <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-trading-gold/5 blur-3xl" />
              <div className="relative">
                <div className="mb-2 flex items-center gap-2">
                  {authUser.isApproved ? (
                    <span className="rounded-lg bg-trading-buy/20 px-2.5 py-1 text-xs font-bold text-trading-buy">✅ معتمد</span>
                  ) : (
                    <span className="rounded-lg bg-yellow-500/20 px-2.5 py-1 text-xs font-bold text-yellow-400">⏳ بانتظار الموافقة</span>
                  )}
                  <span className="text-xs text-trading-text-secondary">
                    {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <h2 className="mb-1 text-xl font-bold text-trading-text sm:text-2xl">مرحباً {authUser.name} 👋</h2>
                <p className="text-sm text-trading-text-secondary">تابع أحدث إشارات التداول من خبرائنا المحترفين</p>
              </div>
            </div>

            {/* الإحصائيات - تظهر دائماً */}
            <StatsBar stats={stats} isLoading={isLoadingStats} />

            {/* الإشارات - فقط للمستخدمين المعتمدين */}
            {authUser.isApproved ? (
              <SignalList signals={signals} isLoading={isLoadingSignals} onRefresh={() => { fetchSignals(); fetchStats(); }} />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-trading-border bg-trading-card py-16">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-500/30">
                  <svg className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="mb-2 text-lg font-bold text-trading-text">⏳ بانتظار موافقة الإدارة</h3>
                <p className="mb-4 max-w-xs text-center text-sm text-trading-text-secondary">
                  تم إنشاء حسابك بنجاح! بانتظار مراجعة الإدارة والموافقة على حسابك لعرض الإشارات
                </p>
                <p className="text-xs text-trading-text-secondary">يمكنك متابعة الإحصائيات العامة أثناء الانتظار</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'admin-dashboard' && adminUser && (
          <AdminDashboard
            admin={adminUser}
            onPasswordChanged={(a) => setAdminUser(a)}
            onLogout={handleAdminLogout}
          />
        )}
      </main>

      <footer className="mt-auto border-t border-trading-border py-4 text-center">
        <p className="text-xs text-trading-text-secondary">© {new Date().getFullYear()} ForexYemeni Pro - جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}
