import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // التحقق من حالة المستخدم المصادق عليه
    if (token) {
      try {
        const users = await db.$queryRawUnsafe(
          `SELECT id, "isApproved", "isBlocked" FROM "User" WHERE "sessionToken" = $1`,
          token
        ) as any[];

        if (users && users.length > 0) {
          const user = users[0];
          if (user.isBlocked) {
            return NextResponse.json({ error: 'تم حظر هذا الحساب', code: 'BLOCKED' }, { status: 403 });
          }
          if (!user.isApproved) {
            return NextResponse.json({ approved: false, message: 'بانتظار موافقة الإدارة' });
          }
        }
      } catch {}
    }

    // المدير أو المستخدمون المعتمدون يحصلون على جميع الإشارات
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
