import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
    }

    const signals = await db.signal.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: {
        readBy: {
          where: { userId: payload.userId },
          select: { id: true },
        },
      },
    });

    const signalsWithReadStatus = signals.map(signal => ({
      ...signal,
      isRead: signal.readBy.length > 0,
      readBy: undefined,
    }));

    return NextResponse.json({ signals: signalsWithReadStatus });
  } catch (error) {
    console.error('Get signals error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
