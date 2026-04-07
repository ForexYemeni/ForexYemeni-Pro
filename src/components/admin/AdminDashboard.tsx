'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Check, X, RefreshCw, Key, TrendingUp } from 'lucide-react';
import type { Signal, LicenseKey } from '@/lib/types';
import SignalForm from './SignalForm';
import LicenseManager from './LicenseManager';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSignal, setEditingSignal] = useState<Signal | null>(null);
  const [activeTab, setActiveTab] = useState<'signals' | 'licenses' | 'create'>('signals');
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
    { id: 'create' as const, label: 'إشارة جديدة', icon: Plus },
    { id: 'licenses' as const, label: 'التراخيص', icon: Key },
  ];

  const statusConfig: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'نشطة', color: 'text-trading-gold' },
    TP_HIT: { label: 'ناجحة', color: 'text-trading-buy' },
    SL_HIT: { label: 'خاسرة', color: 'text-trading-sell' },
    CLOSED: { label: 'مغلقة', color: 'text-gray-400' },
  };

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
