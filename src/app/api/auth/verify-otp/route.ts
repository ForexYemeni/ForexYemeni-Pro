import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكود التفعيل مطلوبان' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    if (!user.otpCode || user.otpCode !== otp) {
      return NextResponse.json({ error: 'كود التفعيل غير صحيح' }, { status: 400 });
    }

    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      return NextResponse.json({ error: 'كود التفعيل منتهي الصلاحية' }, { status: 400 });
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        otpCode: null,
        otpExpiresAt: null,
        status: 'ACTIVE',
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      message: 'تم تفعيل الحساب بنجاح',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: 'ACTIVE',
        plan: user.plan,
        trialEndsAt: user.trialEndsAt,
        lotSize: user.lotSize,
        accBalance: user.accBalance,
        riskPct: user.riskPct,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء التحقق' }, { status: 500 });
  }
}
