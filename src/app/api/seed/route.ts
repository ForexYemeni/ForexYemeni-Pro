import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Seed admin
    const existingAdmin = await db.admin.findUnique({
      where: { username: 'admin' },
    });

    if (!existingAdmin) {
      await db.admin.create({
        data: {
          username: 'admin',
          password: 'forex2024',
          name: 'المدير العام',
        },
      });
    }

    // Seed sample license keys
    const existingLicenses = await db.licenseKey.count();
    if (existingLicenses === 0) {
      await db.licenseKey.createMany({
        data: [
          { code: 'FY-PRO-2024-A1B2', plan: 'PRO', isActive: true },
          { code: 'FY-VIP-2024-C3D4', plan: 'VIP', isActive: true },
          { code: 'FY-BASIC-2024-E5F6', plan: 'BASIC', isActive: true },
        ],
      });
    }

    // Seed sample signals
    const existingSignals = await db.signal.count();
    if (existingSignals === 0) {
      // Signal 1: Active BUY XAUUSD
      const signal1 = await db.signal.create({
        data: {
          type: 'BUY',
          pair: 'XAUUSD',
          timeframe: 'M15',
          entryPrice: 2340.50,
          stopLoss: 2335.20,
          stopLossType: 'ATR',
          riskPercent: 5.0,
          riskAmount: 5.0,
          lotSize: 0.10,
          lotType: 'قياسي',
          balance: 100,
          stars: 2,
          mtfTrend: 'BULLISH',
          smcStructure: 'BULLISH',
          status: 'ACTIVE',
          tpReached: 0,
          alertText: '',
        },
      });

      await db.signalTarget.createMany({
        data: [
          { signalId: signal1.id, order: 1, price: 2342.00, percentage: 25, status: 'PENDING' },
          { signalId: signal1.id, order: 2, price: 2344.50, percentage: 25, status: 'PENDING' },
          { signalId: signal1.id, order: 3, price: 2347.00, percentage: 25, status: 'PENDING' },
          { signalId: signal1.id, order: 4, price: 2350.00, percentage: 25, status: 'PENDING' },
        ],
      });

      // Signal 2: Completed SELL EURUSD
      const signal2 = await db.signal.create({
        data: {
          type: 'SELL',
          pair: 'EURUSD',
          timeframe: 'H1',
          entryPrice: 1.0850,
          stopLoss: 1.0890,
          stopLossType: 'Swing',
          riskPercent: 3.0,
          riskAmount: 3.0,
          lotSize: 0.05,
          lotType: 'ميكرو',
          balance: 100,
          stars: 3,
          mtfTrend: 'BEARISH',
          smcStructure: 'BEARISH',
          status: 'TP_HIT',
          tpReached: 3,
          alertText: '',
        },
      });

      await db.signalTarget.createMany({
        data: [
          { signalId: signal2.id, order: 1, price: 1.0835, percentage: 30, status: 'HIT' },
          { signalId: signal2.id, order: 2, price: 1.0820, percentage: 30, status: 'HIT' },
          { signalId: signal2.id, order: 3, price: 1.0800, percentage: 40, status: 'HIT' },
        ],
      });

      // Signal 3: SL hit GBPUSD
      const signal3 = await db.signal.create({
        data: {
          type: 'BUY',
          pair: 'GBPUSD',
          timeframe: 'H4',
          entryPrice: 1.2720,
          stopLoss: 1.2680,
          stopLossType: 'FVG',
          riskPercent: 2.0,
          riskAmount: 2.0,
          lotSize: 0.03,
          lotType: 'ميكرو',
          balance: 100,
          stars: 1,
          mtfTrend: 'BULLISH',
          smcStructure: 'BEARISH',
          status: 'SL_HIT',
          tpReached: 0,
          alertText: '',
        },
      });

      await db.signalTarget.createMany({
        data: [
          { signalId: signal3.id, order: 1, price: 1.2750, percentage: 33, status: 'PENDING' },
          { signalId: signal3.id, order: 2, price: 1.2780, percentage: 33, status: 'PENDING' },
          { signalId: signal3.id, order: 3, price: 1.2820, percentage: 34, status: 'PENDING' },
        ],
      });

      // Signal 4: Partially hit
      const signal4 = await db.signal.create({
        data: {
          type: 'SELL',
          pair: 'USDJPY',
          timeframe: 'M30',
          entryPrice: 154.50,
          stopLoss: 155.00,
          stopLossType: 'ATR',
          riskPercent: 4.0,
          riskAmount: 4.0,
          lotSize: 0.08,
          lotType: 'قياسي',
          balance: 100,
          stars: 2,
          mtfTrend: 'BEARISH',
          smcStructure: 'BEARISH',
          status: 'ACTIVE',
          tpReached: 2,
          alertText: '',
        },
      });

      await db.signalTarget.createMany({
        data: [
          { signalId: signal4.id, order: 1, price: 154.20, percentage: 25, status: 'HIT' },
          { signalId: signal4.id, order: 2, price: 153.90, percentage: 25, status: 'HIT' },
          { signalId: signal4.id, order: 3, price: 153.50, percentage: 25, status: 'PENDING' },
          { signalId: signal4.id, order: 4, price: 153.00, percentage: 25, status: 'PENDING' },
        ],
      });
    }

    return NextResponse.json({ success: true, message: 'تم تهيئة البيانات بنجاح' });
  } catch (error) {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تهيئة البيانات', details: String(error) },
      { status: 500 }
    );
  }
}
