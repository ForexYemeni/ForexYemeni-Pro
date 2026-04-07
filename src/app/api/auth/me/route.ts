import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'غير مصادق' }, { status: 401 });
    }

    const { db } = await import('@/lib/db');
    const users = await db.$queryRawUnsafe(
      `SELECT id, email, name, role, "createdAt", "isApproved", "isBlocked" FROM "User" WHERE "sessionToken" = $1`,
      token
    ) as any[];

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'غير مصادق' }, { status: 401 });
    }

    const user = users[0];
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'خطأ في التحقق من الجلسة' }, { status: 500 });
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
