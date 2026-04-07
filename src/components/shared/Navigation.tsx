'use client';

import { TrendingUp, Shield, BarChart3, Settings, ArrowRightLeft } from 'lucide-react';
import type { AppView } from '@/lib/types';

interface NavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  isAdmin: boolean;
  onLogout: () => void;
}

export default function Navigation({ currentView, onViewChange, isAdmin, onLogout }: NavigationProps) {
  return (
    <>
      {/* Header */}
      <header className="glass-effect sticky top-0 z-50 border-b border-trading-border">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onViewChange('user')}
              className="flex items-center gap-2"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-trading-gold to-yellow-600">
                <TrendingUp className="h-5 w-5 text-trading-bg" />
              </div>
              <div>
                <h1 className="text-base font-bold gradient-gold sm:text-lg">ForexYemeni Pro</h1>
                <p className="text-[10px] text-trading-text-secondary sm:text-xs">إشارات التداول الاحترافية</p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              {currentView === 'admin-dashboard' && (
                <button
                  onClick={onLogout}
                  className="rounded-lg border border-trading-border px-3 py-1.5 text-xs text-trading-text-secondary transition-colors hover:bg-trading-card-alt"
                >
                  تسجيل خروج
                </button>
              )}
              {!isAdmin && currentView === 'user' && (
                <button
                  onClick={() => onViewChange('admin-login')}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-trading-border transition-colors hover:bg-trading-card-alt"
                >
                  <Settings className="h-4 w-4 text-trading-text-secondary" />
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => onViewChange(currentView === 'admin-dashboard' ? 'user' : 'admin-dashboard')}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-trading-border px-3 py-1.5 text-xs text-trading-text-secondary transition-colors hover:bg-trading-card-alt"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {currentView === 'admin-dashboard' ? 'لوحة المستخدم' : 'لوحة التحكم'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation (Mobile) */}
      {currentView === 'user' && (
        <nav className="glass-effect fixed bottom-0 left-0 right-0 z-50 border-t border-trading-border sm:hidden">
          <div className="flex items-center justify-around py-2" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}>
            <button className="flex flex-col items-center gap-0.5 px-4 py-1">
              <TrendingUp className="h-5 w-5 text-trading-gold" />
              <span className="text-[10px] text-trading-gold">الإشارات</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 px-4 py-1">
              <BarChart3 className="h-5 w-5 text-trading-text-secondary" />
              <span className="text-[10px] text-trading-text-secondary">الإحصائيات</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 px-4 py-1">
              <Shield className="h-5 w-5 text-trading-text-secondary" />
              <span className="text-[10px] text-trading-text-secondary">الترخيص</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
}
