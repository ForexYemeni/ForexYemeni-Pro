'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Shield, BarChart3, Bell, Star, Target, Clock, ChevronDown, ChevronUp,
  Home, Signal, Settings, User, LogOut, Plus, Trash2, Check, X, Eye, EyeOff,
  Send, AlertCircle, RefreshCw, Search, Users, Zap, Award, ArrowLeft,
  DollarSign, Percent, Activity, Flame, Gem, Crown, ChevronLeft, Menu, LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator
} from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';

// ==================== Types ====================
interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  plan: string;
  trialEndsAt?: string;
  lotSize?: number;
  accBalance: number;
  riskPct: number;
  createdAt: string;
}

interface SignalInfo {
  id: string;
  type: string;
  pair: string;
  entry: number;
  stopLoss: number;
  stopLossType: string;
  targets: string;
  stars: number;
  lotSize: string;
  riskAmount: number;
  currentTP: number;
  totalTargets: number;
  status: string;
  notes?: string;
  createdAt: string;
  isRead?: boolean;
  createdBy?: { id: string; name: string; email?: string };
}

type ViewType = 'landing' | 'login' | 'register' | 'otp' | 'pending' | 'user-dashboard' | 'admin-dashboard';
type UserTab = 'home' | 'signals' | 'settings' | 'profile';
type AdminTab = 'home' | 'signals' | 'users' | 'settings';

// ==================== API Helper ====================
const API = {
  get: async (url: string, token?: string) => {
    const headers: Record<string, string> = {};
    if (token) headers['authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { headers });
    return res.json();
  },
  post: async (url: string, body: unknown, token?: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    return res.json();
  },
  put: async (url: string, body: unknown, token?: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
    return res.json();
  },
  del: async (url: string, token?: string) => {
    const headers: Record<string, string> = {};
    if (token) headers['authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'DELETE', headers });
    return res.json();
  },
};

// ==================== Helper Functions ====================
function formatTimeAgo(dateStr: string): string {
  const now = new Date().getTime();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${days} يوم`;
}

function getPasswordStrength(password: string): { level: string; color: string; width: string } {
  if (password.length < 6) return { level: 'ضعيفة', color: '#F85149', width: '33%' };
  if (password.length < 8) return { level: 'متوسطة', color: '#D29922', width: '66%' };
  if (/[0-9]/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { level: 'قوية', color: '#3FB950', width: '100%' };
  }
  return { level: 'متوسطة', color: '#D29922', width: '66%' };
}

function getPlanLabel(plan: string): { text: string; color: string; gradient?: string } {
  switch (plan) {
    case 'TRIAL': return { text: 'تجريبي', color: '#8B949E' };
    case 'BASIC': return { text: 'أساسي', color: '#58A6FF' };
    case 'PRO': return { text: 'احترافي', color: '#BC8CFF' };
    case 'VIP': return { text: 'VIP', color: '#FFB800', gradient: 'linear-gradient(135deg, #FFB800, #FF8C00)' };
    default: return { text: plan, color: '#8B949E' };
  }
}

function getStatusLabel(status: string): { text: string; color: string } {
  switch (status) {
    case 'ACTIVE': return { text: 'نشط', color: '#3FB950' };
    case 'PENDING': return { text: 'معلق', color: '#D29922' };
    case 'SUSPENDED': return { text: 'موقوف', color: '#F85149' };
    default: return { text: status, color: '#8B949E' };
  }
}

function getSignalStatusLabel(status: string): { text: string; color: string } {
  switch (status) {
    case 'ACTIVE': return { text: 'نشطة', color: '#3FB950' };
    case 'HIT_SL': return { text: 'ضرب وقف', color: '#F85149' };
    case 'HIT_TP': return { text: 'ضرب هدف', color: '#3FB950' };
    case 'CANCELLED': return { text: 'ملغاة', color: '#8B949E' };
    default: return { text: status, color: '#8B949E' };
  }
}

// ==================== Design System ====================
const DS = {
  bgPrimary: '#080A10',
  bgCard: '#0D1117',
  bgElevated: '#161B22',
  bgInput: '#1C2128',
  gold: '#FFB800',
  goldLight: 'rgba(255,184,0,0.08)',
  success: '#3FB950',
  danger: '#F85149',
  warning: '#D29922',
  textPrimary: '#F0F6FC',
  textSecondary: '#8B949E',
  textMuted: '#484F58',
  border: 'rgba(255,255,255,0.06)',
  glass: 'rgba(13,17,23,0.8)',
};

// ==================== CSS Keyframes ====================
const KEYFRAMES_CSS = `
@keyframes orbit {
  0% { transform: rotate(0deg) translateX(28px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(28px) rotate(-360deg); }
}
@keyframes orbit2 {
  0% { transform: rotate(120deg) translateX(22px) rotate(-120deg); }
  100% { transform: rotate(480deg) translateX(22px) rotate(-480deg); }
}
@keyframes orbit3 {
  0% { transform: rotate(240deg) translateX(34px) rotate(-240deg); }
  100% { transform: rotate(600deg) translateX(34px) rotate(-600deg); }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes pulse-gold {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,184,0,0.4); }
  50% { box-shadow: 0 0 20px 4px rgba(255,184,0,0.15); }
}
@keyframes float1 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(30px, -20px) rotate(120deg); }
  66% { transform: translate(-20px, 15px) rotate(240deg); }
}
@keyframes float2 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(-25px, 20px) rotate(-120deg); }
  66% { transform: translate(15px, -25px) rotate(-240deg); }
}
@keyframes meshGradient {
  0% { background-position: 0% 0%; }
  25% { background-position: 100% 0%; }
  50% { background-position: 100% 100%; }
  75% { background-position: 0% 100%; }
  100% { background-position: 0% 0%; }
}
@keyframes progressBar {
  0% { width: 0%; }
  100% { width: 100%; }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes borderGlow {
  0%, 100% { border-color: rgba(255,184,0,0.2); }
  50% { border-color: rgba(255,184,0,0.5); }
}
@keyframes typewriter {
  from { width: 0; }
  to { width: 100%; }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes noiseMove {
  0% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -5%); }
  20% { transform: translate(-10%, 5%); }
  30% { transform: translate(5%, -10%); }
  40% { transform: translate(-5%, 15%); }
  50% { transform: translate(-10%, 5%); }
  60% { transform: translate(15%, 0); }
  70% { transform: translate(0, 10%); }
  80% { transform: translate(-15%, 0); }
  90% { transform: translate(10%, 5%); }
  100% { transform: translate(5%, 0); }
}
@keyframes livePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.5); }
}
`;

// ==================== Animated Counter ====================
function AnimatedCounter({ value, duration = 2000 }: { value: string; duration?: number }) {
  const numericMatch = value.match(/[\d.]+/);
  const suffix = value.replace(/[\d.]+/, '');
  const [display, setDisplay] = useState('0');
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!numericMatch) return;
    const target = parseFloat(numericMatch[0]);
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased).toString() + suffix);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  if (!numericMatch) return <span>{value}</span>;
  return <span>{display}</span>;
}

// ==================== Premium Input Component ====================
function PremiumInput({
  label, type = 'text', value, onChange, placeholder, dir, onKeyDown, icon
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; dir?: string; onKeyDown?: (e: React.KeyboardEvent) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs mb-1.5 font-medium" style={{ color: DS.textSecondary }}>{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: DS.textMuted }}>{icon}</div>
        )}
        <Input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          dir={dir as 'ltr' | 'rtl' | undefined}
          className="text-sm h-11 rounded-xl transition-all duration-300 focus:ring-0 focus:outline-none"
          style={{
            backgroundColor: DS.bgInput,
            border: `1px solid ${DS.border}`,
            color: DS.textPrimary,
            paddingRight: icon ? '2.5rem' : undefined,
          }}
        />
      </div>
    </div>
  );
}

// ==================== Main App Component ====================
export default function ForexApp() {
  const { toast } = useToast();
  const [view, setView] = useState<ViewType>('landing');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // User dashboard state
  const [userTab, setUserTab] = useState<UserTab>('home');
  const [signals, setSignals] = useState<SignalInfo[]>([]);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);
  const [signalFilter, setSignalFilter] = useState<'all' | 'buy' | 'sell' | 'done'>('all');

  // Admin dashboard state
  const [adminTab, setAdminTab] = useState<AdminTab>('home');
  const [adminSignals, setAdminSignals] = useState<SignalInfo[]>([]);
  const [adminUsers, setAdminUsers] = useState<UserInfo[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [showCreateSignal, setShowCreateSignal] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');

  // Auth form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Create signal form
  const [newSignal, setNewSignal] = useState({
    type: 'BUY',
    pair: 'XAUUSD',
    entry: '',
    stopLoss: '',
    stopLossType: 'FIXED',
    targets: [''],
    stars: 3,
    lotSize: '0.01',
    riskAmount: '',
    notes: '',
  });

  // User settings
  const [userSettings, setUserSettings] = useState({
    lotSize: '',
    accBalance: '',
    riskPct: '',
  });

  // Refs for animated sections
  const landingRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Check for saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('fx_token');
    if (savedToken) {
      fetchUser(savedToken);
    } else {
      setTimeout(() => setLoading(false), 800);
    }
  }, []);

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const fetchUser = async (t: string) => {
    try {
      const data = await API.get('/api/auth/me', t);
      if (data.user) {
        setToken(t);
        setUser(data.user);
        localStorage.setItem('fx_token', t);
        setUserSettings({
          lotSize: data.user.lotSize?.toString() || '',
          accBalance: data.user.accBalance?.toString() || '100',
          riskPct: data.user.riskPct?.toString() || '5',
        });
        if (data.user.role === 'ADMIN') {
          setView('admin-dashboard');
        } else {
          setView('user-dashboard');
        }
      }
    } catch {
      localStorage.removeItem('fx_token');
    }
    setLoading(false);
  };

  const fetchSignals = useCallback(async () => {
    if (!token) return;
    setSignalsLoading(true);
    try {
      const data = await API.get('/api/signals', token);
      if (data.signals) {
        setSignals(data.signals);
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل تحميل الإشارات' });
    }
    setSignalsLoading(false);
  }, [token, toast]);

  const fetchAdminSignals = useCallback(async () => {
    if (!token) return;
    setAdminLoading(true);
    try {
      const data = await API.get('/api/admin/signals', token);
      if (data.signals) setAdminSignals(data.signals);
    } catch {
      toast({ title: 'خطأ', description: 'فشل تحميل الإشارات' });
    }
    setAdminLoading(false);
  }, [token, toast]);

  const fetchAdminUsers = useCallback(async () => {
    if (!token) return;
    setAdminLoading(true);
    try {
      const params = new URLSearchParams();
      if (userSearch) params.set('search', userSearch);
      if (userStatusFilter) params.set('status', userStatusFilter);
      const data = await API.get(`/api/admin/users?${params.toString()}`, token);
      if (data.users) setAdminUsers(data.users);
    } catch {
      toast({ title: 'خطأ', description: 'فشل تحميل المستخدمين' });
    }
    setAdminLoading(false);
  }, [token, toast, userSearch, userStatusFilter]);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast({ title: 'خطأ', description: 'جميع الحقول مطلوبة' });
      return;
    }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        setToken(data.token);
        localStorage.setItem('fx_token', data.token);
        setUser(data.user);
        setUserSettings({
          lotSize: data.user.lotSize?.toString() || '',
          accBalance: data.user.accBalance?.toString() || '100',
          riskPct: data.user.riskPct?.toString() || '5',
        });
        setView(data.user.role === 'ADMIN' ? 'admin-dashboard' : 'user-dashboard');
        toast({ title: 'نجاح', description: 'تم تسجيل الدخول بنجاح' });
      } else if (data.code === 'PENDING') {
        toast({ title: 'تنبيه', description: 'الحساب بانتظار التفعيل - أدخل كود OTP' });
        setOtpEmail(loginEmail);
        setView('otp');
      } else {
        toast({ title: 'خطأ', description: data.error || 'بيانات الدخول غير صحيحة' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تسجيل الدخول - تحقق من اتصال الإنترنت';
      toast({ title: 'خطأ في تسجيل الدخول', description: msg });
    }
  };

  const handleRegister = async () => {
    if (!regName || !regEmail || !regPassword || !regConfirmPassword) {
      toast({ title: 'خطأ', description: 'جميع الحقول مطلوبة' });
      return;
    }
    if (regPassword !== regConfirmPassword) {
      toast({ title: 'خطأ', description: 'كلمتا المرور غير متطابقتين' });
      return;
    }
    if (regPassword.length < 6) {
      toast({ title: 'خطأ', description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
      return;
    }
    try {
      const data = await API.post('/api/auth/register', { name: regName, email: regEmail, password: regPassword });
      if (data.otp) {
        setOtpEmail(regEmail);
        setOtpValue('');
        setOtpCountdown(60);
        setView('otp');
        toast({ title: 'نجاح', description: `كود التفعيل: ${data.otp}` });
      } else {
        toast({ title: 'خطأ', description: data.error || 'فشل التسجيل' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل التسجيل - تحقق من اتصال الإنترنت';
      toast({ title: 'خطأ في التسجيل', description: msg });
    }
  };

  const handleVerifyOTP = async () => {
    if (otpValue.length !== 6) {
      toast({ title: 'خطأ', description: 'أدخل كود التفعيل المكون من 6 أرقام' });
      return;
    }
    try {
      const data = await API.post('/api/auth/verify-otp', { email: otpEmail, otp: otpValue });
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('fx_token', data.token);
        setUser(data.user);
        setUserSettings({
          lotSize: data.user.lotSize?.toString() || '',
          accBalance: data.user.accBalance?.toString() || '100',
          riskPct: data.user.riskPct?.toString() || '5',
        });
        setView(data.user.role === 'ADMIN' ? 'admin-dashboard' : 'user-dashboard');
        toast({ title: 'نجاح', description: 'تم تفعيل الحساب بنجاح' });
      } else {
        toast({ title: 'خطأ', description: data.error || 'كود التفعيل غير صحيح' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل التحقق - تحقق من اتصال الإنترنت';
      toast({ title: 'خطأ في التحقق', description: msg });
    }
  };

  const handleResendOTP = async () => {
    if (otpCountdown > 0) return;
    try {
      const data = await API.post('/api/auth/resend-otp', { email: otpEmail });
      if (data.otp) {
        setOtpCountdown(60);
        setOtpValue('');
        toast({ title: 'نجاح', description: `كود التفعيل الجديد: ${data.otp}` });
      } else {
        toast({ title: 'خطأ', description: data.error || 'فشل إعادة الإرسال' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل إعادة الإرسال - تحقق من اتصال الإنترنت';
      toast({ title: 'خطأ', description: msg });
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('fx_token');
    setView('landing');
    setUserTab('home');
    setAdminTab('home');
    toast({ title: 'تم تسجيل الخروج' });
  };

  const markSignalRead = async (signalId: string) => {
    if (!token) return;
    try {
      await API.post(`/api/signals/${signalId}/read`, {}, token);
      setSignals(prev => prev.map(s => s.id === signalId ? { ...s, isRead: true } : s));
    } catch { /* silent */ }
  };

  const handleCreateSignal = async () => {
    if (!token) return;
    const validTargets = newSignal.targets.filter(t => t.trim() !== '');
    if (!newSignal.entry || !newSignal.stopLoss || validTargets.length === 0) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول المطلوبة' });
      return;
    }
    try {
      const data = await API.post('/api/admin/signals', {
        ...newSignal,
        targets: validTargets.map(Number),
        entry: Number(newSignal.entry),
        stopLoss: Number(newSignal.stopLoss),
        riskAmount: Number(newSignal.riskAmount) || 0,
        stars: Number(newSignal.stars),
      }, token);
      if (data.signal) {
        setShowCreateSignal(false);
        setNewSignal({ type: 'BUY', pair: 'XAUUSD', entry: '', stopLoss: '', stopLossType: 'FIXED', targets: [''], stars: 3, lotSize: '0.01', riskAmount: '', notes: '' });
        fetchAdminSignals();
        toast({ title: 'نجاح', description: 'تم إنشاء الإشارة بنجاح' });
      } else {
        toast({ title: 'خطأ', description: data.error });
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل إنشاء الإشارة' });
    }
  };

  const handleUpdateSignal = async (signalId: string, update: { status?: string; currentTP?: number }) => {
    if (!token) return;
    try {
      const res = await API.put(`/api/admin/signals/${signalId}`, update, token);
      fetchAdminSignals();
      toast({ title: 'نجاح', description: update.currentTP ? `تم تحقيق الهدف ${update.currentTP}` : 'تم تحديث الإشارة' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'فشل تحديث الإشارة';
      toast({ title: 'خطأ', description: msg, variant: 'destructive' });
    }
  };

  const handleDeleteSignal = async (signalId: string) => {
    if (!token) return;
    try {
      await API.del(`/api/admin/signals/${signalId}`, token);
      fetchAdminSignals();
      toast({ title: 'نجاح', description: 'تم حذف الإشارة' });
    } catch {
      toast({ title: 'خطأ', description: 'فشل حذف الإشارة' });
    }
  };

  const handleApproveUser = async (userId: string) => {
    if (!token) return;
    try {
      await API.put(`/api/admin/users/${userId}/approve`, {}, token);
      fetchAdminUsers();
      toast({ title: 'نجاح', description: 'تم قبول المستخدم' });
    } catch {
      toast({ title: 'خطأ', description: 'فشل قبول المستخدم' });
    }
  };

  const handleSuspendUser = async (userId: string) => {
    if (!token) return;
    try {
      await API.put(`/api/admin/users/${userId}/suspend`, {}, token);
      fetchAdminUsers();
      toast({ title: 'نجاح', description: 'تم تعليق المستخدم' });
    } catch {
      toast({ title: 'خطأ', description: 'فشل تعليق المستخدم' });
    }
  };

  const handleChangePlan = async (userId: string, plan: string) => {
    if (!token) return;
    try {
      await API.put(`/api/admin/users/${userId}/plan`, { plan }, token);
      fetchAdminUsers();
      toast({ title: 'نجاح', description: 'تم تغيير الخطة' });
    } catch {
      toast({ title: 'خطأ', description: 'فشل تغيير الخطة' });
    }
  };

  // Load signals when user tab changes to signals
  useEffect(() => {
    if (view === 'user-dashboard' && userTab === 'signals') {
      fetchSignals();
    }
  }, [view, userTab, fetchSignals]);

  // Load admin data
  useEffect(() => {
    if (view === 'admin-dashboard') {
      if (adminTab === 'signals') fetchAdminSignals();
      if (adminTab === 'users') fetchAdminUsers();
    }
  }, [view, adminTab, fetchAdminSignals, fetchAdminUsers]);

  // Filtered signals for user
  const filteredSignals = useMemo(() => {
    if (signalFilter === 'all') return signals;
    if (signalFilter === 'buy') return signals.filter(s => s.type === 'BUY');
    if (signalFilter === 'sell') return signals.filter(s => s.type === 'SELL');
    if (signalFilter === 'done') return signals.filter(s => s.status !== 'ACTIVE');
    return signals;
  }, [signals, signalFilter]);

  // ==================== Loading Screen ====================
  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: DS.bgPrimary }}>
          {/* Noise overlay */}
          <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '256px 256px',
          }} />
          <div className="relative text-center">
            {/* Orbiting logo */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
                boxShadow: '0 0 40px rgba(255,184,0,0.3)',
              }}>
                <TrendingUp size={40} style={{ color: DS.bgPrimary }} />
              </div>
              {/* Orbiting dots */}
              <div className="absolute inset-0" style={{ animation: 'orbit 3s linear infinite' }}>
                <div className="w-2 h-2 rounded-full absolute top-0 left-1/2 -translate-x-1/2" style={{ backgroundColor: DS.gold }} />
              </div>
              <div className="absolute inset-0" style={{ animation: 'orbit2 4s linear infinite' }}>
                <div className="w-1.5 h-1.5 rounded-full absolute top-0 left-1/2 -translate-x-1/2" style={{ backgroundColor: DS.success }} />
              </div>
              <div className="absolute inset-0" style={{ animation: 'orbit3 5s linear infinite' }}>
                <div className="w-1 h-1 rounded-full absolute top-0 left-1/2 -translate-x-1/2" style={{ backgroundColor: '#58A6FF' }} />
              </div>
            </div>
            {/* Title */}
            <div className="text-3xl font-black tracking-tight mb-3" style={{
              background: 'linear-gradient(135deg, #FFB800, #FFD700, #FF8C00, #FFB800)',
              backgroundSize: '300% 300%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradientShift 3s ease infinite',
            }}>
              FOREXYEMENI-PRO
            </div>
            {/* Progress bar */}
            <div className="w-48 h-1 rounded-full mx-auto overflow-hidden" style={{ backgroundColor: DS.bgElevated }}>
              <div className="h-full rounded-full" style={{
                background: 'linear-gradient(90deg, #FFB800, #FFD700)',
                animation: 'progressBar 1.5s ease-out forwards',
              }} />
            </div>
            <div className="text-xs mt-4" style={{ color: DS.textMuted }}>جاري التحميل...</div>
          </div>
        </div>
      </>
    );
  }

  // ==================== Signal Card Component ====================
  const SignalCard = ({ signal, isAdmin = false, index = 0 }: { signal: SignalInfo; isAdmin?: boolean; index?: number }) => {
    const isExpanded = expandedSignal === signal.id;
    const targets: number[] = JSON.parse(signal.targets || '[]');
    const isBuy = signal.type === 'BUY';
    const statusInfo = getSignalStatusLabel(signal.status);
    const planInfo = getPlanLabel(signal.plan || '');
    const targetProgress = signal.totalTargets > 0 ? (signal.currentTP / signal.totalTargets) * 100 : 0;
    const accentColor = isBuy ? DS.success : DS.danger;

    useEffect(() => {
      if (!isAdmin && !signal.isRead && signal.id) {
        markSignalRead(signal.id);
      }
    }, [signal.id, signal.isRead, isAdmin]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className="mb-4"
      >
        <div
          className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
          style={{
            backgroundColor: DS.bgCard,
            border: `1px solid ${isExpanded ? 'rgba(255,255,255,0.1)' : DS.border}`,
            borderRight: `4px solid ${accentColor}`,
          }}
          onClick={() => setExpandedSignal(isExpanded ? null : signal.id)}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
            background: `linear-gradient(135deg, ${isBuy ? 'rgba(63,185,80,0.03)' : 'rgba(248,81,73,0.03)'}, transparent)`,
          }} />

          {/* Header */}
          <div className="p-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                  backgroundColor: isBuy ? 'rgba(63,185,80,0.12)' : 'rgba(248,81,73,0.12)',
                }}>
                  <TrendingUp size={18} style={{ color: accentColor, transform: isBuy ? 'none' : 'rotate(180deg)' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: DS.textPrimary }}>{signal.pair}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                      backgroundColor: isBuy ? 'rgba(63,185,80,0.12)' : 'rgba(248,81,73,0.12)',
                      color: accentColor,
                    }}>
                      {isBuy ? 'شراء' : 'بيع'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span style={{ color: DS.gold, fontSize: '10px' }}>{'★'.repeat(signal.stars)}</span>
                    {!isAdmin && !signal.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full ml-1" style={{ backgroundColor: '#58A6FF', animation: 'livePulse 2s infinite' }} />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{
                    backgroundColor: `${statusInfo.color}15`,
                    color: statusInfo.color,
                  }}>
                    {statusInfo.text}
                  </span>
                )}
                <span className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg" style={{
                  backgroundColor: DS.bgElevated,
                  color: DS.textSecondary,
                }}>
                  <Clock size={10} />
                  {formatTimeAgo(signal.createdAt)}
                </span>
              </div>
            </div>

            {/* Price Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: DS.bgElevated }}>
                <div className="text-xs mb-1" style={{ color: DS.textMuted }}>سعر الدخول</div>
                <div className="font-mono text-sm font-bold tabular-nums" style={{ color: DS.textPrimary }}>{signal.entry}</div>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: DS.bgElevated }}>
                <div className="text-xs mb-1" style={{ color: DS.textMuted }}>وقف الخسارة</div>
                <div className="font-mono text-sm font-bold tabular-nums" style={{ color: DS.danger }}>{signal.stopLoss}</div>
                <div className="text-xs mt-0.5" style={{ color: DS.textMuted }}>({signal.stopLossType})</div>
              </div>
            </div>

            {/* Progress bar for targets */}
            {signal.totalTargets > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: DS.textSecondary }}>
                    الأهداف {signal.currentTP}/{signal.totalTargets}
                  </span>
                  <span className="text-xs font-mono" style={{ color: DS.gold }}>{Math.round(targetProgress)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: DS.bgInput }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${accentColor}, ${DS.gold})`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${targetProgress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            {/* Expand indicator */}
            <div className="flex items-center justify-center mt-2">
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <ChevronDown size={16} style={{ color: DS.textMuted }} />
              </motion.div>
            </div>
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-1" style={{ borderTop: `1px solid ${DS.border}` }}>
                  {/* Targets Timeline */}
                  <div className="mt-3 mb-4">
                    <div className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: DS.gold }}>
                      <Target size={13} /> الأهداف
                    </div>
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute right-[15px] top-2 bottom-2 w-px" style={{ backgroundColor: DS.border }} />
                      <div className="space-y-1.5">
                        {targets.map((t, i) => {
                          const isHit = i < signal.currentTP;
                          const isNext = i === signal.currentTP && signal.status === 'ACTIVE';
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-center justify-between pr-8 pl-3 py-2 rounded-xl relative"
                              style={{
                                backgroundColor: isHit ? 'rgba(63,185,80,0.06)' : isNext ? 'rgba(255,184,0,0.06)' : 'transparent',
                              }}
                            >
                              {/* Timeline dot */}
                              <div className="absolute right-[10px] w-3 h-3 rounded-full" style={{
                                backgroundColor: isHit ? DS.success : isNext ? DS.gold : DS.textMuted,
                                boxShadow: isNext ? `0 0 8px ${DS.gold}40` : 'none',
                                animation: isNext ? 'livePulse 2s infinite' : 'none',
                              }} />
                              <span className="text-xs font-medium" style={{
                                color: isHit ? DS.success : isNext ? DS.gold : DS.textMuted,
                              }}>
                                {isHit ? '✓' : isNext ? '→' : '○'} هدف {i + 1}
                              </span>
                              <span className="font-mono text-xs font-bold tabular-nums" style={{
                                color: isHit ? DS.success : DS.textSecondary,
                                textDecoration: isHit ? 'line-through' : 'none',
                              }}>
                                {t.toFixed(2)}
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Extra Details */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: DS.bgElevated }}>
                      <div className="text-xs" style={{ color: DS.textMuted }}>💰 حجم اللوت</div>
                      <div className="text-sm font-bold mt-1" style={{ color: DS.textPrimary }}>{signal.lotSize} لوت</div>
                    </div>
                    <div className="p-3 rounded-xl" style={{ backgroundColor: DS.bgElevated }}>
                      <div className="text-xs" style={{ color: DS.textMuted }}>⚠️ المخاطرة</div>
                      <div className="text-sm font-bold mt-1" style={{ color: DS.warning }}>${signal.riskAmount}</div>
                    </div>
                  </div>

                  {signal.notes && (
                    <div className="p-3 rounded-xl mb-3" style={{ backgroundColor: DS.bgElevated }}>
                      <div className="text-xs font-medium mb-1" style={{ color: DS.textMuted }}>📝 ملاحظات</div>
                      <div className="text-xs leading-relaxed" style={{ color: DS.textSecondary }}>{signal.notes}</div>
                    </div>
                  )}

                  {/* Admin Actions */}
                  {isAdmin && signal.status === 'ACTIVE' && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={(e) => { e.stopPropagation(); handleUpdateSignal(signal.id, { currentTP: signal.currentTP + 1 }); }}
                        disabled={signal.currentTP >= signal.totalTargets}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-40"
                        style={{ backgroundColor: 'rgba(63,185,80,0.12)', color: DS.success }}
                      >
                        <Target size={12} /> تحديث هدف+
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={(e) => { e.stopPropagation(); handleUpdateSignal(signal.id, { status: 'HIT_SL' }); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{ backgroundColor: 'rgba(248,81,73,0.12)', color: DS.danger }}
                      >
                        <X size={12} /> ضرب وقف
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={(e) => { e.stopPropagation(); handleUpdateSignal(signal.id, { status: 'CANCELLED' }); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{ backgroundColor: 'rgba(139,148,158,0.12)', color: DS.textSecondary }}
                      >
                        <AlertCircle size={12} /> إلغاء
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteSignal(signal.id); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{ backgroundColor: 'rgba(248,81,73,0.08)', color: DS.danger }}
                      >
                        <Trash2 size={12} />
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  // ==================== Landing View ====================
  if (view === 'landing') {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
        <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: DS.bgPrimary }} dir="rtl" ref={landingRef}>
          {/* Noise texture overlay */}
          <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-[1]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '256px 256px',
          }} />

          {/* Animated mesh gradient background */}
          <div className="absolute inset-0" style={{
            background: `
              radial-gradient(ellipse at 20% 20%, rgba(255,184,0,0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 80%, rgba(88,166,255,0.04) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(63,185,80,0.03) 0%, transparent 60%)
            `,
            animation: 'meshGradient 15s ease infinite',
            backgroundSize: '400% 400%',
          }} />

          {/* Floating geometric shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[15%] right-[10%] w-32 h-32 rounded-full opacity-[0.04]" style={{
              border: `1px solid ${DS.gold}`,
              animation: 'float1 20s ease-in-out infinite',
            }} />
            <div className="absolute top-[40%] left-[5%] w-24 h-24 rounded-full opacity-[0.03]" style={{
              border: `1px solid ${DS.success}`,
              animation: 'float2 18s ease-in-out infinite',
            }} />
            <div className="absolute bottom-[20%] right-[20%] w-16 h-16 opacity-[0.04]" style={{
              border: `1px solid #58A6FF`,
              animation: 'float1 22s ease-in-out infinite reverse',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            }} />
            <div className="absolute top-[60%] right-[70%] w-20 h-20 rounded-full opacity-[0.03]" style={{
              border: `1px solid ${DS.warning}`,
              animation: 'float2 25s ease-in-out infinite',
            }} />
          </div>

          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
          }} />

          {/* Navigation */}
          <header className="relative z-10" style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            backgroundColor: 'rgba(8,10,16,0.6)',
            borderBottom: `1px solid ${DS.border}`,
          }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
                }}>
                  <TrendingUp size={16} style={{ color: DS.bgPrimary }} />
                </div>
                <span className="font-black text-sm" style={{ color: DS.textPrimary }}>FX PRO</span>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setView('login')}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ color: DS.textSecondary }}
                >
                  تسجيل دخول
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setView('register')}
                  className="px-5 py-2 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
                    color: DS.bgPrimary,
                  }}
                >
                  إنشاء حساب
                </motion.button>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mb-8 font-medium"
                style={{
                  backgroundColor: 'rgba(255,184,0,0.08)',
                  color: DS.gold,
                  border: '1px solid rgba(255,184,0,0.15)',
                  animation: 'borderGlow 3s ease infinite',
                }}
              >
                <Zap size={13} /> الإصدار 1.10
              </motion.div>

              {/* Main Title */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6" style={{
                background: 'linear-gradient(135deg, #FFB800, #FFD700, #FF8C00, #FFB800)',
                backgroundSize: '300% 300%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradientShift 4s ease infinite',
                lineHeight: 1.1,
              }}>
                FOREXYEMENI-PRO
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl mb-3 font-medium" style={{ color: DS.textPrimary }}>
                نظام إشارات التداول الاحترافي
              </p>
              <p className="text-sm sm:text-base max-w-xl mx-auto mb-10" style={{ color: DS.textSecondary }}>
                إشارات تداول دقيقة مبنيّة على تحليل فني متقدم - جولد / فوركس
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(255,184,0,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setView('login')}
                  className="px-8 py-3.5 rounded-2xl text-base font-bold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
                    color: DS.bgPrimary,
                    animation: 'pulse-gold 3s ease infinite',
                  }}
                >
                  ابدأ التداول الآن
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setView('register')}
                  className="px-8 py-3.5 rounded-2xl text-base font-bold transition-all"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    color: DS.textPrimary,
                    border: `1px solid rgba(255,255,255,0.1)`,
                  }}
                >
                  إنشاء حساب مجاني
                </motion.button>
              </div>
            </motion.div>
          </section>

          {/* Stats Section */}
          <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'إشارة يومية', value: '5+', icon: <Signal size={20} /> },
                { label: 'نسبة النجاح', value: '85%', icon: <Target size={20} /> },
                { label: 'مستخدم نشط', value: '500+', icon: <Users size={20} /> },
                { label: 'زوج عملات', value: '20+', icon: <BarChart3 size={20} /> },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                  className="p-5 rounded-2xl text-center group"
                  style={{
                    backgroundColor: DS.bgCard,
                    border: `1px solid ${DS.border}`,
                    transition: 'all 0.3s ease',
                  }}
                  whileHover={{
                    borderColor: 'rgba(255,184,0,0.2)',
                    boxShadow: '0 0 20px rgba(255,184,0,0.05)',
                  }}
                >
                  <div className="mb-2 flex justify-center" style={{ color: DS.gold, opacity: 0.7 }}>{s.icon}</div>
                  <div className="text-2xl sm:text-3xl font-black tabular-nums" style={{ color: DS.gold }}>
                    <AnimatedCounter value={s.value} />
                  </div>
                  <div className="text-xs mt-1" style={{ color: DS.textSecondary }}>{s.label}</div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Features Section */}
          <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: DS.textPrimary }}>
                لماذا تختارنا؟
              </h2>
              <p className="text-sm" style={{ color: DS.textSecondary }}>
                أدوات متقدمة وبيانات دقيقة لاتخاذ قرارات تداول أفضل
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: <Target size={24} />, title: 'إشارات دقيقة', desc: 'تحليل فني متقدم لأزواج العملات والذهب مع نقاط دخول وخروج محددة', color: DS.success },
                { icon: <Shield size={24} />, title: 'إدارة مخاطر', desc: 'وقف خسارة وأهداف متعددة لكل إشارة مع حسابات حجم اللوت تلقائياً', color: '#58A6FF' },
                { icon: <BarChart3 size={24} />, title: 'تتبع فوري', desc: 'متابعة حالة الإشارات في الوقت الحقيقي مع إشعارات فورية', color: DS.gold },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.15, duration: 0.5 }}
                  whileHover={{
                    y: -4,
                    borderColor: `${f.color}30`,
                    boxShadow: `0 8px 30px rgba(0,0,0,0.3), 0 0 20px ${f.color}08`,
                  }}
                  className="p-6 rounded-2xl transition-all duration-300"
                  style={{
                    backgroundColor: DS.bgCard,
                    border: `1px solid ${DS.border}`,
                  }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{
                    backgroundColor: `${f.color}12`,
                    color: f.color,
                  }}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold mb-2" style={{ color: DS.textPrimary }}>{f.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: DS.textSecondary }}>{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: DS.textPrimary }}>
                آراء المتداولين
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { name: 'أحمد', text: 'إشارات دقيقة جداً، حققت أرباح ممتازة في أول أسبوع', rating: 5 },
                { name: 'محمد', text: 'أفضل منصة إشارات تداول، إدارة مخاطر احترافية', rating: 5 },
                { name: 'خالد', text: 'التتبع الفوري والتحديثات المستمرة ميزة رائعة', rating: 4 },
              ].map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 + i * 0.1 }}
                  className="p-5 rounded-2xl"
                  style={{
                    backgroundColor: DS.bgCard,
                    border: `1px solid ${DS.border}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{
                      background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
                      color: DS.bgPrimary,
                    }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm" style={{ color: DS.textPrimary }}>{t.name}</div>
                      <div className="text-xs" style={{ color: DS.gold }}>{'★'.repeat(t.rating)}</div>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: DS.textSecondary }}>{t.text}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="p-8 sm:p-12 rounded-3xl text-center relative overflow-hidden"
              style={{
                backgroundColor: DS.bgCard,
                border: `1px solid rgba(255,184,0,0.15)`,
              }}
            >
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at center, rgba(255,184,0,0.06), transparent 70%)',
              }} />
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-black mb-4" style={{ color: DS.textPrimary }}>
                  ابدأ رحلتك في التداول
                </h2>
                <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: DS.textSecondary }}>
                  انضم لمئات المتداولين واستفد من إشارات دقيقة واحترافية
                </p>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255,184,0,0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setView('register')}
                  className="px-10 py-4 rounded-2xl text-base font-bold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
                    color: DS.bgPrimary,
                    animation: 'pulse-gold 3s ease infinite',
                  }}
                >
                  سجّل الآن مجاناً
                </motion.button>
              </div>
            </motion.div>
          </section>

          {/* Footer */}
          <footer className="relative z-10 text-center py-8" style={{ borderTop: `1px solid ${DS.border}` }}>
            <p className="text-xs" style={{ color: DS.textMuted }}>© 2024 FOREXYEMENI-PRO v1.10 - جميع الحقوق محفوظة</p>
          </footer>
        </div>
      </>
    );
  }

  // ==================== Login View ====================
  if (view === 'login') {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
        <div className="min-h-screen flex" style={{ backgroundColor: DS.bgPrimary }} dir="rtl">
          {/* Left side - branding (hidden on mobile) */}
          <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12" style={{
            background: 'linear-gradient(135deg, rgba(255,184,0,0.05), rgba(255,140,0,0.02))',
            borderLeft: `1px solid ${DS.border}`,
          }}>
            <div className="absolute inset-0" style={{
              background: `
                radial-gradient(circle at 30% 40%, rgba(255,184,0,0.08), transparent 50%),
                radial-gradient(circle at 70% 60%, rgba(88,166,255,0.05), transparent 50%)
              `,
            }} />
            <div className="relative text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{
                background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
                boxShadow: '0 0 40px rgba(255,184,0,0.2)',
              }}>
                <TrendingUp size={36} style={{ color: DS.bgPrimary }} />
              </div>
              <h1 className="text-3xl font-black mb-3" style={{
                background: 'linear-gradient(135deg, #FFB800, #FFD700)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>FOREXYEMENI-PRO</h1>
              <p className="text-sm" style={{ color: DS.textSecondary }}>نظام إشارات التداول الاحترافي</p>
            </div>
          </div>

          {/* Right side - form */}
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm"
            >
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 lg:hidden" style={{
                  background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
                }}>
                  <TrendingUp size={22} style={{ color: DS.bgPrimary }} />
                </div>
                <h1 className="text-2xl font-black mb-1" style={{ color: DS.textPrimary }}>مرحباً بعودتك</h1>
                <p className="text-sm" style={{ color: DS.textSecondary }}>سجّل دخولك للمتابعة</p>
              </div>

              <div className="p-6 rounded-2xl space-y-5" style={{
                backgroundColor: DS.bgCard,
                border: `1px solid ${DS.border}`,
              }}>
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: DS.textSecondary }}>البريد الإلكتروني</label>
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="text-sm h-11 rounded-xl focus:ring-0 focus:outline-none"
                    style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: DS.textSecondary }}>كلمة المرور</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="text-sm h-11 rounded-xl focus:ring-0 focus:outline-none"
                      style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}
                      dir="ltr"
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: DS.textMuted }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
                    color: DS.bgPrimary,
                  }}
                  onClick={handleLogin}
                >
                  تسجيل الدخول
                </motion.button>
              </div>

              <div className="text-center mt-6 space-y-2">
                <button onClick={() => setView('register')} className="text-sm font-medium" style={{ color: DS.gold }}>
                  ليس لديك حساب؟ إنشاء حساب جديد
                </button>
                <div>
                  <button onClick={() => setView('landing')} className="text-xs flex items-center gap-1 mx-auto" style={{ color: DS.textMuted }}>
                    <ArrowLeft size={12} /> العودة للرئيسية
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  // ==================== Register View ====================
  if (view === 'register') {
    const strength = getPasswordStrength(regPassword);
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
        <div className="min-h-screen flex" style={{ backgroundColor: DS.bgPrimary }} dir="rtl">
          {/* Left side - branding */}
          <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12" style={{
            background: 'linear-gradient(135deg, rgba(63,185,80,0.05), rgba(88,166,255,0.02))',
            borderLeft: `1px solid ${DS.border}`,
          }}>
            <div className="absolute inset-0" style={{
              background: `
                radial-gradient(circle at 30% 50%, rgba(63,185,80,0.08), transparent 50%),
                radial-gradient(circle at 70% 30%, rgba(255,184,0,0.05), transparent 50%)
              `,
            }} />
            <div className="relative text-center max-w-sm">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{
                background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
                boxShadow: '0 0 40px rgba(255,184,0,0.2)',
              }}>
                <TrendingUp size={36} style={{ color: DS.bgPrimary }} />
              </div>
              <h1 className="text-3xl font-black mb-3" style={{
                background: 'linear-gradient(135deg, #FFB800, #FFD700)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>FOREXYEMENI-PRO</h1>
              <p className="text-sm mb-8" style={{ color: DS.textSecondary }}>
                انضم لمجتمع المتداولين المحترفين واحصل على إشارات دقيقة
              </p>
              <div className="space-y-3">
                {['إشارات يومية دقيقة', 'إدارة مخاطر احترافية', 'دعم فني على مدار الساعة'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm" style={{ color: DS.textSecondary }}>
                    <Check size={16} style={{ color: DS.success }} /> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side - form */}
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black mb-1" style={{ color: DS.textPrimary }}>إنشاء حساب جديد</h1>
                <p className="text-sm" style={{ color: DS.textSecondary }}>ابدأ رحلتك في التداول</p>
              </div>

              <div className="p-6 rounded-2xl space-y-4" style={{
                backgroundColor: DS.bgCard,
                border: `1px solid ${DS.border}`,
              }}>
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: DS.textSecondary }}>الاسم الكامل</label>
                  <Input
                    placeholder="أدخل اسمك"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="text-sm h-11 rounded-xl focus:ring-0 focus:outline-none"
                    style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: DS.textSecondary }}>البريد الإلكتروني</label>
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="text-sm h-11 rounded-xl focus:ring-0 focus:outline-none"
                    style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: DS.textSecondary }}>كلمة المرور</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="text-sm h-11 rounded-xl focus:ring-0 focus:outline-none"
                      style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}
                      dir="ltr"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: DS.textMuted }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {regPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300" style={{
                            backgroundColor: i <= (strength.width === '100%' ? 3 : strength.width === '66%' ? 2 : 1) ? strength.color : DS.bgInput,
                          }} />
                        ))}
                      </div>
                      <div className="text-xs mt-1" style={{ color: strength.color }}>{strength.level}</div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: DS.textSecondary }}>تأكيد كلمة المرور</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="text-sm h-11 rounded-xl focus:ring-0 focus:outline-none"
                    style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}
                    dir="ltr"
                    onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
                    color: DS.bgPrimary,
                  }}
                  onClick={handleRegister}
                >
                  إنشاء حساب
                </motion.button>
              </div>

              <div className="text-center mt-6 space-y-2">
                <button onClick={() => setView('login')} className="text-sm font-medium" style={{ color: DS.gold }}>
                  لديك حساب؟ تسجيل الدخول
                </button>
                <div>
                  <button onClick={() => setView('landing')} className="text-xs flex items-center gap-1 mx-auto" style={{ color: DS.textMuted }}>
                    <ArrowLeft size={12} /> العودة للرئيسية
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  // ==================== OTP Verification View ====================
  if (view === 'otp') {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
        <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: DS.bgPrimary }} dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm text-center"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{
              backgroundColor: 'rgba(255,184,0,0.1)',
              boxShadow: '0 0 30px rgba(255,184,0,0.1)',
            }}>
              <Shield size={30} style={{ color: DS.gold }} />
            </div>
            <h1 className="text-2xl font-black mb-2" style={{ color: DS.textPrimary }}>تفعيل الحساب</h1>
            <p className="text-sm mb-1" style={{ color: DS.textSecondary }}>
              أدخل كود التفعيل المكون من 6 أرقام
            </p>
            <p className="text-sm font-bold mb-8" style={{ color: DS.gold }} dir="ltr">{otpEmail}</p>

            <div className="p-6 rounded-2xl mb-6" style={{
              backgroundColor: DS.bgCard,
              border: `1px solid ${DS.border}`,
            }}>
              <div className="flex justify-center mb-6" dir="ltr">
                <InputOTP
                  maxLength={6}
                  value={otpValue}
                  onChange={setOtpValue}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
                  color: DS.bgPrimary,
                  opacity: otpValue.length === 6 ? 1 : 0.6,
                }}
                onClick={handleVerifyOTP}
                disabled={otpValue.length !== 6}
              >
                تحقق من الكود
              </motion.button>
            </div>

            <div className="space-y-3">
              {otpCountdown > 0 ? (
                <span className="text-sm" style={{ color: DS.textMuted }}>
                  إعادة الإرسال بعد <span style={{ color: DS.gold }}>{otpCountdown}</span> ثانية
                </span>
              ) : (
                <button onClick={handleResendOTP} className="text-sm font-bold" style={{ color: DS.gold }}>
                  إعادة إرسال الكود
                </button>
              )}
              <div>
                <button onClick={() => setView('login')} className="text-xs flex items-center gap-1 mx-auto" style={{ color: DS.textMuted }}>
                  <ArrowLeft size={12} /> العودة لتسجيل الدخول
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  // ==================== Pending Approval View ====================
  if (view === 'pending') {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
        <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: DS.bgPrimary }} dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm text-center"
          >
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{
              backgroundColor: 'rgba(210,153,34,0.1)',
              boxShadow: '0 0 30px rgba(210,153,34,0.1)',
            }}>
              <Clock size={36} style={{ color: DS.warning }} />
            </div>
            <h1 className="text-2xl font-black mb-3" style={{ color: DS.textPrimary }}>بانتظار الموافقة</h1>
            <p className="text-sm mb-8" style={{ color: DS.textSecondary }}>
              حسابك قيد المراجعة من قبل الإدارة. سيتم تفعيله قريباً.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('login')}
              className="px-8 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                color: DS.textPrimary,
                border: `1px solid rgba(255,255,255,0.1)`,
              }}
            >
              تسجيل الدخول
            </motion.button>
          </motion.div>
        </div>
      </>
    );
  }

  // ==================== User Dashboard ====================
  if (view === 'user-dashboard' && user) {
    const planInfo = getPlanLabel(user.plan);
    const trialDaysLeft = user.trialEndsAt ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000)) : 0;
    const unreadCount = signals.filter(s => !s.isRead).length;

    const renderHomeTab = () => (
      <div className="space-y-4" dir="rtl">
        {/* Greeting Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,184,0,0.08), rgba(255,140,0,0.02))',
            border: `1px solid rgba(255,184,0,0.12)`,
            animation: 'borderGlow 4s ease infinite',
          }}
        >
          <div className="absolute top-0 left-0 w-32 h-32 rounded-full" style={{
            background: 'radial-gradient(circle, rgba(255,184,0,0.1), transparent)',
            transform: 'translate(-50%, -50%)',
          }} />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black" style={{
              background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
              color: DS.bgPrimary,
            }}>
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-lg" style={{ color: DS.textPrimary }}>مرحباً، {user.name}</h2>
              <p className="text-xs" style={{ color: DS.textSecondary }}>أهلاً بك في FOREXYEMENI-PRO</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'الخطة', value: planInfo.text, icon: <Crown size={16} />, color: planInfo.color, extra: user.plan === 'TRIAL' && trialDaysLeft > 0 ? `متبقي ${trialDaysLeft} يوم` : undefined },
            { label: 'الإشارات النشطة', value: String(signals.filter(s => s.status === 'ACTIVE').length), icon: <Signal size={16} />, color: DS.success },
            { label: 'الرصيد', value: `$${user.accBalance}`, icon: <DollarSign size={16} />, color: DS.textPrimary },
            { label: 'نسبة المخاطرة', value: `${user.riskPct}%`, icon: <Percent size={16} />, color: DS.warning },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="p-4 rounded-2xl"
              style={{
                backgroundColor: DS.bgCard,
                border: `1px solid ${DS.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
                  backgroundColor: `${stat.color}12`,
                  color: stat.color,
                }}>
                  {stat.icon}
                </div>
                <span className="text-xs" style={{ color: DS.textMuted }}>{stat.label}</span>
              </div>
              <div className="font-bold text-lg" style={{ color: stat.color }}>{stat.value}</div>
              {stat.extra && <div className="text-xs mt-1" style={{ color: DS.warning }}>{stat.extra}</div>}
            </motion.div>
          ))}
        </div>

        {/* Recent Signals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2" style={{ color: DS.textPrimary }}>
              <Signal size={16} style={{ color: DS.gold }} /> آخر الإشارات
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{
                backgroundColor: 'rgba(88,166,255,0.15)',
                color: '#58A6FF',
              }}>
                {unreadCount} جديدة
              </span>
            )}
          </div>
          {signalsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 rounded-2xl" style={{ backgroundColor: DS.bgCard }} />
              ))}
            </div>
          ) : signals.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: DS.bgCard }}>
              <Signal size={36} style={{ color: DS.textMuted }} className="mx-auto mb-3" />
              <p className="text-sm" style={{ color: DS.textMuted }}>لا توجد إشارات حالياً</p>
            </div>
          ) : (
            signals.slice(0, 5).map((s, i) => <SignalCard key={s.id} signal={s} index={i} />)
          )}
        </div>
      </div>
    );

    const renderSignalsTab = () => (
      <div dir="rtl">
        {/* Filter Chips */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'all' as const, label: 'الكل' },
            { id: 'buy' as const, label: 'شراء' },
            { id: 'sell' as const, label: 'بيع' },
            { id: 'done' as const, label: 'مكتملة' },
          ].map(f => (
            <motion.button
              key={f.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSignalFilter(f.id)}
              className="px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
              style={{
                backgroundColor: signalFilter === f.id ? 'rgba(255,184,0,0.12)' : DS.bgCard,
                color: signalFilter === f.id ? DS.gold : DS.textSecondary,
                border: `1px solid ${signalFilter === f.id ? 'rgba(255,184,0,0.2)' : DS.border}`,
              }}
            >
              {f.label}
            </motion.button>
          ))}
          <div className="flex-1" />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={fetchSignals}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: DS.bgCard, border: `1px solid ${DS.border}`, color: DS.textSecondary }}
          >
            <RefreshCw size={14} />
          </motion.button>
        </div>

        {signalsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-28 rounded-2xl" style={{ backgroundColor: DS.bgCard }} />
            ))}
          </div>
        ) : filteredSignals.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: DS.bgCard }}>
            <Target size={40} style={{ color: DS.textMuted }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: DS.textMuted }}>لا توجد إشارات</p>
          </div>
        ) : (
          filteredSignals.map((s, i) => <SignalCard key={s.id} signal={s} index={i} />)
        )}
      </div>
    );

    const renderSettingsTab = () => (
      <div className="space-y-4" dir="rtl">
        <h3 className="font-bold flex items-center gap-2" style={{ color: DS.textPrimary }}>
          <Settings size={16} style={{ color: DS.gold }} /> إعدادات الحساب
        </h3>
        <div className="p-5 rounded-2xl space-y-5" style={{
          backgroundColor: DS.bgCard,
          border: `1px solid ${DS.border}`,
        }}>
          <div className="space-y-1">
            <label className="block text-xs font-medium mb-1.5" style={{ color: DS.textSecondary }}>حجم اللوت الافتراضي</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.01"
              value={userSettings.lotSize}
              onChange={(e) => setUserSettings({ ...userSettings, lotSize: e.target.value })}
              className="text-sm h-11 rounded-xl focus:ring-0 focus:outline-none"
              style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}
              dir="ltr"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium mb-1.5" style={{ color: DS.textSecondary }}>رصيد الحساب ($)</label>
            <Input
              type="number"
              placeholder="100"
              value={userSettings.accBalance}
              onChange={(e) => setUserSettings({ ...userSettings, accBalance: e.target.value })}
              className="text-sm h-11 rounded-xl focus:ring-0 focus:outline-none"
              style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}
              dir="ltr"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium mb-1.5" style={{ color: DS.textSecondary }}>نسبة المخاطرة (%)</label>
            <Input
              type="number"
              min="1"
              max="100"
              placeholder="5"
              value={userSettings.riskPct}
              onChange={(e) => setUserSettings({ ...userSettings, riskPct: e.target.value })}
              className="text-sm h-11 rounded-xl focus:ring-0 focus:outline-none"
              style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}
              dir="ltr"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
              color: DS.bgPrimary,
            }}
            onClick={() => toast({ title: 'نجاح', description: 'تم حفظ الإعدادات' })}
          >
            حفظ الإعدادات
          </motion.button>
        </div>
      </div>
    );

    const renderProfileTab = () => (
      <div className="space-y-4" dir="rtl">
        <h3 className="font-bold flex items-center gap-2" style={{ color: DS.textPrimary }}>
          <User size={16} style={{ color: DS.gold }} /> الملف الشخصي
        </h3>
        {/* Avatar + Plan */}
        <div className="p-5 rounded-2xl" style={{
          backgroundColor: DS.bgCard,
          border: `1px solid ${DS.border}`,
        }}>
          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              <div className="w-18 h-18 rounded-full flex items-center justify-center text-2xl font-black" style={{
                background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
                color: DS.bgPrimary,
                width: '72px',
                height: '72px',
                boxShadow: '0 0 20px rgba(255,184,0,0.2)',
              }}>
                {user.name.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{
                backgroundColor: planInfo.color,
                color: DS.bgPrimary,
                boxShadow: `0 0 8px ${planInfo.color}40`,
              }}>
                {user.plan === 'VIP' ? <Gem size={12} /> : <Crown size={12} />}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: DS.textPrimary }}>{user.name}</h3>
              <p className="text-xs" style={{ color: DS.textSecondary }} dir="ltr">{user.email}</p>
              <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full font-medium" style={{
                backgroundColor: `${planInfo.color}15`,
                color: planInfo.color,
              }}>
                {planInfo.text}
              </span>
            </div>
          </div>

          {/* Account Info */}
          <div className="space-y-2">
            {[
              { label: 'الحالة', value: 'نشط', color: DS.success },
              { label: 'تاريخ التسجيل', value: new Date(user.createdAt).toLocaleDateString('ar'), color: DS.textPrimary },
              { label: 'حجم اللوت', value: user.lotSize ? `${user.lotSize}` : 'غير محدد', color: DS.textPrimary },
              { label: 'الرصيد', value: `$${user.accBalance}`, color: DS.textPrimary },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-xl" style={{
                backgroundColor: DS.bgElevated,
              }}>
                <span className="text-xs" style={{ color: DS.textMuted }}>{row.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: row.color }}>{row.value}</span>
                  <ChevronLeft size={14} style={{ color: DS.textMuted }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
          style={{
            backgroundColor: 'rgba(248,81,73,0.08)',
            color: DS.danger,
            border: `1px solid rgba(248,81,73,0.15)`,
          }}
        >
          <LogOut size={16} /> تسجيل الخروج
        </motion.button>
      </div>
    );

    const userTabs = [
      { id: 'home' as UserTab, icon: <Home size={20} />, label: 'الرئيسية' },
      { id: 'signals' as UserTab, icon: <Signal size={20} />, label: 'الإشارات', badge: unreadCount > 0 ? unreadCount : undefined },
      { id: 'settings' as UserTab, icon: <Settings size={20} />, label: 'الإعدادات' },
      { id: 'profile' as UserTab, icon: <User size={20} />, label: 'الحساب' },
    ];

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: DS.bgPrimary }} dir="rtl">
          {/* Header */}
          <header className="sticky top-0 z-50" style={{
            backgroundColor: DS.glass,
            borderBottom: `1px solid ${DS.border}`,
            backdropFilter: 'blur(20px) saturate(180%)',
          }}>
            <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
                }}>
                  <TrendingUp size={16} style={{ color: DS.bgPrimary }} />
                </div>
                <span className="font-black text-sm" style={{ color: DS.textPrimary }}>FX PRO</span>
              </div>
              <span className="text-xs px-3 py-1 rounded-full font-medium" style={{
                backgroundColor: `${planInfo.color}12`,
                color: planInfo.color,
                border: `1px solid ${planInfo.color}20`,
              }}>
                {planInfo.text}
              </span>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-24">
            <AnimatePresence mode="wait">
              {userTab === 'home' && <motion.div key="home" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>{renderHomeTab()}</motion.div>}
              {userTab === 'signals' && <motion.div key="signals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>{renderSignalsTab()}</motion.div>}
              {userTab === 'settings' && <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>{renderSettingsTab()}</motion.div>}
              {userTab === 'profile' && <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>{renderProfileTab()}</motion.div>}
            </AnimatePresence>
          </main>

          {/* Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 z-50" style={{
            backgroundColor: DS.glass,
            borderTop: `1px solid ${DS.border}`,
            backdropFilter: 'blur(20px) saturate(180%)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}>
            <div className="max-w-lg mx-auto flex relative">
              {/* Active indicator pill */}
              <motion.div
                className="absolute top-0 h-0.5 rounded-full"
                style={{ backgroundColor: DS.gold }}
                animate={{
                  left: `${(userTabs.findIndex(t => t.id === userTab) / userTabs.length) * 100}%`,
                  width: `${100 / userTabs.length}%`,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
              {userTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setUserTab(tab.id)}
                  className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative"
                >
                  <div className="relative">
                    <span style={{ color: userTab === tab.id ? DS.gold : DS.textMuted }}>{tab.icon}</span>
                    {tab.badge && (
                      <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{
                        backgroundColor: '#58A6FF',
                        color: '#fff',
                        animation: 'livePulse 2s infinite',
                      }}>
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: userTab === tab.id ? DS.gold : DS.textMuted }}>{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </>
    );
  }

  // ==================== Admin Dashboard ====================
  if (view === 'admin-dashboard' && user) {
    const renderAdminHome = () => {
      const totalUsers = adminUsers.length;
      const activeSignals = adminSignals.filter(s => s.status === 'ACTIVE').length;
      const planCounts = adminUsers.reduce((acc, u) => {
        acc[u.plan] = (acc[u.plan] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return (
        <div className="space-y-4" dir="rtl">
          {/* Admin greeting */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,184,0,0.08), rgba(255,140,0,0.02))',
              border: `1px solid rgba(255,184,0,0.12)`,
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
                color: DS.bgPrimary,
              }}>
                <LayoutDashboard size={22} />
              </div>
              <div>
                <h2 className="font-bold text-lg" style={{ color: DS.gold }}>لوحة التحكم</h2>
                <p className="text-xs" style={{ color: DS.textSecondary }}>مرحباً، {user.name} - المدير</p>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'المستخدمين', value: totalUsers, icon: <Users size={18} />, color: '#58A6FF' },
              { label: 'إشارات نشطة', value: activeSignals, icon: <Signal size={18} />, color: DS.success },
              { label: 'مشتركين VIP', value: planCounts['VIP'] || 0, icon: <Gem size={18} />, color: DS.gold },
              { label: 'إجمالي الإشارات', value: adminSignals.length, icon: <Activity size={18} />, color: DS.warning },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.05 }}
                className="p-4 rounded-2xl"
                style={{
                  backgroundColor: DS.bgCard,
                  border: `1px solid ${DS.border}`,
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{
                  backgroundColor: `${stat.color}12`,
                  color: stat.color,
                }}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-black tabular-nums" style={{ color: DS.textPrimary }}>
                  <AnimatedCounter value={String(stat.value)} />
                </div>
                <div className="text-xs mt-1" style={{ color: DS.textMuted }}>{stat.label}</div>
                {/* Mini sparkline */}
                <div className="mt-2 flex items-end gap-px h-5">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <div key={j} className="flex-1 rounded-sm" style={{
                      height: `${30 + Math.random() * 70}%`,
                      backgroundColor: `${stat.color}20`,
                    }} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Plan Distribution */}
          <div className="p-5 rounded-2xl" style={{
            backgroundColor: DS.bgCard,
            border: `1px solid ${DS.border}`,
          }}>
            <h3 className="font-bold text-sm mb-4" style={{ color: DS.textPrimary }}>توزيع الخطط</h3>
            <div className="space-y-3">
              {['TRIAL', 'BASIC', 'PRO', 'VIP'].map(plan => {
                const count = planCounts[plan] || 0;
                const total = totalUsers || 1;
                const pct = Math.round((count / total) * 100);
                const info = getPlanLabel(plan);
                return (
                  <div key={plan}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium" style={{ color: info.color }}>{info.text}</span>
                      <span style={{ color: DS.textMuted }}>{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: DS.bgInput }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: info.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-5 rounded-2xl" style={{
            backgroundColor: DS.bgCard,
            border: `1px solid ${DS.border}`,
          }}>
            <h3 className="font-bold text-sm mb-4" style={{ color: DS.textPrimary }}>آخر الإشارات</h3>
            <div className="space-y-2">
              {adminSignals.slice(0, 5).map((s, i) => {
                const isBuy = s.type === 'BUY';
                return (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: DS.bgElevated }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                        backgroundColor: isBuy ? 'rgba(63,185,80,0.12)' : 'rgba(248,81,73,0.12)',
                      }}>
                        <TrendingUp size={14} style={{ color: isBuy ? DS.success : DS.danger, transform: isBuy ? 'none' : 'rotate(180deg)' }} />
                      </div>
                      <div>
                        <div className="text-sm font-bold" style={{ color: DS.textPrimary }}>{s.pair}</div>
                        <div className="text-xs" style={{ color: DS.textMuted }}>{formatTimeAgo(s.createdAt)}</div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{
                      backgroundColor: `${getSignalStatusLabel(s.status).color}15`,
                      color: getSignalStatusLabel(s.status).color,
                    }}>
                      {getSignalStatusLabel(s.status).text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    };

    const renderAdminSignals = () => (
      <div dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2" style={{ color: DS.textPrimary }}>
            <Signal size={16} style={{ color: DS.gold }} /> إدارة الإشارات
          </h3>
          <Dialog open={showCreateSignal} onOpenChange={setShowCreateSignal}>
            <DialogTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                style={{
                  background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
                  color: DS.bgPrimary,
                }}
              >
                <Plus size={14} /> إشارة جديدة
              </motion.button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl" style={{
              backgroundColor: DS.bgCard,
              border: `1px solid rgba(255,255,255,0.08)`,
            }}>
              <DialogHeader>
                <DialogTitle style={{ color: DS.textPrimary }}>إنشاء إشارة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: DS.textSecondary }}>النوع</label>
                    <Select value={newSignal.type} onValueChange={(v) => setNewSignal({ ...newSignal, type: v })}>
                      <SelectTrigger style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }} className="rounded-xl h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUY">شراء (BUY)</SelectItem>
                        <SelectItem value="SELL">بيع (SELL)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: DS.textSecondary }}>الزوج</label>
                    <Input
                      placeholder="XAUUSD"
                      value={newSignal.pair}
                      onChange={(e) => setNewSignal({ ...newSignal, pair: e.target.value.toUpperCase() })}
                      className="text-sm h-11 rounded-xl"
                      style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: DS.textSecondary }}>سعر الدخول</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="2,345.50"
                      value={newSignal.entry}
                      onChange={(e) => setNewSignal({ ...newSignal, entry: e.target.value })}
                      className="text-sm h-11 rounded-xl"
                      style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: DS.textSecondary }}>وقف الخسارة</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="2,340.00"
                      value={newSignal.stopLoss}
                      onChange={(e) => setNewSignal({ ...newSignal, stopLoss: e.target.value })}
                      className="text-sm h-11 rounded-xl"
                      style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: DS.textSecondary }}>نوع الوقف</label>
                    <Select value={newSignal.stopLossType} onValueChange={(v) => setNewSignal({ ...newSignal, stopLossType: v })}>
                      <SelectTrigger style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }} className="rounded-xl h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIXED">FIXED</SelectItem>
                        <SelectItem value="ATR">ATR</SelectItem>
                        <SelectItem value="PIVOT">PIVOT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: DS.textSecondary }}>التقييم</label>
                    <Select value={String(newSignal.stars)} onValueChange={(v) => setNewSignal({ ...newSignal, stars: Number(v) })}>
                      <SelectTrigger style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }} className="rounded-xl h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">⭐ 1</SelectItem>
                        <SelectItem value="2">⭐⭐ 2</SelectItem>
                        <SelectItem value="3">⭐⭐⭐ 3</SelectItem>
                        <SelectItem value="4">⭐⭐⭐⭐ 4</SelectItem>
                        <SelectItem value="5">⭐⭐⭐⭐⭐ 5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Targets */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium" style={{ color: DS.textSecondary }}>الأهداف</label>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setNewSignal({ ...newSignal, targets: [...newSignal.targets, ''] })}
                      className="flex items-center gap-1 text-xs font-medium"
                      style={{ color: DS.gold }}
                    >
                      <Plus size={12} /> إضافة
                    </motion.button>
                  </div>
                  <div className="space-y-2">
                    {newSignal.targets.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs w-10 shrink-0" style={{ color: DS.textMuted }}>هدف {i + 1}</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="2,350.00"
                          value={t}
                          onChange={(e) => {
                            const targets = [...newSignal.targets];
                            targets[i] = e.target.value;
                            setNewSignal({ ...newSignal, targets });
                          }}
                          className="text-sm h-10 rounded-lg flex-1"
                          style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}
                          dir="ltr"
                        />
                        {newSignal.targets.length > 1 && (
                          <button onClick={() => setNewSignal({ ...newSignal, targets: newSignal.targets.filter((_, j) => j !== i) })} style={{ color: DS.danger }}>
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: DS.textSecondary }}>حجم اللوت</label>
                    <Input
                      placeholder="0.01"
                      value={newSignal.lotSize}
                      onChange={(e) => setNewSignal({ ...newSignal, lotSize: e.target.value })}
                      className="text-sm h-11 rounded-xl"
                      style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: DS.textSecondary }}>مبلغ المخاطرة ($)</label>
                    <Input
                      type="number"
                      placeholder="5.00"
                      value={newSignal.riskAmount}
                      onChange={(e) => setNewSignal({ ...newSignal, riskAmount: e.target.value })}
                      className="text-sm h-11 rounded-xl"
                      style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}
                      dir="ltr"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: DS.textSecondary }}>ملاحظات</label>
                  <textarea
                    placeholder="ملاحظات إضافية..."
                    value={newSignal.notes}
                    onChange={(e) => setNewSignal({ ...newSignal, notes: e.target.value })}
                    className="w-full text-sm p-3 rounded-xl resize-none h-20 focus:ring-0 focus:outline-none"
                    style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl font-bold text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
                    color: DS.bgPrimary,
                  }}
                  onClick={handleCreateSignal}
                >
                  إنشاء الإشارة
                </motion.button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {adminLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl" style={{ backgroundColor: DS.bgCard }} />
            ))}
          </div>
        ) : adminSignals.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: DS.bgCard }}>
            <Signal size={40} style={{ color: DS.textMuted }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: DS.textMuted }}>لا توجد إشارات بعد</p>
          </div>
        ) : (
          adminSignals.map((s, i) => <SignalCard key={s.id} signal={s} isAdmin index={i} />)
        )}
      </div>
    );

    const renderAdminUsers = () => (
      <div dir="rtl">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: DS.textMuted }} />
            <Input
              placeholder="بحث عن مستخدم..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="text-sm pr-9 h-11 rounded-xl focus:ring-0 focus:outline-none"
              style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}
            />
          </div>
          <Select value={userStatusFilter} onValueChange={(v) => setUserStatusFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-36 h-11 rounded-xl" style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}>
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="ACTIVE">نشط</SelectItem>
              <SelectItem value="PENDING">معلق</SelectItem>
              <SelectItem value="SUSPENDED">موقوف</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {adminLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 rounded-2xl" style={{ backgroundColor: DS.bgCard }} />
            ))}
          </div>
        ) : adminUsers.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: DS.bgCard }}>
            <Users size={40} style={{ color: DS.textMuted }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: DS.textMuted }}>لا يوجد مستخدمون</p>
          </div>
        ) : (
          <div className="space-y-3">
            {adminUsers.map((u, i) => {
              const statusInfo = getStatusLabel(u.status);
              const planInfo = getPlanLabel(u.plan);
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-4 rounded-2xl"
                  style={{
                    backgroundColor: DS.bgCard,
                    border: `1px solid ${DS.border}`,
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm" style={{
                        background: `linear-gradient(135deg, ${planInfo.color}30, ${planInfo.color}10)`,
                        color: planInfo.color,
                      }}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm" style={{ color: DS.textPrimary }}>{u.name}</h4>
                        <p className="text-xs" style={{ color: DS.textMuted }} dir="ltr">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg" style={{
                        backgroundColor: `${statusInfo.color}12`,
                        color: statusInfo.color,
                      }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusInfo.color }} />
                        {statusInfo.text}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-lg" style={{
                        backgroundColor: `${planInfo.color}12`,
                        color: planInfo.color,
                      }}>
                        {planInfo.text}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {u.status === 'PENDING' && (
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        size="sm"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: 'rgba(63,185,80,0.12)', color: DS.success }}
                        onClick={() => handleApproveUser(u.id)}
                      >
                        <Check size={12} /> قبول
                      </motion.button>
                    )}
                    {u.status === 'ACTIVE' && (
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: 'rgba(248,81,73,0.12)', color: DS.danger }}
                        onClick={() => handleSuspendUser(u.id)}
                      >
                        <X size={12} /> تعليق
                      </motion.button>
                    )}
                    {u.status === 'SUSPENDED' && (
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: 'rgba(63,185,80,0.12)', color: DS.success }}
                        onClick={() => handleApproveUser(u.id)}
                      >
                        <Check size={12} /> تفعيل
                      </motion.button>
                    )}
                    <Select value={u.plan} onValueChange={(v) => handleChangePlan(u.id, v)}>
                      <SelectTrigger className="h-8 w-28 text-xs rounded-lg" style={{ backgroundColor: DS.bgInput, border: `1px solid ${DS.border}`, color: DS.textPrimary }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRIAL">تجريبي</SelectItem>
                        <SelectItem value="BASIC">أساسي</SelectItem>
                        <SelectItem value="PRO">احترافي</SelectItem>
                        <SelectItem value="VIP">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );

    const renderAdminSettings = () => (
      <div className="space-y-4" dir="rtl">
        <h3 className="font-bold flex items-center gap-2" style={{ color: DS.textPrimary }}>
          <Settings size={16} style={{ color: DS.gold }} /> الإعدادات
        </h3>
        <div className="p-5 rounded-2xl space-y-3" style={{
          backgroundColor: DS.bgCard,
          border: `1px solid ${DS.border}`,
        }}>
          <div className="flex justify-between items-center p-4 rounded-xl" style={{ backgroundColor: DS.bgElevated }}>
            <div>
              <div className="text-sm font-bold" style={{ color: DS.textPrimary }}>الإصدار</div>
              <div className="text-xs mt-0.5" style={{ color: DS.textSecondary }}>FOREXYEMENI-PRO v1.10</div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ backgroundColor: 'rgba(63,185,80,0.12)', color: DS.success }}>محدث</span>
          </div>
          <div className="flex justify-between items-center p-4 rounded-xl" style={{ backgroundColor: DS.bgElevated }}>
            <div>
              <div className="text-sm font-bold" style={{ color: DS.textPrimary }}>قاعدة البيانات</div>
              <div className="text-xs mt-0.5" style={{ color: DS.textSecondary }}>SQLite - متصلة</div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DS.success, animation: 'livePulse 2s infinite' }} />
              <span className="text-xs" style={{ color: DS.success }}>متصل</span>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
          style={{
            backgroundColor: 'rgba(248,81,73,0.08)',
            color: DS.danger,
            border: `1px solid rgba(248,81,73,0.15)`,
          }}
        >
          <LogOut size={16} /> تسجيل الخروج
        </motion.button>
      </div>
    );

    const adminTabs = [
      { id: 'home' as AdminTab, icon: <Home size={16} />, label: 'الرئيسية' },
      { id: 'signals' as AdminTab, icon: <Signal size={16} />, label: 'الإشارات' },
      { id: 'users' as AdminTab, icon: <Users size={16} />, label: 'المستخدمين' },
      { id: 'settings' as AdminTab, icon: <Settings size={16} />, label: 'الإعدادات' },
    ];

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: DS.bgPrimary }} dir="rtl">
          {/* Header */}
          <header className="sticky top-0 z-50" style={{
            backgroundColor: DS.glass,
            borderBottom: `1px solid ${DS.border}`,
            backdropFilter: 'blur(20px) saturate(180%)',
          }}>
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #FFB800, #FF8C00)',
                }}>
                  <TrendingUp size={16} style={{ color: DS.bgPrimary }} />
                </div>
                <span className="font-black text-sm" style={{ color: DS.textPrimary }}>FX PRO</span>
              </div>
              <span className="text-xs px-3 py-1 rounded-full font-medium" style={{
                backgroundColor: 'rgba(255,184,0,0.1)',
                color: DS.gold,
                border: `1px solid rgba(255,184,0,0.15)`,
              }}>
                مدير
              </span>
            </div>
          </header>

          {/* Navigation Tabs */}
          <div className="sticky top-[52px] z-40" style={{
            backgroundColor: DS.glass,
            borderBottom: `1px solid ${DS.border}`,
            backdropFilter: 'blur(20px) saturate(180%)',
          }}>
            <div className="max-w-4xl mx-auto px-4 flex relative">
              <motion.div
                className="absolute bottom-0 h-0.5 rounded-full"
                style={{ backgroundColor: DS.gold }}
                animate={{
                  right: `${(adminTabs.findIndex(t => t.id === adminTab) / adminTabs.length) * 100}%`,
                  width: `${100 / adminTabs.length}%`,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
              {adminTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAdminTab(tab.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors"
                  style={{
                    color: adminTab === tab.id ? DS.gold : DS.textMuted,
                  }}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 pb-8">
            <AnimatePresence mode="wait">
              {adminTab === 'home' && <motion.div key="ahome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{renderAdminHome()}</motion.div>}
              {adminTab === 'signals' && <motion.div key="asignals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{renderAdminSignals()}</motion.div>}
              {adminTab === 'users' && <motion.div key="ausers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{renderAdminUsers()}</motion.div>}
              {adminTab === 'settings' && <motion.div key="asettings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{renderAdminSettings()}</motion.div>}
            </AnimatePresence>
          </main>
        </div>
      </>
    );
  }

  return null;
}
