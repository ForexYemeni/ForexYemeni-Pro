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

    let user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        plan: true,
        trialEndsAt: true,
        lotSize: true,
        accBalance: true,
        riskPct: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // Check if trial expired
    if (user.plan === 'TRIAL' && user.trialEndsAt && new Date() > user.trialEndsAt) {
      user = await db.user.update({
        where: { id: user.id },
        data: { plan: 'BASIC' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          plan: true,
          trialEndsAt: true,
          lotSize: true,
          accBalance: true,
          riskPct: true,
          createdAt: true,
        },
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
