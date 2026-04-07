'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ArrowRight, Star } from 'lucide-react';
import type { Signal } from '@/lib/types';

interface SignalFormProps {
  editingSignal: Signal | null;
  onCreated: () => void;
  onCancel: () => void;
}

interface TargetInput {
  order: number;
  price: string;
  percentage: string;
}

export default function SignalForm({ editingSignal, onCreated, onCancel }: SignalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [pair, setPair] = useState('XAUUSD');
  const [timeframe, setTimeframe] = useState('M15');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [stopLossType, setStopLossType] = useState('ATR');
  const [riskPercent, setRiskPercent] = useState('5');
  const [riskAmount, setRiskAmount] = useState('5');
  const [lotSize, setLotSize] = useState('0.10');
  const [lotType, setLotType] = useState('قياسي');
  const [balance, setBalance] = useState('100');
  const [stars, setStars] = useState(1);
  const [mtfTrend, setMtfTrend] = useState('BULLISH');
  const [smcStructure, setSmcStructure] = useState('BULLISH');
  const [targets, setTargets] = useState<TargetInput[]>([
    { order: 1,  price: '', percentage: '10' },
    { order: 2,  price: '', percentage: '10' },
    { order: 3,  price: '', percentage: '10' },
    { order: 4,  price: '', percentage: '10' },
    { order: 5,  price: '', percentage: '10' },
    { order: 6,  price: '', percentage: '10' },
    { order: 7,  price: '', percentage: '10' },
    { order: 8,  price: '', percentage: '10' },
    { order: 9,  price: '', percentage: '10' },
    { order: 10, price: '', percentage: '10' },
  ]);

  useEffect(() => {
    if (editingSignal) {
      setType(editingSignal.type as 'BUY' | 'SELL');
      setPair(editingSignal.pair);
      setTimeframe(editingSignal.timeframe);
      setEntryPrice(editingSignal.entryPrice.toString());
      setStopLoss(editingSignal.stopLoss.toString());
      setStopLossType(editingSignal.stopLossType);
      setRiskPercent(editingSignal.riskPercent.toString());
      setRiskAmount(editingSignal.riskAmount.toString());
      setLotSize(editingSignal.lotSize.toString());
      setLotType(editingSignal.lotType);
      setBalance(editingSignal.balance.toString());
      setStars(editingSignal.stars);
      setMtfTrend(editingSignal.mtfTrend);
      setSmcStructure(editingSignal.smcStructure);
      setTargets(
        editingSignal.targets.map((t) => ({
          order: t.order,
          price: t.price.toString(),
          percentage: t.percentage.toString(),
        }))
      );
    }
  }, [editingSignal]);

  const addTarget = () => {
    setTargets([
      ...targets,
      {
        order: targets.length + 1,
        price: '',
        percentage: '',
      },
    ]);
  };

  const removeTarget = (index: number) => {
    if (targets.length <= 1) return;
    setTargets(targets.filter((_, i) => i !== index).map((t, i) => ({ ...t, order: i + 1 })));
  };

  const updateTarget = (index: number, field: keyof TargetInput, value: string) => {
    const newTargets = [...targets];
    newTargets[index] = { ...newTargets[index], [field]: value };
    setTargets(newTargets);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const payload = {
        type,
        pair,
        timeframe,
        entryPrice: parseFloat(entryPrice),
        stopLoss: parseFloat(stopLoss),
        stopLossType,
        riskPercent: parseFloat(riskPercent),
        riskAmount: parseFloat(riskAmount),
        lotSize: parseFloat(lotSize),
        lotType,
        balance: parseFloat(balance),
        stars,
        mtfTrend,
        smcStructure,
        targets: targets.filter((t) => t.price).map((t) => ({
          order: t.order,
          price: parseFloat(t.price),
          percentage: parseFloat(t.percentage) || 0,
        })),
      };

      if (editingSignal) {
        await fetch(`/api/signals/${editingSignal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setSuccess('تم تحديث الإشارة بنجاح');
      } else {
        await fetch('/api/signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setSuccess('تم إنشاء الإشارة بنجاح');
      }

      setTimeout(() => onCreated(), 1000);
    } catch {
      setError('حدث خطأ أثناء حفظ الإشارة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-trading-border bg-trading-bg px-3 py-2.5 text-sm text-trading-text placeholder:text-trading-text-secondary/50 focus:border-trading-gold focus:outline-none focus:ring-1 focus:ring-trading-gold';
  const labelClass = 'mb-1.5 block text-sm font-medium text-trading-text-secondary';

  return (
    <div className="pb-safe">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-trading-text">
          {editingSignal ? 'تعديل الإشارة' : 'إنشاء إشارة جديدة'}
        </h3>
        <button
          onClick={onCancel}
          className="text-sm text-trading-text-secondary hover:text-trading-text"
        >
          إلغاء
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Signal Type & Pair */}
        <div className="rounded-xl border border-trading-border bg-trading-card p-4">
          <h4 className="mb-3 text-sm font-bold gradient-gold">معلومات الإشارة</h4>
          <div className="space-y-3">
            {/* Type */}
            <div>
              <label className={labelClass}>نوع الإشارة</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('BUY')}
                  className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
                    type === 'BUY'
                      ? 'bg-trading-buy/20 border-2 border-trading-buy text-trading-buy'
                      : 'border-2 border-trading-border text-trading-text-secondary hover:border-trading-buy/50'
                  }`}
                >
                  🟢 شراء
                </button>
                <button
                  type="button"
                  onClick={() => setType('SELL')}
                  className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
                    type === 'SELL'
                      ? 'bg-trading-sell/20 border-2 border-trading-sell text-trading-sell'
                      : 'border-2 border-trading-border text-trading-text-secondary hover:border-trading-sell/50'
                  }`}
                >
                  🔴 بيع
                </button>
              </div>
            </div>

            {/* Pair & Timeframe */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>الزوج</label>
                <select
                  value={pair}
                  onChange={(e) => setPair(e.target.value)}
                  className={inputClass}
                >
                  <option value="XAUUSD">XAUUSD (الذهب)</option>
                  <option value="XAGUSD">XAGUSD (الفضة)</option>
                  <option value="EURUSD">EURUSD</option>
                  <option value="GBPUSD">GBPUSD</option>
                  <option value="USDJPY">USDJPY</option>
                  <option value="USDCHF">USDCHF</option>
                  <option value="AUDUSD">AUDUSD</option>
                  <option value="NZDUSD">NZDUSD</option>
                  <option value="USDCAD">USDCAD</option>
                  <option value="GBPJPY">GBPJPY</option>
                  <option value="EURJPY">EURJPY</option>
                  <option value="BTCUSD">BTCUSD</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>الإطار الزمني</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className={inputClass}
                >
                  <option value="M1">M1</option>
                  <option value="M5">M5</option>
                  <option value="M15">M15</option>
                  <option value="M30">M30</option>
                  <option value="H1">H1</option>
                  <option value="H4">H4</option>
                  <option value="D1">D1</option>
                  <option value="W1">W1</option>
                </select>
              </div>
            </div>

            {/* Stars */}
            <div>
              <label className={labelClass}>التقييم</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStars(s)}
                    className="p-0.5"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        s <= stars ? 'fill-trading-gold text-trading-gold' : 'text-trading-border'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Prices & Risk */}
        <div className="rounded-xl border border-trading-border bg-trading-card p-4">
          <h4 className="mb-3 text-sm font-bold gradient-gold">الأسعار والمخاطرة</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>سعر الدخول</label>
                <input
                  type="number"
                  step="any"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="2340.50"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>وقف الخسارة</label>
                <input
                  type="number"
                  step="any"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="2335.20"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>نوع الوقف</label>
                <select
                  value={stopLossType}
                  onChange={(e) => setStopLossType(e.target.value)}
                  className={inputClass}
                >
                  <option value="ATR">ATR</option>
                  <option value="Swing">Swing</option>
                  <option value="FVG">FVG</option>
                  <option value="Manual">يدوي</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>المخاطرة %</label>
                <input
                  type="number"
                  step="any"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>مبلغ المخاطرة $</label>
                <input
                  type="number"
                  step="any"
                  value={riskAmount}
                  onChange={(e) => setRiskAmount(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>حجم اللوت</label>
                <input
                  type="number"
                  step="any"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>نوع اللوت</label>
                <select
                  value={lotType}
                  onChange={(e) => setLotType(e.target.value)}
                  className={inputClass}
                >
                  <option value="قياسي">قياسي</option>
                  <option value="ميكرو">ميكرو</option>
                  <option value="ميني">ميني</option>
                  <option value="نانو">نانو</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>الرصيد $</label>
                <input
                  type="number"
                  step="any"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Trend & Structure */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>اتجاه الأطر المختلفة</label>
                <select
                  value={mtfTrend}
                  onChange={(e) => setMtfTrend(e.target.value)}
                  className={inputClass}
                >
                  <option value="BULLISH">صاعد BULLISH</option>
                  <option value="BEARISH">هابط BEARISH</option>
                  <option value="RANGING">عرضي RANGING</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>هيكل SMC</label>
                <select
                  value={smcStructure}
                  onChange={(e) => setSmcStructure(e.target.value)}
                  className={inputClass}
                >
                  <option value="BULLISH">صاعد BULLISH</option>
                  <option value="BEARISH">هابط BEARISH</option>
                  <option value="CHOCH">CHoCH</option>
                  <option value="BOS">BOS</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Targets */}
        <div className="rounded-xl border border-trading-border bg-trading-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold gradient-gold">🎯 الأهداف المحددة</h4>
            <button
              type="button"
              onClick={addTarget}
              className="flex items-center gap-1 rounded-lg bg-trading-gold/10 px-2.5 py-1.5 text-xs text-trading-gold hover:bg-trading-gold/20"
            >
              <Plus className="h-3.5 w-3.5" />
              إضافة هدف
            </button>
          </div>

          <div className="space-y-2">
            {targets.map((target, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-trading-bg text-sm font-bold text-trading-gold">
                  {target.order}
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-[11px] text-trading-text-secondary">سعر الهدف</label>
                  <input
                    type="number"
                    step="any"
                    value={target.price}
                    onChange={(e) => updateTarget(index, 'price', e.target.value)}
                    placeholder="2342.00"
                    className={inputClass}
                  />
                </div>
                <div className="w-20">
                  <label className="mb-1 block text-[11px] text-trading-text-secondary">النسبة %</label>
                  <input
                    type="number"
                    step="any"
                    value={target.percentage}
                    onChange={(e) => updateTarget(index, 'percentage', e.target.value)}
                    placeholder="25"
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeTarget(index)}
                  className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-trading-border text-trading-text-secondary hover:border-trading-sell hover:text-trading-sell"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        {error && (
          <div className="rounded-lg bg-trading-sell/10 border border-trading-sell/20 p-3 text-center text-sm text-trading-sell">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-trading-buy/10 border border-trading-buy/20 p-3 text-center text-sm text-trading-buy">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-trading-gold to-yellow-600 py-3 text-sm font-bold text-trading-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-trading-bg border-t-transparent" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              {editingSignal ? 'تحديث الإشارة' : 'نشر الإشارة'}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
