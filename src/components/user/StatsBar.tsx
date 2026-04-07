'use client';

import { TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';
import type { Stats } from '@/lib/types';

interface StatsBarProps {
  stats: Stats;
  isLoading: boolean;
}

export default function StatsBar({ stats, isLoading }: StatsBarProps) {
  const statCards = [
    {
      label: 'نسبة الفوز',
      value: isLoading ? '--' : `${stats.winRate}%`,
      icon: Target,
      color: 'text-trading-gold',
      bgColor: 'bg-trading-gold/10',
    },
    {
      label: 'الصفقات الرابحة',
      value: isLoading ? '--' : stats.winTrades.toString(),
      icon: TrendingUp,
      color: 'text-trading-buy',
      bgColor: 'bg-trading-buy/10',
    },
    {
      label: 'الصفقات الخاسرة',
      value: isLoading ? '--' : stats.lossTrades.toString(),
      icon: TrendingDown,
      color: 'text-trading-sell',
      bgColor: 'bg-trading-sell/10',
    },
    {
      label: 'الإشارات النشطة',
      value: isLoading ? '--' : stats.activeSignals.toString(),
      icon: Zap,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-trading-border bg-trading-card p-3 sm:p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] text-trading-text-secondary sm:text-xs">{stat.label}</span>
            <div className={`rounded-lg p-1.5 ${stat.bgColor}`}>
              <stat.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${stat.color}`} />
            </div>
          </div>
          <p className={`text-lg font-bold sm:text-xl ${stat.color}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
