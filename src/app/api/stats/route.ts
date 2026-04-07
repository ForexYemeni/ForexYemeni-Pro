import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const signals = await db.signal.findMany({
      where: {
        status: { in: ['TP_HIT', 'SL_HIT', 'CLOSED'] },
      },
    });

    const totalTrades = signals.length;
    const winTrades = signals.filter(
      (s) => s.status === 'TP_HIT' || s.status === 'CLOSED'
    ).length;
    const lossTrades = signals.filter((s) => s.status === 'SL_HIT').length;

    // Also count active signals
    const activeSignals = await db.signal.count({
      where: { status: 'ACTIVE' },
    });

    const allSignals = await db.signal.count();

    const winRate = totalTrades > 0 ? ((winTrades / totalTrades) * 100).toFixed(1) : '0';

    return NextResponse.json({
      totalTrades: allSignals,
      closedTrades: totalTrades,
      winTrades,
      lossTrades,
      winRate: parseFloat(winRate),
      activeSignals,
    });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الإحصائيات' },
      { status: 500 }
    );
  }
}
