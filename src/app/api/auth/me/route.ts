import { NextRequest, NextResponse } from 'next/server';
import { getUserByToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    const user = await getUserByToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'غير مصادق' },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: 'خطأ في التحقق من الجلسة' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'غير مصادق' }, { status: 401 });
    }

    const { db } = await import('@/lib/db');
    await db.user.updateMany({
      where: { sessionToken: token },
      data: { sessionToken: null },
    });

    return NextResponse.json({ success: true, message: 'تم تسجيل الخروج' });
  } catch {
    return NextResponse.json(
      { error: 'خطأ أثناء تسجيل الخروج' },
      { status: 500 }
    );
  }
}
