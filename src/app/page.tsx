'use client';

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/shared/Navigation';
import StatsBar from '@/components/user/StatsBar';
import SignalList from '@/components/user/SignalList';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AuthPage from '@/components/auth/AuthPage';
import type { AppView, AdminUser, Signal, Stats } from '@/lib/types';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
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
    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setAuthUser(user);
        setAuthToken(savedToken);
        // التحقق من صحة الجلسة
        fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${savedToken}` },
        }).then(res => {
          if (!res.ok) {
            localStorage.removeItem('fy_token');
            localStorage.removeItem('fy_user');
            setAuthUser(null);
            setAuthToken(null);
          }
        }).catch(() => {});
      } catch {
        localStorage.removeItem('fy_token');
        localStorage.removeItem('fy_user');
      }
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

  // تحديث تلقائي كل 30 ثانية
  useEffect(() => {
    if (currentView === 'user' && !isSeeding && authUser) {
      const interval = setInterval(() => { fetchSignals(); fetchStats(); }, 30000);
      return () => clearInterval(interval);
    }
  }, [currentView, isSeeding, authUser, fetchSignals, fetchStats]);

  const handleAuthSuccess = (user: { id: string; email: string; name: string; role: string; token: string }) => {
    setAuthUser({ id: user.id, email: user.email, name: user.name, role: user.role });
    setAuthToken(user.token);
    localStorage.setItem('fy_token', user.token);
    localStorage.setItem('fy_user', JSON.stringify({ id: user.id, email: user.email, name: user.name, role: user.role }));
  };

  const handleUserLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/me', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
      } catch {}
    }
    setAuthUser(null);
    setAuthToken(null);
    localStorage.removeItem('fy_token');
    localStorage.removeItem('fy_user');
    setSignals([]);
  };

  const handleAdminLogin = (admin: AdminUser) => {
    setAdminUser(admin);
    setIsAdmin(true);
    setCurrentView('admin-dashboard');
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    setIsAdmin(false);
    setCurrentView('user');
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

  // صفحة تسجيل الدخول
  if (!authUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // التطبيق الرئيسي
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
        {currentView === 'user' && (
          <div className="space-y-6">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-trading-gold/20 bg-gradient-to-l from-trading-gold/10 via-trading-card to-trading-card p-5 sm:p-6">
              <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-trading-gold/5 blur-3xl" />
              <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-trading-gold/5 blur-3xl" />
              <div className="relative">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-lg bg-trading-gold/20 px-2.5 py-1 text-xs font-bold text-trading-gold">
                    🔥 حية
                  </span>
                  <span className="text-xs text-trading-text-secondary">
                    {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <h2 className="mb-1 text-xl font-bold text-trading-text sm:text-2xl">
                  مرحباً {authUser.name} 👋
                </h2>
                <p className="text-sm text-trading-text-secondary">
                  تابع أحدث إشارات التداول من خبرائنا المحترفين
                </p>
              </div>
            </div>

            <StatsBar stats={stats} isLoading={isLoadingStats} />
            <SignalList
              signals={signals}
              isLoading={isLoadingSignals}
              onRefresh={() => { fetchSignals(); fetchStats(); }}
            />
          </div>
        )}

        {currentView === 'admin-login' && (
          <AdminLogin onLogin={handleAdminLogin} onBack={() => setCurrentView('user')} />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboard onLogout={handleAdminLogout} />
        )}
      </main>

      <footer className="mt-auto border-t border-trading-border py-4 text-center">
        <p className="text-xs text-trading-text-secondary">
          © {new Date().getFullYear()} ForexYemeni Pro - جميع الحقوق محفوظة
        </p>
      </footer>
    </div>
  );
}
