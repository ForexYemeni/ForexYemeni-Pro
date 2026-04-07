'use client';

import { useState, useEffect } from 'react';
import { Plus, Copy, Check, RefreshCw, Key } from 'lucide-react';
import type { LicenseKey } from '@/lib/types';

export default function LicenseManager() {
  const [licenses, setLicenses] = useState<LicenseKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState<'BASIC' | 'PRO' | 'VIP'>('PRO');

  const fetchLicenses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/license');
      const data = await res.json();
      setLicenses(data);
    } catch {
      console.error('Failed to fetch licenses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      });
      const data = await res.json();
      if (res.ok) {
        setLicenses((prev) => [data, ...prev]);
      }
    } catch {
      console.error('Failed to create license');
    }
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const planConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    BASIC: { label: 'أساسي', color: 'text-blue-400', bgColor: 'bg-blue-400/15' },
    PRO: { label: 'احترافي', color: 'text-trading-gold', bgColor: 'bg-trading-gold/15' },
    VIP: { label: 'VIP', color: 'text-purple-400', bgColor: 'bg-purple-400/15' },
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-trading-text">
          إدارة التراخيص ({licenses.length})
        </h3>
        <button
          onClick={fetchLicenses}
          className="flex items-center gap-1.5 rounded-lg border border-trading-border px-3 py-1.5 text-xs text-trading-text-secondary hover:bg-trading-card"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      {/* Create New */}
      <div className="mb-4 rounded-xl border border-trading-border bg-trading-card p-4">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold gradient-gold">
          <Key className="h-4 w-4" />
          إنشاء ترخيص جديد
        </h4>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-trading-text-secondary">الخطة</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(planConfig).map(([plan, config]) => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => setNewPlan(plan as 'BASIC' | 'PRO' | 'VIP')}
                  className={`rounded-lg py-2 text-xs font-medium transition-all ${
                    newPlan === plan
                      ? `border-2 ${config.bgColor} ${config.color}`
                      : 'border-2 border-trading-border text-trading-text-secondary'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-l from-trading-gold to-yellow-600 px-6 py-2.5 text-sm font-bold text-trading-bg hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            إنشاء
          </button>
        </div>
      </div>

      {/* License List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-trading-border border-t-trading-gold" />
        </div>
      ) : licenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-trading-border bg-trading-card py-12">
          <Key className="mb-3 h-8 w-8 text-trading-text-secondary" />
          <p className="text-sm text-trading-text-secondary">لا توجد تراخيص</p>
        </div>
      ) : (
        <div className="space-y-2 pb-safe">
          {licenses.map((license) => {
            const planInfo = planConfig[license.plan] || planConfig.BASIC;
            return (
              <div
                key={license.id}
                className="flex items-center justify-between rounded-xl border border-trading-border bg-trading-card p-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg px-2.5 py-1 text-xs font-medium ${planInfo.bgColor} ${planInfo.color}`}>
                    {planInfo.label}
                  </div>
                  <div>
                    <p className="text-sm font-mono font-medium text-trading-text">{license.code}</p>
                    <p className="text-[10px] text-trading-text-secondary">
                      {license.isActive ? '🟢 مفعل' : '🔴 معطل'}
                      {license.usedBy && ` · المستخدم: ${license.usedBy}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(license.code, license.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-trading-border text-trading-text-secondary hover:bg-trading-card-alt"
                >
                  {copiedId === license.id ? (
                    <Check className="h-4 w-4 text-trading-buy" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
