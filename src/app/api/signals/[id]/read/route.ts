import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    await db.readSignal.upsert({
      where: {
        userId_signalId: {
          userId: payload.userId,
          signalId: id,
        },
      },
      create: {
        userId: payload.userId,
        signalId: id,
      },
      update: {},
    });

    return NextResponse.json({ message: 'تم تسجيل القراءة' });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
