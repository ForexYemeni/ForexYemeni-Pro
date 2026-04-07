import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const signals = await db.signal.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ signals });
  } catch (error) {
    console.error('List signals error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await req.json();
    const { type, pair, entry, stopLoss, stopLossType, targets, stars, lotSize, riskAmount, notes } = body;

    if (!type || !pair || !entry || !stopLoss || !targets || !Array.isArray(targets)) {
      return NextResponse.json({ error: 'جميع الحقول المطلوبة يجب ملؤها' }, { status: 400 });
    }

    const signal = await db.signal.create({
      data: {
        type: type.toUpperCase(),
        pair: pair.toUpperCase(),
        entry: parseFloat(entry),
        stopLoss: parseFloat(stopLoss),
        stopLossType: stopLossType || 'FIXED',
        targets: JSON.stringify(targets),
        stars: parseInt(stars) || 3,
        lotSize: lotSize || '0.01',
        riskAmount: parseFloat(riskAmount) || 0,
        totalTargets: targets.length,
        currentTP: 0,
        status: 'ACTIVE',
        notes: notes || null,
        createdById: admin.userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ message: 'تم إنشاء الإشارة', signal }, { status: 201 });
  } catch (error) {
    console.error('Create signal error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء الإشارة' }, { status: 500 });
  }
}
