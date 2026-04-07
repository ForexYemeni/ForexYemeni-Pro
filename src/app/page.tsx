'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Shield, BarChart3, Bell, Star, Target, Clock, ChevronDown, ChevronUp,
  Home, Signal, Settings, User, LogOut, Plus, Trash2, Check, X, Eye, EyeOff,
  Send, AlertCircle, RefreshCw, Search, Users, Zap, Award, ArrowLeft,
  DollarSign, Percent, Activity
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
  if (password.length < 6) return { level: 'ضعيفة', color: '#FF5252', width: '33%' };
  if (password.length < 8) return { level: 'متوسطة', color: '#FFB74D', width: '66%' };
  if (/[0-9]/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { level: 'قوية', color: '#00E676', width: '100%' };
  }
  return { level: 'متوسطة', color: '#FFB74D', width: '66%' };
}

function getPlanLabel(plan: string): { text: string; color: string } {
  switch (plan) {
    case 'TRIAL': return { text: 'تجريبي', color: '#9E9E9E' };
    case 'BASIC': return { text: 'أساسي', color: '#2196F3' };
    case 'PRO': return { text: 'احترافي', color: '#9C27B0' };
    case 'VIP': return { text: 'VIP', color: '#FFD700' };
    default: return { text: plan, color: '#9E9E9E' };
  }
}

function getStatusLabel(status: string): { text: string; color: string } {
  switch (status) {
    case 'ACTIVE': return { text: 'نشط', color: '#00E676' };
    case 'PENDING': return { text: 'معلق', color: '#FFB74D' };
    case 'SUSPENDED': return { text: 'موقوف', color: '#FF5252' };
    default: return { text: status, color: '#9E9E9E' };
  }
}

function getSignalStatusLabel(status: string): { text: string; color: string } {
  switch (status) {
    case 'ACTIVE': return { text: 'نشطة', color: '#00E676' };
    case 'HIT_SL': return { text: 'ضرب وقف', color: '#FF5252' };
    case 'HIT_TP': return { text: 'ضرب هدف', color: '#00E676' };
    case 'CANCELLED': return { text: 'ملغاة', color: '#9E9E9E' };
    default: return { text: status, color: '#9E9E9E' };
  }
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

  // Check for saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('fx_token');
    if (savedToken) {
      fetchUser(savedToken);
    } else {
      setLoading(false);
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
      const data = await API.post('/api/auth/login', { email: loginEmail, password: loginPassword });
      if (data.token) {
        await fetchUser(data.token);
        toast({ title: 'نجاح', description: 'تم تسجيل الدخول بنجاح' });
      } else {
        toast({ title: 'خطأ', description: data.error });
        if (data.code === 'PENDING') {
          setOtpEmail(loginEmail);
          setView('otp');
        }
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل تسجيل الدخول' });
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
        toast({ title: 'خطأ', description: data.error });
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل التسجيل' });
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
        await fetchUser(data.token);
        toast({ title: 'نجاح', description: 'تم تفعيل الحساب بنجاح' });
      } else {
        toast({ title: 'خطأ', description: data.error });
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل التحقق' });
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
        toast({ title: 'خطأ', description: data.error });
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل إعادة الإرسال' });
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
      await API.put(`/api/admin/signals/${signalId}`, update, token);
      fetchAdminSignals();
      toast({ title: 'نجاح', description: 'تم تحديث الإشارة' });
    } catch {
      toast({ title: 'خطأ', description: 'فشل تحديث الإشارة' });
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

  // ==================== Loading Screen ====================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f1117' }}>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-center"
        >
          <div className="text-4xl font-bold" style={{ color: '#FFD700' }}>FX PRO</div>
          <div className="text-sm mt-2" style={{ color: '#9E9E9E' }}>جاري التحميل...</div>
        </motion.div>
      </div>
    );
  }

  // ==================== Signal Card Component ====================
  const SignalCard = ({ signal, isAdmin }: { signal: SignalInfo; isAdmin?: boolean }) => {
    const isExpanded = expandedSignal === signal.id;
    const targets: number[] = JSON.parse(signal.targets || '[]');
    const isBuy = signal.type === 'BUY';
    const statusInfo = getSignalStatusLabel(signal.status);
    const planInfo = getPlanLabel(signal.plan || '');

    useEffect(() => {
      if (!isAdmin && !signal.isRead && signal.id) {
        markSignalRead(signal.id);
      }
    }, [signal.id, signal.isRead, isAdmin]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-3"
      >
        <div
          className="rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
          style={{
            backgroundColor: '#1a1d29',
            border: `1px solid ${isBuy ? 'rgba(0,230,118,0.2)' : 'rgba(255,82,82,0.2)'}`,
            borderRight: `3px solid ${isBuy ? '#00E676' : '#FF5252'}`,
          }}
          onClick={() => setExpandedSignal(isExpanded ? null : signal.id)}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-1 rounded-md text-xs font-bold"
                style={{
                  backgroundColor: isBuy ? 'rgba(0,230,118,0.15)' : 'rgba(255,82,82,0.15)',
                  color: isBuy ? '#00E676' : '#FF5252',
                }}
              >
                {isBuy ? '🟢 شراء' : '🔴 بيع'}
              </span>
              <span className="font-bold text-sm" style={{ color: '#E0E0E0' }}>{signal.pair}</span>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <span
                  className="px-2 py-1 rounded-md text-xs"
                  style={{
                    backgroundColor: `${statusInfo.color}22`,
                    color: statusInfo.color,
                  }}
                >
                  {statusInfo.text}
                </span>
              )}
              <span className="text-xs" style={{ color: '#FFD700' }}>
                {'⭐'.repeat(signal.stars)}
              </span>
              {!isAdmin && !signal.isRead && (
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              )}
            </div>
          </div>

          {/* Price Info */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-xs" style={{ color: '#9E9E9E' }}>سعر الدخول</div>
              <div className="font-mono text-sm font-bold" style={{ color: '#E0E0E0' }}>{signal.entry}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: '#9E9E9E' }}>وقف الخسارة</div>
              <div className="font-mono text-sm font-bold" style={{ color: '#FF5252' }}>{signal.stopLoss}</div>
              <div className="text-xs" style={{ color: '#9E9E9E' }}>({signal.stopLossType})</div>
            </div>
          </div>

          {/* Targets Preview */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="mb-3">
                <div className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: '#FFD700' }}>
                  <Target size={12} /> الأهداف ({signal.currentTP}/{signal.totalTargets})
                </div>
                <div className="space-y-1">
                  {targets.map((t, i) => {
                    const isHit = i < signal.currentTP;
                    const isNext = i === signal.currentTP && signal.status === 'ACTIVE';
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between px-2 py-1 rounded-md text-xs"
                        style={{
                          backgroundColor: isHit ? 'rgba(0,230,118,0.1)' : isNext ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                        }}
                      >
                        <span style={{ color: isHit ? '#00E676' : isNext ? '#FFD700' : '#9E9E9E' }}>
                          {isHit ? '✅' : isNext ? '⏳' : '⬜'} هدف {i + 1}
                        </span>
                        <span className="font-mono" style={{ color: isHit ? '#00E676' : '#E0E0E0' }}>{t.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Extra Details */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-xs" style={{ color: '#9E9E9E' }}>💰 الحجم</div>
                  <div className="text-sm" style={{ color: '#E0E0E0' }}>{signal.lotSize} لوت</div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: '#9E9E9E' }}>⚠️ المخاطرة</div>
                  <div className="text-sm" style={{ color: '#FFB74D' }}>${signal.riskAmount}</div>
                </div>
              </div>

              {signal.notes && (
                <div className="p-2 rounded-md mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-xs" style={{ color: '#9E9E9E' }}>📝 ملاحظات</div>
                  <div className="text-xs mt-1" style={{ color: '#E0E0E0' }}>{signal.notes}</div>
                </div>
              )}

              {/* Admin Actions */}
              {isAdmin && signal.status === 'ACTIVE' && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleUpdateSignal(signal.id, { currentTP: signal.currentTP + 1 }); }}
                    disabled={signal.currentTP >= signal.totalTargets}
                    className="text-xs"
                    style={{ backgroundColor: 'rgba(0,230,118,0.15)', color: '#00E676', border: 'none' }}
                  >
                    تحديث هدف+
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleUpdateSignal(signal.id, { status: 'HIT_SL' }); }}
                    className="text-xs"
                    style={{ backgroundColor: 'rgba(255,82,82,0.15)', color: '#FF5252', border: 'none' }}
                  >
                    ضرب وقف
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleUpdateSignal(signal.id, { status: 'CANCELLED' }); }}
                    className="text-xs"
                    style={{ backgroundColor: 'rgba(158,158,158,0.15)', color: '#9E9E9E', border: 'none' }}
                  >
                    إلغاء
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleDeleteSignal(signal.id); }}
                    className="text-xs"
                    style={{ backgroundColor: 'rgba(255,82,82,0.15)', color: '#FF5252', border: 'none' }}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs flex items-center gap-1" style={{ color: '#9E9E9E' }}>
              <Clock size={10} /> {formatTimeAgo(signal.createdAt)}
            </span>
            {isExpanded ? <ChevronUp size={14} style={{ color: '#9E9E9E' }} /> : <ChevronDown size={14} style={{ color: '#9E9E9E' }} />}
          </div>
        </div>
      </motion.div>
    );
  };

  // ==================== Landing View ====================
  if (view === 'landing') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0f1117' }}>
        {/* Hero */}
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(255,215,0,0.08) 0%, transparent 70%)',
            }}
          />
          <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mb-6" style={{ backgroundColor: 'rgba(255,215,0,0.1)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.2)' }}>
                <Zap size={14} /> الإصدار 1.10
              </div>
              <h1 className="text-4xl sm:text-6xl font-black mb-4" style={{ color: '#FFD700' }}>
                FOREXYEMENI-PRO
              </h1>
              <p className="text-lg sm:text-xl mb-2" style={{ color: '#E0E0E0' }}>
                نظام إشارات التداول الاحترافي
              </p>
              <p className="text-sm mb-8" style={{ color: '#9E9E9E' }}>
                إشارات تداول دقيقة مبنيّة على تحليل فني متقدم - جولد / فوركس
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  className="font-bold text-base px-8"
                  style={{ backgroundColor: '#FFD700', color: '#0f1117' }}
                  onClick={() => setView('login')}
                >
                  تسجيل دخول
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="font-bold text-base px-8"
                  style={{ borderColor: '#FFD700', color: '#FFD700' }}
                  onClick={() => setView('register')}
                >
                  إنشاء حساب
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Target size={24} />, title: 'إشارات دقيقة', desc: 'تحليل فني متقدم لأزواج العملات والذهب' },
              { icon: <Shield size={24} />, title: 'إدارة مخاطر', desc: 'وقف خسارة وأهداف محددة لكل إشارة' },
              { icon: <BarChart3 size={24} />, title: 'تتبع فوري', desc: 'متابعة حالة الإشارات في الوقت الحقيقي' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                className="p-6 rounded-xl text-center"
                style={{ backgroundColor: '#1a1d29', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(255,215,0,0.1)', color: '#FFD700' }}>
                  {f.icon}
                </div>
                <h3 className="font-bold mb-1" style={{ color: '#E0E0E0' }}>{f.title}</h3>
                <p className="text-xs" style={{ color: '#9E9E9E' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'إشارة يومية', value: '5+' },
              { label: 'نسبة النجاح', value: '85%' },
              { label: 'مستخدم نشط', value: '500+' },
              { label: 'زوج عملات', value: '20+' },
            ].map((s, i) => (
              <div key={i} className="text-center p-4 rounded-xl" style={{ backgroundColor: '#1a1d29' }}>
                <div className="text-2xl font-black" style={{ color: '#FFD700' }}>{s.value}</div>
                <div className="text-xs mt-1" style={{ color: '#9E9E9E' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-xs" style={{ color: '#9E9E9E', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p>© 2024 FOREXYEMENI-PRO v1.10 - جميع الحقوق محفوظة</p>
        </div>
      </div>
    );
  }

  // ==================== Login View ====================
  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0f1117' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black mb-2" style={{ color: '#FFD700' }}>FX PRO</h1>
            <p className="text-sm" style={{ color: '#9E9E9E' }}>تسجيل الدخول</p>
          </div>
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#1a1d29', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="space-y-4">
              <div>
                <Label className="text-xs mb-1 block" style={{ color: '#9E9E9E' }}>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="text-sm"
                  style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block" style={{ color: '#9E9E9E' }}>كلمة المرور</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="text-sm"
                    style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}
                    dir="ltr"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                    style={{ color: '#9E9E9E' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button
                className="w-full font-bold"
                style={{ backgroundColor: '#FFD700', color: '#0f1117' }}
                onClick={handleLogin}
              >
                تسجيل الدخول
              </Button>
            </div>
            <div className="text-center mt-4">
              <button
                onClick={() => setView('register')}
                className="text-xs"
                style={{ color: '#FFD700' }}
              >
                ليس لديك حساب؟ إنشاء حساب جديد
              </button>
            </div>
            <div className="text-center mt-2">
              <button
                onClick={() => setView('landing')}
                className="text-xs flex items-center gap-1 mx-auto"
                style={{ color: '#9E9E9E' }}
              >
                <ArrowLeft size={12} /> العودة
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ==================== Register View ====================
  if (view === 'register') {
    const strength = getPasswordStrength(regPassword);
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0f1117' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black mb-2" style={{ color: '#FFD700' }}>FX PRO</h1>
            <p className="text-sm" style={{ color: '#9E9E9E' }}>إنشاء حساب جديد</p>
          </div>
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#1a1d29', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="space-y-4">
              <div>
                <Label className="text-xs mb-1 block" style={{ color: '#9E9E9E' }}>الاسم الكامل</Label>
                <Input
                  placeholder="أدخل اسمك"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="text-sm"
                  style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block" style={{ color: '#9E9E9E' }}>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="text-sm"
                  style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block" style={{ color: '#9E9E9E' }}>كلمة المرور</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="text-sm"
                    style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}
                    dir="ltr"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                    style={{ color: '#9E9E9E' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {regPassword && (
                  <div className="mt-2">
                    <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#252836' }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: strength.width, backgroundColor: strength.color }}
                      />
                    </div>
                    <div className="text-xs mt-1" style={{ color: strength.color }}>{strength.level}</div>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs mb-1 block" style={{ color: '#9E9E9E' }}>تأكيد كلمة المرور</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="text-sm"
                  style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}
                  dir="ltr"
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                />
              </div>
              <Button
                className="w-full font-bold"
                style={{ backgroundColor: '#FFD700', color: '#0f1117' }}
                onClick={handleRegister}
              >
                إنشاء حساب
              </Button>
            </div>
            <div className="text-center mt-4">
              <button
                onClick={() => setView('login')}
                className="text-xs"
                style={{ color: '#FFD700' }}
              >
                لديك حساب؟ تسجيل الدخول
              </button>
            </div>
            <div className="text-center mt-2">
              <button
                onClick={() => setView('landing')}
                className="text-xs flex items-center gap-1 mx-auto"
                style={{ color: '#9E9E9E' }}
              >
                <ArrowLeft size={12} /> العودة
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ==================== OTP Verification View ====================
  if (view === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0f1117' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(255,215,0,0.1)' }}>
              <Shield size={32} style={{ color: '#FFD700' }} />
            </div>
            <h1 className="text-2xl font-black mb-2" style={{ color: '#E0E0E0' }}>تفعيل الحساب</h1>
            <p className="text-sm" style={{ color: '#9E9E9E' }}>
              أدخل كود التفعيل المكون من 6 أرقام المرسل إلى
            </p>
            <p className="text-sm font-bold mt-1" style={{ color: '#FFD700' }} dir="ltr">{otpEmail}</p>
          </div>
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#1a1d29', border: '1px solid rgba(255,255,255,0.06)' }}>
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
            <Button
              className="w-full font-bold mb-4"
              style={{ backgroundColor: '#FFD700', color: '#0f1117' }}
              onClick={handleVerifyOTP}
              disabled={otpValue.length !== 6}
            >
              تحقق من الكود
            </Button>
            <div className="text-center">
              {otpCountdown > 0 ? (
                <span className="text-xs" style={{ color: '#9E9E9E' }}>
                  إعادة الإرسال بعد <span style={{ color: '#FFD700' }}>{otpCountdown}</span> ثانية
                </span>
              ) : (
                <button onClick={handleResendOTP} className="text-xs font-bold" style={{ color: '#FFD700' }}>
                  إعادة إرسال الكود
                </button>
              )}
            </div>
            <div className="text-center mt-4">
              <button
                onClick={() => setView('login')}
                className="text-xs flex items-center gap-1 mx-auto"
                style={{ color: '#9E9E9E' }}
              >
                <ArrowLeft size={12} /> العودة لتسجيل الدخول
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ==================== Pending Approval View ====================
  if (view === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0f1117' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(255,183,77,0.1)' }}>
            <Clock size={40} style={{ color: '#FFB74D' }} />
          </div>
          <h1 className="text-2xl font-black mb-3" style={{ color: '#E0E0E0' }}>بانتظار الموافقة</h1>
          <p className="text-sm mb-6" style={{ color: '#9E9E9E' }}>
            حسابك قيد المراجعة من قبل الإدارة. سيتم تفعيله قريباً.
          </p>
          <Button
            variant="outline"
            onClick={() => setView('login')}
            style={{ borderColor: '#FFD700', color: '#FFD700' }}
          >
            تسجيل الدخول
          </Button>
        </motion.div>
      </div>
    );
  }

  // ==================== User Dashboard ====================
  if (view === 'user-dashboard' && user) {
    const planInfo = getPlanLabel(user.plan);
    const trialDaysLeft = user.trialEndsAt ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000)) : 0;

    const renderHomeTab = () => (
      <div className="space-y-4">
        {/* Welcome */}
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.02))', border: '1px solid rgba(255,215,0,0.15)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,215,0,0.15)' }}>
              <User size={24} style={{ color: '#FFD700' }} />
            </div>
            <div>
              <h2 className="font-bold" style={{ color: '#E0E0E0' }}>مرحباً، {user.name}</h2>
              <p className="text-xs" style={{ color: '#9E9E9E' }}>أهلاً بك في FOREXYEMENI-PRO</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a1d29' }}>
            <div className="text-xs mb-1" style={{ color: '#9E9E9E' }}>الخطة</div>
            <div className="font-bold" style={{ color: planInfo.color }}>{planInfo.text}</div>
            {user.plan === 'TRIAL' && trialDaysLeft > 0 && (
              <div className="text-xs mt-1" style={{ color: '#FFB74D' }}>متبقي {trialDaysLeft} يوم</div>
            )}
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a1d29' }}>
            <div className="text-xs mb-1" style={{ color: '#9E9E9E' }}>الإشارات النشطة</div>
            <div className="font-bold" style={{ color: '#00E676' }}>{signals.filter(s => s.status === 'ACTIVE').length}</div>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a1d29' }}>
            <div className="text-xs mb-1" style={{ color: '#9E9E9E' }}>الرصيد</div>
            <div className="font-bold" style={{ color: '#E0E0E0' }}>${user.accBalance}</div>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a1d29' }}>
            <div className="text-xs mb-1" style={{ color: '#9E9E9E' }}>نسبة المخاطرة</div>
            <div className="font-bold" style={{ color: '#FFB74D' }}>{user.riskPct}%</div>
          </div>
        </div>

        {/* Recent Signals */}
        <div>
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#E0E0E0' }}>
            <Signal size={16} /> آخر الإشارات
          </h3>
          {signalsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 rounded-xl" style={{ backgroundColor: '#1a1d29' }} />
              ))}
            </div>
          ) : signals.length === 0 ? (
            <div className="text-center py-8 rounded-xl" style={{ backgroundColor: '#1a1d29' }}>
              <Signal size={32} style={{ color: '#9E9E9E' }} className="mx-auto mb-2" />
              <p className="text-sm" style={{ color: '#9E9E9E' }}>لا توجد إشارات حالياً</p>
            </div>
          ) : (
            signals.slice(0, 5).map(s => <SignalCard key={s.id} signal={s} />)
          )}
        </div>
      </div>
    );

    const renderSignalsTab = () => (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2" style={{ color: '#E0E0E0' }}>
            <Signal size={16} /> الإشارات النشطة
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchSignals}
            style={{ color: '#FFD700' }}
          >
            <RefreshCw size={14} />
          </Button>
        </div>
        {signalsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-28 rounded-xl" style={{ backgroundColor: '#1a1d29' }} />
            ))}
          </div>
        ) : signals.length === 0 ? (
          <div className="text-center py-16 rounded-xl" style={{ backgroundColor: '#1a1d29' }}>
            <Target size={40} style={{ color: '#9E9E9E' }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: '#9E9E9E' }}>لا توجد إشارات نشطة حالياً</p>
            <p className="text-xs mt-1" style={{ color: '#9E9E9E' }}>سيتم إضافة إشارات جديدة قريباً</p>
          </div>
        ) : (
          signals.map(s => <SignalCard key={s.id} signal={s} />)
        )}
      </div>
    );

    const renderSettingsTab = () => (
      <div className="space-y-4">
        <h3 className="font-bold flex items-center gap-2" style={{ color: '#E0E0E0' }}>
          <Settings size={16} /> إعدادات الحساب
        </h3>
        <div className="p-4 rounded-xl space-y-4" style={{ backgroundColor: '#1a1d29' }}>
          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#9E9E9E' }}>حجم اللوت الافتراضي</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.01"
              value={userSettings.lotSize}
              onChange={(e) => setUserSettings({ ...userSettings, lotSize: e.target.value })}
              className="text-sm"
              style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}
              dir="ltr"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#9E9E9E' }}>رصيد الحساب ($)</Label>
            <Input
              type="number"
              placeholder="100"
              value={userSettings.accBalance}
              onChange={(e) => setUserSettings({ ...userSettings, accBalance: e.target.value })}
              className="text-sm"
              style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}
              dir="ltr"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block" style={{ color: '#9E9E9E' }}>نسبة المخاطرة (%)</Label>
            <Input
              type="number"
              min="1"
              max="100"
              placeholder="5"
              value={userSettings.riskPct}
              onChange={(e) => setUserSettings({ ...userSettings, riskPct: e.target.value })}
              className="text-sm"
              style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}
              dir="ltr"
            />
          </div>
          <Button
            className="w-full font-bold"
            style={{ backgroundColor: '#FFD700', color: '#0f1117' }}
            onClick={() => {
              toast({ title: 'نجاح', description: 'تم حفظ الإعدادات' });
            }}
          >
            حفظ الإعدادات
          </Button>
        </div>
      </div>
    );

    const renderProfileTab = () => (
      <div className="space-y-4">
        <h3 className="font-bold flex items-center gap-2" style={{ color: '#E0E0E0' }}>
          <User size={16} /> الملف الشخصي
        </h3>
        <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a1d29' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black" style={{ backgroundColor: 'rgba(255,215,0,0.15)', color: '#FFD700' }}>
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold" style={{ color: '#E0E0E0' }}>{user.name}</h3>
              <p className="text-xs" style={{ color: '#9E9E9E' }} dir="ltr">{user.email}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: '#252836' }}>
              <span className="text-xs" style={{ color: '#9E9E9E' }}>الخطة</span>
              <span className="text-sm font-bold" style={{ color: planInfo.color }}>{planInfo.text}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: '#252836' }}>
              <span className="text-xs" style={{ color: '#9E9E9E' }}>الحالة</span>
              <span className="text-sm font-bold" style={{ color: '#00E676' }}>نشط</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: '#252836' }}>
              <span className="text-xs" style={{ color: '#9E9E9E' }}>تاريخ التسجيل</span>
              <span className="text-xs" style={{ color: '#E0E0E0' }}>{new Date(user.createdAt).toLocaleDateString('ar')}</span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          style={{ borderColor: '#FF5252', color: '#FF5252' }}
          onClick={handleLogout}
        >
          <LogOut size={16} className="ml-2" /> تسجيل الخروج
        </Button>
      </div>
    );

    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0f1117' }}>
        {/* Header */}
        <header className="sticky top-0 z-50 px-4 py-3" style={{ backgroundColor: 'rgba(15,17,23,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <h1 className="text-lg font-black" style={{ color: '#FFD700' }}>FX PRO</h1>
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded-md text-xs font-bold"
                style={{ backgroundColor: `${planInfo.color}22`, color: planInfo.color }}
              >
                {planInfo.text}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-20">
          <AnimatePresence mode="wait">
            {userTab === 'home' && <motion.div key="home" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>{renderHomeTab()}</motion.div>}
            {userTab === 'signals' && <motion.div key="signals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>{renderSignalsTab()}</motion.div>}
            {userTab === 'settings' && <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>{renderSettingsTab()}</motion.div>}
            {userTab === 'profile' && <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>{renderProfileTab()}</motion.div>}
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ backgroundColor: 'rgba(26,29,41,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
          <div className="max-w-lg mx-auto flex">
            {[
              { id: 'home' as UserTab, icon: <Home size={20} />, label: 'الرئيسية' },
              { id: 'signals' as UserTab, icon: <Signal size={20} />, label: 'الإشارات' },
              { id: 'settings' as UserTab, icon: <Settings size={20} />, label: 'الإعدادات' },
              { id: 'profile' as UserTab, icon: <User size={20} />, label: 'الحساب' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setUserTab(tab.id)}
                className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
                style={{ color: userTab === tab.id ? '#FFD700' : '#9E9E9E' }}
              >
                {tab.icon}
                <span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
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
        <div className="space-y-4">
          <div className="p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.02))', border: '1px solid rgba(255,215,0,0.15)' }}>
            <h2 className="font-bold text-lg mb-1" style={{ color: '#FFD700' }}>لوحة التحكم</h2>
            <p className="text-xs" style={{ color: '#9E9E9E' }}>مرحباً، {user.name} - المدير</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a1d29' }}>
              <Users size={20} style={{ color: '#2196F3' }} className="mb-2" />
              <div className="text-2xl font-black" style={{ color: '#E0E0E0' }}>{totalUsers}</div>
              <div className="text-xs" style={{ color: '#9E9E9E' }}>إجمالي المستخدمين</div>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a1d29' }}>
              <Signal size={20} style={{ color: '#00E676' }} className="mb-2" />
              <div className="text-2xl font-black" style={{ color: '#E0E0E0' }}>{activeSignals}</div>
              <div className="text-xs" style={{ color: '#9E9E9E' }}>إشارات نشطة</div>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a1d29' }}>
              <Award size={20} style={{ color: '#FFD700' }} className="mb-2" />
              <div className="text-2xl font-black" style={{ color: '#E0E0E0' }}>{planCounts['VIP'] || 0}</div>
              <div className="text-xs" style={{ color: '#9E9E9E' }}>مشتركين VIP</div>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a1d29' }}>
              <Activity size={20} style={{ color: '#FFB74D' }} className="mb-2" />
              <div className="text-2xl font-black" style={{ color: '#E0E0E0' }}>{adminSignals.length}</div>
              <div className="text-xs" style={{ color: '#9E9E9E' }}>إجمالي الإشارات</div>
            </div>
          </div>

          {/* Plan Distribution */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a1d29' }}>
            <h3 className="font-bold text-sm mb-3" style={{ color: '#E0E0E9' }}>توزيع الخطط</h3>
            <div className="space-y-2">
              {['TRIAL', 'BASIC', 'PRO', 'VIP'].map(plan => {
                const count = planCounts[plan] || 0;
                const total = totalUsers || 1;
                const pct = Math.round((count / total) * 100);
                const info = getPlanLabel(plan);
                return (
                  <div key={plan}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: info.color }}>{info.text}</span>
                      <span style={{ color: '#9E9E9E' }}>{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#252836' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: info.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    };

    const renderAdminSignals = () => (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2" style={{ color: '#E0E0E0' }}>
            <Signal size={16} /> إدارة الإشارات
          </h3>
          <Dialog open={showCreateSignal} onOpenChange={setShowCreateSignal}>
            <DialogTrigger asChild>
              <Button size="sm" style={{ backgroundColor: '#FFD700', color: '#0f1117' }}>
                <Plus size={14} className="ml-1" /> إشارة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1a1d29', border: '1px solid rgba(255,255,255,0.08)' }}>
              <DialogHeader>
                <DialogTitle style={{ color: '#E0E0E0' }}>إنشاء إشارة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block" style={{ color: '#9E9E9E' }}>النوع</Label>
                    <Select value={newSignal.type} onValueChange={(v) => setNewSignal({ ...newSignal, type: v })}>
                      <SelectTrigger style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUY">شراء (BUY)</SelectItem>
                        <SelectItem value="SELL">بيع (SELL)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block" style={{ color: '#9E9E9E' }}>الزوج</Label>
                    <Input
                      placeholder="XAUUSD"
                      value={newSignal.pair}
                      onChange={(e) => setNewSignal({ ...newSignal, pair: e.target.value.toUpperCase() })}
                      className="text-sm"
                      style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block" style={{ color: '#9E9E9E' }}>سعر الدخول</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="2,345.50"
                      value={newSignal.entry}
                      onChange={(e) => setNewSignal({ ...newSignal, entry: e.target.value })}
                      className="text-sm"
                      style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block" style={{ color: '#9E9E9E' }}>وقف الخسارة</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="2,340.00"
                      value={newSignal.stopLoss}
                      onChange={(e) => setNewSignal({ ...newSignal, stopLoss: e.target.value })}
                      className="text-sm"
                      style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block" style={{ color: '#9E9E9E' }}>نوع الوقف</Label>
                    <Select value={newSignal.stopLossType} onValueChange={(v) => setNewSignal({ ...newSignal, stopLossType: v })}>
                      <SelectTrigger style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}>
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
                    <Label className="text-xs mb-1 block" style={{ color: '#9E9E9E' }}>التقييم (نجوم)</Label>
                    <Select value={String(newSignal.stars)} onValueChange={(v) => setNewSignal({ ...newSignal, stars: Number(v) })}>
                      <SelectTrigger style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}>
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
                    <Label className="text-xs" style={{ color: '#9E9E9E' }}>الأهداف</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setNewSignal({ ...newSignal, targets: [...newSignal.targets, ''] })}
                      style={{ color: '#FFD700' }}
                    >
                      <Plus size={12} /> إضافة هدف
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {newSignal.targets.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs w-8" style={{ color: '#9E9E9E' }}>هدف {i + 1}</span>
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
                          className="text-sm flex-1"
                          style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}
                          dir="ltr"
                        />
                        {newSignal.targets.length > 1 && (
                          <button onClick={() => setNewSignal({ ...newSignal, targets: newSignal.targets.filter((_, j) => j !== i) })} style={{ color: '#FF5252' }}>
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block" style={{ color: '#9E9E9E' }}>حجم اللوت</Label>
                    <Input
                      placeholder="0.01"
                      value={newSignal.lotSize}
                      onChange={(e) => setNewSignal({ ...newSignal, lotSize: e.target.value })}
                      className="text-sm"
                      style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block" style={{ color: '#9E9E9E' }}>مبلغ المخاطرة ($)</Label>
                    <Input
                      type="number"
                      placeholder="5.00"
                      value={newSignal.riskAmount}
                      onChange={(e) => setNewSignal({ ...newSignal, riskAmount: e.target.value })}
                      className="text-sm"
                      style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-1 block" style={{ color: '#9E9E9E' }}>ملاحظات</Label>
                  <textarea
                    placeholder="ملاحظات إضافية..."
                    value={newSignal.notes}
                    onChange={(e) => setNewSignal({ ...newSignal, notes: e.target.value })}
                    className="w-full text-sm p-3 rounded-lg resize-none"
                    rows={3}
                    style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}
                  />
                </div>

                <Button
                  className="w-full font-bold"
                  style={{ backgroundColor: '#FFD700', color: '#0f1117' }}
                  onClick={handleCreateSignal}
                >
                  إنشاء الإشارة
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {adminLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" style={{ backgroundColor: '#1a1d29' }} />
            ))}
          </div>
        ) : adminSignals.length === 0 ? (
          <div className="text-center py-16 rounded-xl" style={{ backgroundColor: '#1a1d29' }}>
            <Signal size={40} style={{ color: '#9E9E9E' }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: '#9E9E9E' }}>لا توجد إشارات بعد</p>
          </div>
        ) : (
          adminSignals.map(s => <SignalCard key={s.id} signal={s} isAdmin />)
        )}
      </div>
    );

    const renderAdminUsers = () => (
      <div>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9E9E9E' }} />
            <Input
              placeholder="بحث عن مستخدم..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="text-sm pr-9"
              style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}
            />
          </div>
          <Select value={userStatusFilter} onValueChange={(v) => setUserStatusFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-36" style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}>
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
              <Skeleton key={i} className="h-20 rounded-xl" style={{ backgroundColor: '#1a1d29' }} />
            ))}
          </div>
        ) : adminUsers.length === 0 ? (
          <div className="text-center py-16 rounded-xl" style={{ backgroundColor: '#1a1d29' }}>
            <Users size={40} style={{ color: '#9E9E9E' }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: '#9E9E9E' }}>لا يوجد مستخدمون</p>
          </div>
        ) : (
          <div className="space-y-3">
            {adminUsers.map(u => {
              const statusInfo = getStatusLabel(u.status);
              const planInfo = getPlanLabel(u.plan);
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: '#1a1d29', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-sm" style={{ color: '#E0E0E0' }}>{u.name}</h4>
                      <p className="text-xs" style={{ color: '#9E9E9E' }} dir="ltr">{u.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${statusInfo.color}22`, color: statusInfo.color }}>
                        {statusInfo.text}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${planInfo.color}22`, color: planInfo.color }}>
                        {planInfo.text}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {u.status === 'PENDING' && (
                      <Button size="sm" className="text-xs" style={{ backgroundColor: 'rgba(0,230,118,0.15)', color: '#00E676', border: 'none' }} onClick={() => handleApproveUser(u.id)}>
                        <Check size={12} className="ml-1" /> قبول
                      </Button>
                    )}
                    {u.status === 'ACTIVE' && (
                      <Button size="sm" className="text-xs" style={{ backgroundColor: 'rgba(255,82,82,0.15)', color: '#FF5252', border: 'none' }} onClick={() => handleSuspendUser(u.id)}>
                        <X size={12} className="ml-1" /> تعليق
                      </Button>
                    )}
                    {u.status === 'SUSPENDED' && (
                      <Button size="sm" className="text-xs" style={{ backgroundColor: 'rgba(0,230,118,0.15)', color: '#00E676', border: 'none' }} onClick={() => handleApproveUser(u.id)}>
                        <Check size={12} className="ml-1" /> تفعيل
                      </Button>
                    )}
                    <Select value={u.plan} onValueChange={(v) => handleChangePlan(u.id, v)}>
                      <SelectTrigger className="h-8 w-28 text-xs" style={{ backgroundColor: '#252836', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0' }}>
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
      <div className="space-y-4">
        <h3 className="font-bold flex items-center gap-2" style={{ color: '#E0E0E0' }}>
          <Settings size={16} /> الإعدادات
        </h3>
        <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a1d29' }}>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: '#252836' }}>
              <div>
                <div className="text-sm font-bold" style={{ color: '#E0E0E0' }}>الإصدار</div>
                <div className="text-xs" style={{ color: '#9E9E9E' }}>FOREXYEMENI-PRO v1.10</div>
              </div>
              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(0,230,118,0.15)', color: '#00E676' }}>محدث</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: '#252836' }}>
              <div>
                <div className="text-sm font-bold" style={{ color: '#E0E0E0' }}>قاعدة البيانات</div>
                <div className="text-xs" style={{ color: '#9E9E9E' }}>SQLite - متصلة</div>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-500" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl" style={{ backgroundColor: '#1a1d29' }}>
          <Button
            variant="outline"
            className="w-full"
            style={{ borderColor: '#FF5252', color: '#FF5252' }}
            onClick={handleLogout}
          >
            <LogOut size={16} className="ml-2" /> تسجيل الخروج
          </Button>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0f1117' }}>
        {/* Header */}
        <header className="sticky top-0 z-50 px-4 py-3" style={{ backgroundColor: 'rgba(15,17,23,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-lg font-black" style={{ color: '#FFD700' }}>FX PRO</h1>
            <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255,215,0,0.15)', color: '#FFD700' }}>مدير</span>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="sticky top-[52px] z-40 px-4" style={{ backgroundColor: 'rgba(15,17,23,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
          <div className="max-w-4xl mx-auto flex gap-1 overflow-x-auto">
            {[
              { id: 'home' as AdminTab, icon: <Home size={16} />, label: 'الرئيسية' },
              { id: 'signals' as AdminTab, icon: <Signal size={16} />, label: 'الإشارات' },
              { id: 'users' as AdminTab, icon: <Users size={16} />, label: 'المستخدمين' },
              { id: 'settings' as AdminTab, icon: <Settings size={16} />, label: 'الإعدادات' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors rounded-t-lg"
                style={{
                  color: adminTab === tab.id ? '#FFD700' : '#9E9E9E',
                  borderBottom: adminTab === tab.id ? '2px solid #FFD700' : '2px solid transparent',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 pb-8">
          <AnimatePresence mode="wait">
            {adminTab === 'home' && <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderAdminHome()}</motion.div>}
            {adminTab === 'signals' && <motion.div key="signals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderAdminSignals()}</motion.div>}
            {adminTab === 'users' && <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderAdminUsers()}</motion.div>}
            {adminTab === 'settings' && <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderAdminSettings()}</motion.div>}
          </AnimatePresence>
        </main>
      </div>
    );
  }

  return null;
}
