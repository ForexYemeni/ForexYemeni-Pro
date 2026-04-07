'use client';

import { useState } from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import SignalCard from './SignalCard';
import type { Signal } from '@/lib/types';

interface SignalListProps {
  signals: Signal[];
  isLoading: boolean;
  onRefresh: () => void;
}

type FilterType = 'ALL' | 'ACTIVE' | 'TP_HIT' | 'SL_HIT' | 'CLOSED';

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'ALL', label: 'الكل' },
  { value: 'ACTIVE', label: 'نشطة' },
  { value: 'TP_HIT', label: 'ناجحة' },
  { value: 'SL_HIT', label: 'خاسرة' },
  { value: 'CLOSED', label: 'مغلقة' },
];

export default function SignalList({ signals, isLoading, onRefresh }: SignalListProps) {
  const [filter, setFilter] = useState<FilterType>('ALL');

  const filteredSignals = filter === 'ALL' 
    ? signals 
    : signals.filter((s) => s.status === filter);

  const activeSignals = signals.filter((s) => s.status === 'ACTIVE').length;

  return (
    <div>
      {/* Filter Bar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Filter className="h-4 w-4 shrink-0 text-trading-text-secondary" />
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === option.value
                  ? 'bg-trading-gold text-trading-bg'
                  : 'bg-trading-card text-trading-text-secondary hover:bg-trading-card-alt'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          onClick={onRefresh}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-trading-border transition-colors hover:bg-trading-card-alt"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 text-trading-text-secondary ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Active Signals Count */}
      <div className="mb-4 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-trading-buy animate-pulse" />
        <span className="text-sm text-trading-text-secondary">
          {activeSignals} إشارة نشطة حالياً
        </span>
      </div>

      {/* Signals List */}
      <div className="space-y-4 pb-safe">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-trading-border border-t-trading-gold" />
            <p className="text-sm text-trading-text-secondary">جاري تحميل الإشارات...</p>
          </div>
        ) : filteredSignals.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-trading-border bg-trading-card py-12">
            <span className="mb-3 text-4xl">📊</span>
            <p className="text-sm text-trading-text-secondary">
              {filter === 'ALL' ? 'لا توجد إشارات حالياً' : 'لا توجد إشارات بهذه الحالة'}
            </p>
          </div>
        ) : (
          filteredSignals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))
        )}
      </div>
    </div>
  );
}
