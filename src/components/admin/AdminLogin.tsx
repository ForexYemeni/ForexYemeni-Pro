'use client';

import { useState } from 'react';
import { Lock, User, Eye, EyeOff, LogIn } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (admin: { id: string; username: string; name: string }) => void;
  onBack: () => void;
}

export default function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        onLogin(data.admin);
      } else {
        setError(data.error || 'حدث خطأ');
      }
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-trading-gold to-yellow-600">
            <Lock className="h-8 w-8 text-trading-bg" />
          </div>
          <h2 className="text-2xl font-bold gradient-gold">لوحة التحكم</h2>
          <p className="mt-2 text-sm text-trading-text-secondary">
            تسجيل دخول المدير
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-trading-border bg-trading-card p-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-trading-text-secondary">
                اسم المستخدم
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-trading-text-secondary" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full rounded-lg border border-trading-border bg-trading-bg py-2.5 pr-10 pl-3 text-sm text-trading-text placeholder:text-trading-text-secondary/50 focus:border-trading-gold focus:outline-none focus:ring-1 focus:ring-trading-gold"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-trading-text-secondary">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-trading-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-trading-border bg-trading-bg py-2.5 pr-10 pl-10 text-sm text-trading-text placeholder:text-trading-text-secondary/50 focus:border-trading-gold focus:outline-none focus:ring-1 focus:ring-trading-gold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-trading-text-secondary hover:text-trading-text"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-trading-sell/10 border border-trading-sell/20 p-3 text-center text-sm text-trading-sell">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-l from-trading-gold to-yellow-600 py-2.5 text-sm font-bold text-trading-bg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-trading-bg border-t-transparent" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </div>
        </form>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="mt-4 w-full rounded-lg border border-trading-border py-2.5 text-sm text-trading-text-secondary transition-colors hover:bg-trading-card"
        >
          العودة للإشارات
        </button>
      </div>
    </div>
  );
}
