import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateOTP, generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json();

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'البريد الإلكتروني مسجل مسبقاً' }, { status: 400 });
    }

    const hashedPassword = hashPassword(password);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const trialEnds = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'USER',
        status: 'PENDING',
        plan: 'TRIAL',
        trialEndsAt: trialEnds,
        otpCode: otp,
        otpExpiresAt: otpExpires,
      },
    });

    return NextResponse.json({
      message: 'تم إنشاء الحساب بنجاح',
      otp, // For demo purposes - in production, send via email
      userId: user.id,
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء التسجيل' }, { status: 500 });
  }
}
