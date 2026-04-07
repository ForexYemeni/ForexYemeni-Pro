'use client';

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/shared/Navigation';
import StatsBar from '@/components/user/StatsBar';
import SignalList from '@/components/user/SignalList';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminDashboard from '@/components/admin/AdminDashboard';
import type { AppView, AdminUser, Signal, Stats } from '@/lib/types';

export default function HomePage() {
  const [currentView, setCurrentView] = useState<AppView>('user');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTrades: 0,
    closedTrades: 0,
    winTrades: 0,
    lossTrades: 0,
    winRate: 0,
    activeSignals: 0,
  });
  const [isLoadingSignals, setIsLoadingSignals] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isSeeding, setIsSeeding] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connecting' | 'ready' | 'no_database'>('connecting');

  // إعداد قاعدة البيانات والبيانات الأولية
  useEffect(() => {
    const setup = async () => {
      try {
        const res = await fetch('/api');
        const data = await res.json();

        if (data.status === 'no_database') {
          setDbStatus('no_database');
          setIsSeeding(false);
          return;
        }

        if (data.status === 'error') {
          // جرب seed مباشرة - ربما الجداول موجودة
          try {
            await fetch('/api/seed', { method: 'POST' });
            setDbStatus('ready');
          } catch {
            setDbStatus('no_database');
          }
          setIsSeeding(false);
          return;
        }

        setDbStatus('ready');
        // تهيئة بيانات أولية
        await fetch('/api/seed', { method: 'POST' });
      } catch {
        setDbStatus('no_database');
      } finally {
        setIsSeeding(false);
      }
    };
    setup();
  }, []);

  const fetchSignals = useCallback(async () => {
    if (dbStatus !== 'ready') return;
    setIsLoadingSignals(true);
    try {
      const res = await fetch('/api/signals');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSignals(data);
      }
    } catch {
      console.error('Failed to fetch signals');
    } finally {
      setIsLoadingSignals(false);
    }
  }, [dbStatus]);

  const fetchStats = useCallback(async () => {
    if (dbStatus !== 'ready') return;
    setIsLoadingStats(true);
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch {
      console.error('Failed to fetch stats');
    } finally {
      setIsLoadingStats(false);
    }
  }, [dbStatus]);

  useEffect(() => {
    if (!isSeeding && dbStatus === 'ready') {
      fetchSignals();
      fetchStats();
    }
  }, [isSeeding, dbStatus, fetchSignals, fetchStats]);

  // تحديث تلقائي كل 30 ثانية
  useEffect(() => {
    if (currentView === 'user' && !isSeeding && dbStatus === 'ready') {
      const interval = setInterval(() => {
        fetchSignals();
        fetchStats();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [currentView, isSeeding, dbStatus, fetchSignals, fetchStats]);

  const handleLogin = (admin: AdminUser) => {
    setAdminUser(admin);
    setIsAdmin(true);
    setCurrentView('admin-dashboard');
  };

  const handleLogout = () => {
    setAdminUser(null);
    setIsAdmin(false);
    setCurrentView('user');
  };

  // شاشة تحميل
  if (isSeeding) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#0a0e17' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-trading-border border-t-trading-gold" />
          <p className="text-sm text-trading-text-secondary">جاري تحميل المنصة...</p>
        </div>
      </div>
    );
  }

  // شاشة إعداد قاعدة البيانات
  if (dbStatus === 'no_database') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: '#0a0e17' }}>
        <div className="max-w-md w-full rounded-2xl border border-trading-gold/20 bg-trading-card p-6 sm:p-8 text-center space-y-4">
          <div className="text-4xl">⚙️</div>
          <h1 className="text-xl font-bold text-trading-text">إعداد قاعدة البيانات</h1>
          <p className="text-sm text-trading-text-secondary leading-relaxed">
            التطبيق يحتاج قاعدة بيانات Neon المجانية للعمل.
            <br />
            اتبع الخطوات التالية:
          </p>
          <div className="text-right space-y-3 bg-trading-bg/50 rounded-xl p-4">
            <p className="text-sm text-trading-text font-bold">الخطوات:</p>
            <ol className="text-sm text-trading-text-secondary space-y-2 list-decimal list-inside">
              <li>اذهب إلى <span className="text-trading-gold font-bold">Vercel Dashboard</span></li>
              <li>افتح مشروع <span className="text-trading-gold font-bold">ForexYemeni-Pro</span></li>
              <li>اضغط على تبويب <span className="text-trading-gold font-bold">Storage</span></li>
              <li>اضغط <span className="text-trading-gold font-bold">Create Database</span></li>
              <li>اختر <span className="text-trading-gold font-bold">Neon (Postgres)</span></li>
              <li>اترك الإعدادات الافتراضية واضغط <span className="text-trading-gold font-bold">Create</span></li>
              <li>انتظر حتى ينتهي الإنشاء ثم اضغط <span className="text-trading-gold font-bold">Redeploy</span></li>
            </ol>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-xl bg-trading-gold px-4 py-3 text-sm font-bold text-black hover:bg-trading-gold/90 transition-colors"
          >
            تحديث الصفحة
          </button>
          <p className="text-xs text-trading-text-secondary">
            📌 Neon مجاني تماماً - 0.5 GB تخزين
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0e17' }}>
      <Navigation
        currentView={currentView}
        onViewChange={setCurrentView}
        isAdmin={isAdmin}
        onLogout={handleLogout}
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
                  مرحباً بك في <span className="gradient-gold">ForexYemeni Pro</span>
                </h2>
                <p className="text-sm text-trading-text-secondary">
                  تابع أحدث إشارات التداول من خبرائنا المحترفين
                </p>
              </div>
            </div>

            {/* Stats Bar */}
            <StatsBar stats={stats} isLoading={isLoadingStats} />

            {/* Signal List */}
            <SignalList
              signals={signals}
              isLoading={isLoadingSignals}
              onRefresh={() => {
                fetchSignals();
                fetchStats();
              }}
            />
          </div>
        )}

        {currentView === 'admin-login' && (
          <AdminLogin
            onLogin={handleLogin}
            onBack={() => setCurrentView('user')}
          />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboard onLogout={handleLogout} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-trading-border py-4 text-center">
        <p className="text-xs text-trading-text-secondary">
          © {new Date().getFullYear()} ForexYemeni Pro - جميع الحقوق محفوظة
        </p>
      </footer>
    </div>
  );
}
