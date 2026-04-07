'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { TrendingUp, Mail, User, ArrowLeft, ShieldCheck, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (user: { id: string; email: string; name: string; role: string; token: string }) => void;
  onAdminLogin: (admin: { id: string; email: string; name: string; isDefaultPassword: boolean }) => void;
}

type AuthMode = 'choice' | 'login' | 'register';

export default function AuthPage({ onAuthSuccess, onAdminLogin }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('choice');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [devOTP, setDevOTP] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setError('');
    setSuccess('');
    setPassword('');
    setName('');
    setEmail('');
    setShowPassword(false);
    setDevOTP('');
  }, [mode]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (step === 'otp' && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  // ══════════════════════════════════════════════════════
  // تسجيل الدخول (يدعم المستخدمين والإدارة)
  // ══════════════════════════════════════════════════════
  const handleLogin = useCallback(async () => {
    if (!email.includes('@') || password.length < 1) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'NOT_VERIFIED') {
          setError('هذا الحساب لم يتم التحقق بعد. أدخل رمز التحقق');
          setStep('otp');
          const resendRes = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const resendData = await resendRes.json();
          const otpCode = resendData.devOTP || resendData.otp || '';
          setDevOTP(otpCode);
          if (otpCode) setOtp(otpCode.split(''));
          setCountdown(60);
        } else {
          setError(data.error || 'حدث خطأ');
        }
        return;
      }

      // إذا كان مدير → إما يفرض تغيير أو يدخل لوحة التحكم
      if (data.role === 'admin') {
        onAdminLogin(data.admin);
        return;
      }

      // مستخدم عادي
      onAuthSuccess({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        token: data.token,
      });
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, [email, password, onAuthSuccess, onAdminLogin]);

  // ══════════════════════════════════════════════════════
  // إنشاء حساب جديد
  // ══════════════════════════════════════════════════════
  const handleSignup = useCallback(async () => {
    if (!email.includes('@') || password.length < 6 || name.trim().length < 2) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ');
        return;
      }

      const otpCode = data.devOTP || data.otp || '';
      setDevOTP(otpCode);
      setSuccess('تم إنشاء الحساب بنجاح');
      setStep('otp');
      setCountdown(60);
      if (otpCode) {
        setOtp(otpCode.split(''));
      } else {
        setOtp(['', '', '', '', '', '']);
      }
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, [email, password, name]);

  // ══════════════════════════════════════════════════════
  // التحقق من OTP
  // ══════════════════════════════════════════════════════
  const handleVerifyOTP = useCallback(async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('أدخل رمز التحقق كاملاً');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'رمز التحقق غير صحيح');
        return;
      }

      onAuthSuccess({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        token: data.token,
      });
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, [email, otp, onAuthSuccess]);

  const handleResendOTP = useCallback(async () => {
    if (countdown > 0 || loading) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ');
        return;
      }

      const newOtp = data.devOTP || data.otp || '';
      setDevOTP(newOtp);
      setCountdown(60);
      if (newOtp) {
        setOtp(newOtp.split(''));
      } else {
        setOtp(['', '', '', '', '', '']);
      }
      setSuccess('تم إعادة إرسال رمز التحقق');
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, [email, countdown, loading]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      setTimeout(() => {
        const verify = async () => {
          setLoading(true);
          setError('');
          try {
            const res = await fetch('/api/auth/verify-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, otp: newOtp.join('') }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error); return; }
            onAuthSuccess({ id: data.user.id, email: data.user.email, name: data.user.name, role: data.user.role, token: data.token });
          } catch { setError('خطأ في الاتصال'); }
          finally { setLoading(false); }
        };
        verify();
      }, 300);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('form');
      setError('');
      setSuccess('');
    } else {
      setMode('choice');
      setStep('form');
      setError('');
      setSuccess('');
      setPassword('');
      setName('');
      setEmail('');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isLoginDisabled = loading || !email.includes('@') || password.length < 1;
  const isSignupDisabled = loading || !email.includes('@') || password.length < 6 || name.trim().length < 2;

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: '#0a0e17' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-trading-gold to-yellow-600 shadow-lg shadow-trading-gold/20">
            <TrendingUp className="h-8 w-8 text-trading-bg" />
          </div>
          <h1 className="text-2xl font-bold gradient-gold">ForexYemeni Pro</h1>
          <p className="mt-1 text-sm text-trading-text-secondary">منصة إشارات التداول الاحترافية</p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-trading-border bg-trading-card p-6">
          {mode !== 'choice' && (
            <button
              onClick={handleBack}
              className="mb-4 flex items-center gap-1.5 text-xs text-trading-text-secondary transition-colors hover:text-trading-text"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              رجوع
            </button>
          )}

          {/* ═══ اختيار ═══ */}
          {mode === 'choice' && (
            <div className="space-y-4">
              <h2 className="text-center text-lg font-bold text-trading-text">مرحباً بك</h2>
              <p className="text-center text-sm text-trading-text-secondary">سجّل دخولك لمتابعة الإشارات</p>

              <button
                onClick={() => setMode('login')}
                className="w-full rounded-xl bg-gradient-to-l from-trading-gold to-amber-600 px-4 py-3.5 text-sm font-bold text-black transition-all hover:shadow-lg hover:shadow-trading-gold/20"
              >
                <div className="flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4" />
                  تسجيل الدخول
                </div>
              </button>

              <button
                onClick={() => setMode('register')}
                className="w-full rounded-xl border border-trading-gold/30 bg-trading-gold/5 px-4 py-3.5 text-sm font-bold text-trading-gold transition-all hover:bg-trading-gold/10"
              >
                <div className="flex items-center justify-center gap-2">
                  <User className="h-4 w-4" />
                  إنشاء حساب جديد
                </div>
              </button>

              <div className="flex items-center gap-3 pt-2">
                <div className="h-px flex-1 bg-trading-border" />
                <span className="text-[10px] text-trading-text-secondary">مجاني للأبد</span>
                <div className="h-px flex-1 bg-trading-border" />
              </div>
            </div>
          )}

          {/* ═══ تسجيل دخول ═══ */}
          {mode === 'login' && step === 'form' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-trading-text">تسجيل الدخول</h2>
              <p className="text-xs text-trading-text-secondary">المستخدمون والإدارة يدخلون من هنا</p>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-trading-text-secondary">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-trading-text-secondary" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full rounded-xl border border-trading-border bg-trading-bg py-3 pr-10 pl-4 text-sm text-trading-text placeholder:text-trading-text-secondary/50 focus:border-trading-gold focus:outline-none focus:ring-1 focus:ring-trading-gold/30"
                    dir="ltr"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-trading-text-secondary">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-trading-text-secondary" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-trading-border bg-trading-bg py-3 pr-10 pl-10 text-sm text-trading-text placeholder:text-trading-text-secondary/50 focus:border-trading-gold focus:outline-none focus:ring-1 focus:ring-trading-gold/30"
                    dir="ltr"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-trading-text-secondary hover:text-trading-text"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoginDisabled}
                className="w-full rounded-xl bg-gradient-to-l from-trading-gold to-amber-600 py-3 text-sm font-bold text-black transition-all hover:shadow-lg hover:shadow-trading-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    جاري التحقق...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Lock className="h-4 w-4" />
                    تسجيل الدخول
                  </div>
                )}
              </button>
            </div>
          )}

          {/* ═══ إنشاء حساب ═══ */}
          {mode === 'register' && step === 'form' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-trading-text">إنشاء حساب جديد</h2>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-trading-text-secondary">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-trading-text-secondary" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="أدخل اسمك"
                    className="w-full rounded-xl border border-trading-border bg-trading-bg py-3 pr-10 pl-4 text-sm text-trading-text placeholder:text-trading-text-secondary/50 focus:border-trading-gold focus:outline-none focus:ring-1 focus:ring-trading-gold/30"
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-trading-text-secondary">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-trading-text-secondary" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full rounded-xl border border-trading-border bg-trading-bg py-3 pr-10 pl-4 text-sm text-trading-text placeholder:text-trading-text-secondary/50 focus:border-trading-gold focus:outline-none focus:ring-1 focus:ring-trading-gold/30"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-trading-text-secondary">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-trading-text-secondary" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6 أحرف على الأقل"
                    className="w-full rounded-xl border border-trading-border bg-trading-bg py-3 pr-10 pl-10 text-sm text-trading-text placeholder:text-trading-text-secondary/50 focus:border-trading-gold focus:outline-none focus:ring-1 focus:ring-trading-gold/30"
                    dir="ltr"
                    onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-trading-text-secondary hover:text-trading-text"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && password.length < 6 && (
                  <p className="mt-1 text-[10px] text-trading-sell">كلمة المرور يجب أن تكون 6 أحرف على الأقل</p>
                )}
              </div>

              <button
                onClick={handleSignup}
                disabled={isSignupDisabled}
                className="w-full rounded-xl bg-gradient-to-l from-trading-gold to-amber-600 py-3 text-sm font-bold text-black transition-all hover:shadow-lg hover:shadow-trading-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    جاري إنشاء الحساب...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    إنشاء حساب
                  </div>
                )}
              </button>
            </div>
          )}

          {/* ═══ OTP ═══ */}
          {step === 'otp' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-trading-text">رمز التحقق</h2>
              <p className="text-sm text-trading-text-secondary">أدخل الرمز المكون من 6 أرقام المرسل إلى</p>
              <p className="text-sm font-medium text-trading-gold" dir="ltr">{email}</p>

              <div className="flex justify-center gap-2.5" dir="ltr">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="h-13 w-11 rounded-xl border border-trading-border bg-trading-bg text-center text-lg font-bold text-trading-text focus:border-trading-gold focus:outline-none focus:ring-2 focus:ring-trading-gold/30 sm:h-14 sm:w-13"
                  />
                ))}
              </div>

              {devOTP && (
                <div className="rounded-xl border-2 border-trading-gold/40 bg-trading-gold/10 p-4 text-center">
                  <p className="mb-1 text-xs font-bold text-trading-gold">🔑 رمز التحقق الخاص بك:</p>
                  <p className="text-2xl font-black text-trading-gold tracking-[0.4em]" dir="ltr">{devOTP}</p>
                  <p className="mt-1 text-[10px] text-trading-text-secondary">أدخل هذا الرمز في الخانات أدناه</p>
                </div>
              )}

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length !== 6}
                className="w-full rounded-xl bg-gradient-to-l from-trading-gold to-amber-600 py-3 text-sm font-bold text-black transition-all hover:shadow-lg hover:shadow-trading-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    جاري التحقق...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    تأكيد
                  </div>
                )}
              </button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-xs text-trading-text-secondary">
                    إعادة الإرسال بعد <span className="font-bold text-trading-gold">{formatTime(countdown)}</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-xs font-medium text-trading-gold hover:underline disabled:opacity-50"
                  >
                    إعادة إرسال رمز التحقق
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-trading-sell/20 bg-trading-sell/5 p-3 text-center text-xs text-trading-sell">
              {error}
            </div>
          )}
          {success && step === 'form' && (
            <div className="mt-4 rounded-lg border border-trading-buy/20 bg-trading-buy/5 p-3 text-center text-xs text-trading-buy">
              {success}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[10px] text-trading-text-secondary">
          ForexYemeni Pro &copy; {new Date().getFullYear()} - جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
