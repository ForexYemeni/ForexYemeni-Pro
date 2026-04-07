'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { TrendingUp, Mail, User, ArrowLeft, ShieldCheck } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (user: { id: string; email: string; name: string; role: string; token: string }) => void;
}

type AuthMode = 'choice' | 'login' | 'register' | 'otp';
type Step = 'email' | 'otp';

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('choice');
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [devOTP, setDevOTP] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // مؤقت العد التنازلي
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // التركيز على أول خانة OTP
  useEffect(() => {
    if (step === 'otp' && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  const handleSendOTP = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: mode === 'register' ? name : undefined,
          mode: mode === 'register' ? 'register' : 'login',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ');
        return;
      }

      setSuccess(data.message);
      if (data.devOTP) {
        setDevOTP(data.devOTP);
      }
      setStep('otp');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, [email, name, mode]);

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

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // التركيز على الخانة التالية
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // التحقق التلقائي عند إكمال 6 أرقام
    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      setTimeout(() => {
        handleVerifyOTP();
      }, 300);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      // التحقق التلقائي
      setTimeout(() => {
        const verify = async () => {
          setLoading(true);
          setError('');
          try {
            const res = await fetch('/api/auth/verify-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, otp: pasted }),
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

  const handleBack = () => {
    if (step === 'otp') {
      setStep('email');
      setError('');
      setSuccess('');
    } else {
      setMode('choice');
      setStep('email');
      setError('');
      setSuccess('');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
          {/* ═══ شريط الرجوع ═══ */}
          {mode !== 'choice' && (
            <button
              onClick={handleBack}
              className="mb-4 flex items-center gap-1.5 text-xs text-trading-text-secondary transition-colors hover:text-trading-text"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              رجوع
            </button>
          )}

          {/* ═══ اختيار: تسجيل دخول أو حساب جديد ═══ */}
          {mode === 'choice' && (
            <div className="space-y-4">
              <h2 className="text-center text-lg font-bold text-trading-text">مرحباً بك</h2>
              <p className="text-center text-sm text-trading-text-secondary">
                سجّل دخولك لمتابعة الإشارات
              </p>

              <button
                onClick={() => setMode('login')}
                className="w-full rounded-xl bg-gradient-to-l from-trading-gold to-amber-600 px-4 py-3.5 text-sm font-bold text-black transition-all hover:shadow-lg hover:shadow-trading-gold/20"
              >
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
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

          {/* ═══ خطوة البريد الإلكتروني ═══ */}
          {step === 'email' && mode !== 'choice' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-trading-text">
                {mode === 'register' ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
              </h2>

              {/* حقل الاسم (للتسجيل فقط) */}
              {mode === 'register' && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-trading-text-secondary">
                    الاسم الكامل
                  </label>
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
              )}

              {/* حقل البريد */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-trading-text-secondary">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-trading-text-secondary" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full rounded-xl border border-trading-border bg-trading-bg py-3 pr-10 pl-4 text-sm text-trading-text placeholder:text-trading-text-secondary/50 focus:border-trading-gold focus:outline-none focus:ring-1 focus:ring-trading-gold/30"
                    dir="ltr"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  />
                </div>
              </div>

              {/* زر الإرسال */}
              <button
                onClick={handleSendOTP}
                disabled={loading || !email.includes('@') || (mode === 'register' && name.trim().length < 2)}
                className="w-full rounded-xl bg-gradient-to-l from-trading-gold to-amber-600 py-3 text-sm font-bold text-black transition-all hover:shadow-lg hover:shadow-trading-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    جاري الإرسال...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    إرسال رمز التحقق
                  </div>
                )}
              </button>
            </div>
          )}

          {/* ═══ خطوة OTP ═══ */}
          {step === 'otp' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-trading-text">رمز التحقق</h2>
              <p className="text-sm text-trading-text-secondary">
                أدخل الرمز المكون من 6 أرقام المرسل إلى
              </p>
              <p className="text-sm font-medium text-trading-gold" dir="ltr">{email}</p>

              {/* OTP Inputs */}
              <div className="flex justify-center gap-2.5" onPaste={handlePaste} dir="ltr">
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

              {/* عرض OTP للتجربة */}
              {devOTP && (
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-center">
                  <p className="text-[10px] text-blue-400">رمز التحقق (للتجربة):</p>
                  <p className="text-lg font-bold text-blue-400 tracking-[0.3em]">{devOTP}</p>
                </div>
              )}

              {/* زر التحقق */}
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
                  'تأكيد'
                )}
              </button>

              {/* إعادة الإرسال */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-xs text-trading-text-secondary">
                    إعادة الإرسال بعد <span className="font-bold text-trading-gold">{formatTime(countdown)}</span>
                  </p>
                ) : (
                  <button
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="text-xs font-medium text-trading-gold hover:underline disabled:opacity-50"
                  >
                    إعادة إرسال رمز التحقق
                  </button>
                )}
              </div>
            </div>
          )}

          {/* رسائل الخطأ والنجاح */}
          {error && (
            <div className="mt-4 rounded-lg border border-trading-sell/20 bg-trading-sell/5 p-3 text-center text-xs text-trading-sell">
              {error}
            </div>
          )}
          {success && step === 'email' && (
            <div className="mt-4 rounded-lg border border-trading-buy/20 bg-trading-buy/5 p-3 text-center text-xs text-trading-buy">
              {success}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[10px] text-trading-text-secondary">
          ForexYemeni Pro &copy; {new Date().getFullYear()} - جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
