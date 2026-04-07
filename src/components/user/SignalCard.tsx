'use client';

import { useMemo, useState } from 'react';
import { Clock, Star, Shield, TrendingUp, TrendingDown, Target, Layers, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import type { Signal } from '@/lib/types';

interface SignalCardProps {
  signal: Signal;
}

function formatPrice(price: number, pair: string): string {
  if (pair.includes('JPY')) return price.toFixed(2);
  if (pair.includes('XAU')) return price.toFixed(2);
  return price.toFixed(4);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-SA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SignalCard({ signal }: SignalCardProps) {
  const isBuy = signal.type === 'BUY';
  const isActive = signal.status === 'ACTIVE';
  const isCompleted = signal.status !== 'ACTIVE';
  const [expanded, setExpanded] = useState(false);

  const progress = useMemo(() => {
    if (!signal.targets || signal.targets.length === 0) return 0;
    const hit = signal.targets.filter((t) => t.status === 'HIT').length;
    return Math.round((hit / signal.targets.length) * 100);
  }, [signal.targets]);

  const hitCount = useMemo(() => {
    if (!signal.targets) return 0;
    return signal.targets.filter((t) => t.status === 'HIT').length;
  }, [signal.targets]);

  const sortedTargets = useMemo(() => {
    if (!signal.targets) return [];
    return [...signal.targets].sort((a, b) => a.order - b.order);
  }, [signal.targets]);

  const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
    ACTIVE: { label: 'نشطة', color: 'text-trading-gold', bgColor: 'bg-trading-gold/15 border-trading-gold/30', icon: '🔥' },
    TP_HIT: { label: 'ناجحة', color: 'text-trading-buy', bgColor: 'bg-trading-buy/15 border-trading-buy/30', icon: '✅' },
    SL_HIT: { label: 'خاسرة', color: 'text-trading-sell', bgColor: 'bg-trading-sell/15 border-trading-sell/30', icon: '❌' },
    CLOSED: { label: 'مغلقة', color: 'text-trading-text-secondary', bgColor: 'bg-gray-500/15 border-gray-500/30', icon: '🔒' },
  };

  const statusInfo = statusConfig[signal.status] || statusConfig.ACTIVE;

  // ════════════════════════════════════════════
  // بطاقة صغيرة للصفقات المكتملة (ربح/خسارة/مغلقة)
  // ════════════════════════════════════════════
  if (isCompleted && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="signal-card-hover w-full overflow-hidden rounded-xl border border-trading-border bg-trading-card transition-all hover:border-trading-gold/30"
      >
        <div className="flex items-center justify-between p-3">
          {/* الجانب الأيمن: نوع الصفقة + الزوج */}
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                isBuy
                  ? 'bg-trading-buy/15 text-trading-buy'
                  : 'bg-trading-sell/15 text-trading-sell'
              }`}
            >
              {isBuy ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-trading-text">{signal.pair}</h3>
                <span className="text-[10px] text-trading-text-secondary">{signal.timeframe}</span>
              </div>
              <p className="text-[10px] text-trading-text-secondary">{formatDate(signal.createdAt)}</p>
            </div>
          </div>

          {/* الجانب الأيسر: النتيجة + الأهداف + سهم */}
          <div className="flex items-center gap-2.5">
            {/* نجوم */}
            <div className="hidden gap-0.5 sm:flex">
              {Array.from({ length: signal.stars }).map((_, i) => (
                <Star key={i} className="h-2.5 w-2.5 fill-trading-gold text-trading-gold" />
              ))}
            </div>

            {/* حالة الأهداف */}
            {sortedTargets.length > 0 && (
              <div className="flex items-center gap-1">
                <span className={`text-[10px] font-bold ${signal.status === 'TP_HIT' ? 'text-trading-buy' : 'text-trading-text-secondary'}`}>
                  {hitCount}/{sortedTargets.length}
                </span>
                <Target className={`h-3 w-3 ${signal.status === 'TP_HIT' ? 'text-trading-buy' : 'text-trading-text-secondary'}`} />
              </div>
            )}

            {/* شارة النتيجة */}
            <span className={`rounded-md border px-2 py-1 text-[10px] font-bold ${statusInfo.bgColor} ${statusInfo.color}`}>
              {statusInfo.icon} {statusInfo.label}
            </span>

            {/* سهم الفتح */}
            <ChevronDown className="h-4 w-4 text-trading-text-secondary" />
          </div>
        </div>

        {/* شريط تقدم مختصر */}
        {sortedTargets.length > 0 && (
          <div className="h-0.5 bg-trading-bg">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                signal.status === 'TP_HIT' ? 'bg-trading-buy' : signal.status === 'SL_HIT' ? 'bg-trading-sell' : 'bg-trading-text-secondary'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </button>
    );
  }

  // ════════════════════════════════════════════
  // البطاقة الكاملة (نشطة أو مفتوحة)
  // ════════════════════════════════════════════
  return (
    <div
      className={`signal-card-hover overflow-hidden rounded-xl border ${
        isActive ? 'border-trading-gold/30' : 'border-trading-border'
      } bg-trading-card ${isActive ? 'signal-active-pulse' : ''}`}
    >
      {/* Card Header */}
      <div
        className={`flex items-center justify-between p-4 pb-3 ${
          isBuy ? 'bg-gradient-to-l from-trading-buy/5 to-transparent' : 'bg-gradient-to-l from-trading-sell/5 to-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${
              isBuy
                ? 'bg-trading-buy/15 text-trading-buy'
                : 'bg-trading-sell/15 text-trading-sell'
            }`}
          >
            {isBuy ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {isBuy ? 'شراء' : 'بيع'}
          </div>
          <div>
            <h3 className="text-base font-bold text-trading-text sm:text-lg">{signal.pair}</h3>
            <p className="text-[11px] text-trading-text-secondary">{signal.timeframe}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < signal.stars ? 'fill-trading-gold text-trading-gold' : 'text-trading-border'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
              {statusInfo.icon} {statusInfo.label}
            </span>
            {isCompleted && (
              <button
                onClick={() => setExpanded(false)}
                className="flex items-center gap-1 rounded-md border border-trading-border px-2 py-0.5 text-[10px] text-trading-text-secondary transition-colors hover:bg-trading-card-alt"
              >
                <ChevronUp className="h-3 w-3" />
                طيّ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="px-4 py-3">
        {/* Price Info Grid */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <div className="rounded-lg bg-trading-bg/50 p-2.5 text-center">
            <p className="text-[10px] text-trading-text-secondary sm:text-xs">سعر الدخول</p>
            <p className="mt-0.5 text-sm font-bold text-trading-text sm:text-base">
              {formatPrice(signal.entryPrice, signal.pair)}
            </p>
          </div>
          <div className="rounded-lg bg-trading-bg/50 p-2.5 text-center">
            <p className="text-[10px] text-trading-text-secondary sm:text-xs">وقف الخسارة</p>
            <p className="mt-0.5 text-sm font-bold text-trading-sell sm:text-base">
              {formatPrice(signal.stopLoss, signal.pair)}
            </p>
          </div>
          <div className="rounded-lg bg-trading-bg/50 p-2.5 text-center">
            <p className="text-[10px] text-trading-text-secondary sm:text-xs">حجم اللوت</p>
            <p className="mt-0.5 text-sm font-bold text-trading-text sm:text-base">
              {signal.lotSize}
            </p>
          </div>
          <div className="col-span-3 hidden rounded-lg bg-trading-bg/50 p-2.5 text-center sm:block">
            <p className="text-[10px] text-trading-text-secondary sm:text-xs">المخاطرة</p>
            <p className="mt-0.5 text-sm font-bold text-trading-gold sm:text-base">
              ${signal.riskAmount.toFixed(2)} ({signal.riskPercent}%)
            </p>
          </div>
        </div>

        {/* Risk & Lot Info (Mobile) */}
        <div className="mt-2 grid grid-cols-2 gap-2 sm:hidden">
          <div className="rounded-lg bg-trading-bg/50 p-2 text-center">
            <p className="text-[10px] text-trading-text-secondary">المخاطرة</p>
            <p className="text-xs font-bold text-trading-gold">${signal.riskAmount.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-trading-bg/50 p-2 text-center">
            <p className="text-[10px] text-trading-text-secondary">نوع الوقف</p>
            <p className="text-xs font-bold text-trading-text-secondary">{signal.stopLossType}</p>
          </div>
        </div>

        {/* SL Type & Structure (Desktop) */}
        <div className="mt-2 hidden items-center gap-4 sm:flex">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-trading-text-secondary" />
            <span className="text-xs text-trading-text-secondary">وقف: {signal.stopLossType}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-trading-text-secondary" />
            <span className="text-xs text-trading-text-secondary">
              الاتجاه: {signal.mtfTrend === 'BULLISH' ? 'صاعد 🟢' : 'هابط 🔴'}
            </span>
          </div>
          {signal.lotType && (
            <span className="text-xs text-trading-text-secondary">لوت {signal.lotType}</span>
          )}
        </div>

        {/* Indicator Tags */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {signal.tpMode && signal.tpMode !== 'ATR' && (
            <span className="flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400">
              <Layers className="h-3 w-3" />{signal.tpMode}
            </span>
          )}
          {signal.alertStyle === 'enhanced' && (
            <span className="flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-400">
              <Zap className="h-3 w-3" />محسّن
            </span>
          )}
          {signal.contractSize && signal.contractSize !== 100 && (
            <span className="rounded-md bg-gray-500/10 px-2 py-0.5 text-[10px] text-gray-400">
              عقد: {signal.contractSize}
            </span>
          )}
        </div>

        {/* ═══════ Professional Targets Section ═══════ */}
        {sortedTargets.length > 0 && (
          <div className="mt-4">
            {/* Section Title + Progress */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-trading-gold" />
                <span className="text-sm font-bold text-trading-text">الأهداف</span>
                <span className="rounded-full bg-trading-gold/15 px-2.5 py-0.5 text-[11px] font-bold text-trading-gold">
                  {signal.tpReached}/{sortedTargets.length}
                </span>
              </div>
              <span className={`text-sm font-bold ${progress === 100 ? 'text-trading-buy' : 'text-trading-gold'}`}>
                {progress}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-trading-bg">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  progress === 100 ? 'bg-trading-buy' : 'bg-gradient-to-l from-trading-gold to-amber-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Targets Grid - 2 columns on mobile, 5 on desktop */}
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
              {sortedTargets.map((target) => {
                const isHit = target.status === 'HIT';
                return (
                  <div
                    key={target.id}
                    className={`relative overflow-hidden rounded-lg border p-2.5 transition-all duration-300 ${
                      isHit
                        ? 'border-trading-buy/30 bg-trading-buy/10'
                        : 'border-trading-border/50 bg-trading-bg/40'
                    }`}
                  >
                    {isHit && (
                      <div className="absolute inset-0 bg-gradient-to-br from-trading-buy/5 to-transparent" />
                    )}

                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                            isHit
                              ? 'bg-trading-buy text-white'
                              : 'bg-trading-border/80 text-trading-text-secondary'
                          }`}
                        >
                          {target.order}
                        </span>
                      </div>

                      {isHit && (
                        <span className="text-trading-buy">✓</span>
                      )}
                    </div>

                    <p className={`mt-1.5 text-[13px] font-bold ${isHit ? 'text-trading-buy' : 'text-trading-text'}`}>
                      {formatPrice(target.price, signal.pair)}
                    </p>

                    <p className="mt-0.5 text-[10px] text-trading-text-secondary">
                      {target.percentage}%
                    </p>

                    <div className="mt-1.5">
                      <span
                        className={`inline-block w-full rounded-md px-1.5 py-0.5 text-center text-[9px] font-medium ${
                          isHit
                            ? 'bg-trading-buy/20 text-trading-buy'
                            : 'bg-trading-border/40 text-trading-text-secondary'
                        }`}
                      >
                        {isHit ? '✓ تم التحقيق' : '⏳ انتظار'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between border-t border-trading-border pt-2">
          <div className="flex items-center gap-1.5 text-trading-text-secondary">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-[11px]">{formatDate(signal.createdAt)}</span>
          </div>
          <span className="text-[11px] text-trading-text-secondary">ForexYemeni Pro</span>
        </div>
      </div>
    </div>
  );
}
