import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const signals = await db.signal.findMany({
      include: {
        targets: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(signals);
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الإشارات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      pair,
      timeframe,
      entryPrice,
      stopLoss,
      stopLossType,
      riskPercent,
      riskAmount,
      lotSize,
      lotType,
      balance,
      stars,
      mtfTrend,
      smcStructure,
      targets,
    } = body;

    const signal = await db.signal.create({
      data: {
        type: type || 'BUY',
        pair: pair || '',
        timeframe: timeframe || 'H1',
        entryPrice: parseFloat(entryPrice) || 0,
        stopLoss: parseFloat(stopLoss) || 0,
        stopLossType: stopLossType || 'ATR',
        riskPercent: parseFloat(riskPercent) || 5.0,
        riskAmount: parseFloat(riskAmount) || 0,
        lotSize: parseFloat(lotSize) || 0,
        lotType: lotType || '',
        balance: parseFloat(balance) || 100,
        stars: parseInt(stars) || 1,
        mtfTrend: mtfTrend || 'BULLISH',
        smcStructure: smcStructure || 'BULLISH',
        status: 'ACTIVE',
        targets: {
          create: (targets || []).map(
            (t: { price: number; percentage: number; order: number }) => ({
              order: t.order || 1,
              price: parseFloat(String(t.price)) || 0,
              percentage: parseFloat(String(t.percentage)) || 0,
              status: 'PENDING',
            })
          ),
        },
      },
      include: {
        targets: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(signal, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الإشارة' },
      { status: 500 }
    );
  }
}
